import "server-only";
import { z } from "zod";
import { GithubError, getRepositoryOverview, listFiles, readFile, searchCode } from "../github/api";
import { createVisitorQuery } from "../queries/visitorQueries";
import { AiProviderError } from "../ai/errors";
import { redactSensitiveData } from "../privacy/sensitiveData";

/*
 * The tools the portfolio chat can call, as provider-neutral definitions (each AI adapter converts
 * them) plus the code that runs them. Every input is validated here, since models can send anything.
 */

const MAX_QUERIES_PER_REPLY = 1;
// Searches cost more than a normal reply, so one per reply is plenty for a fallback.
const MAX_SEARCHES_PER_REPLY = 1;

const WebSearchInput = z.object({ query: z.string().trim().min(3).max(300) });

const webSearchTool = {
  name: "web_search",
  description:
    "Search the web. Only for questions that are in scope (about Burhanuddin, his work, or the companies, products and technologies he has worked with) and that the knowledge and other tools don't answer. Check the knowledge first. Include his full name when the question is about him.",
  parameters: {
    type: "object",
    properties: { query: { type: "string", description: "What to search for, as a clear standalone question." } },
    required: ["query"],
  },
};

const RaiseQueryInput = z.object({
  question: z.string().trim().min(3).max(500),
  visitor_name: z.string().trim().max(80).nullish(),
  visitor_email: z.string().trim().email().max(200).nullish().or(z.literal("")),
});

const raiseQuery = {
  name: "raise_query",
  description:
    "Pass a visitor's question to the real Burhanuddin's inbox when it can't be answered from the knowledge provided, or when it needs his personal answer. Include the visitor's name and email only if they shared them.",
  parameters: {
    type: "object",
    properties: {
      question: { type: "string", description: "The visitor's question, rephrased to make sense on its own." },
      visitor_name: { type: "string", description: "The visitor's name, if they gave it." },
      visitor_email: { type: "string", description: "The visitor's email address, if they gave it." },
    },
    required: ["question"],
  },
};

function githubTools(repos, { canSearch }) {
  const repo = { type: "string", enum: repos, description: "Repository, as owner/name." };
  return [
    {
      name: "github_repo_overview",
      description:
        "Get a repository's description, README, languages, top-level files and recent commits. Start here for detailed questions about a project's code.",
      parameters: { type: "object", properties: { repo }, required: ["repo"] },
    },
    {
      name: "github_list_files",
      description: "List the files and folders at a path in a repository (the root when path is empty).",
      parameters: {
        type: "object",
        properties: { repo, path: { type: "string", description: "Folder path, e.g. app/services. Empty for the root." } },
        required: ["repo"],
      },
    },
    {
      name: "github_read_file",
      description: "Read one text file from a repository. Long files are truncated.",
      parameters: {
        type: "object",
        properties: { repo, path: { type: "string", description: "File path, e.g. app/page.js" } },
        required: ["repo", "path"],
      },
    },
    ...(canSearch
      ? [
          {
            name: "github_search_code",
            description: "Search a repository's code for a word or identifier. Returns matching file paths and snippets.",
            parameters: {
              type: "object",
              properties: { repo, query: { type: "string", description: "Words or an identifier to look for." } },
              required: ["repo", "query"],
            },
          },
        ]
      : []),
  ];
}

const GITHUB_INPUT = {
  github_repo_overview: z.object({ repo: z.string() }),
  github_list_files: z.object({ repo: z.string(), path: z.string().max(300).nullish() }),
  github_read_file: z.object({ repo: z.string(), path: z.string().min(1).max(300) }),
  github_search_code: z.object({ repo: z.string(), query: z.string().trim().min(2).max(100) }),
};

const shortName = (fullName) => fullName.split("/")[1];

/**
 * Tools for one chat reply.
 * @param {{ github: {repos: string[], token: string | null} | null, visitorMessage: string,
 *           searchWeb?: ((query: string) => Promise<{summary: string, sources: {url, title}[]}>) | null,
 *           onStatus: (text: string) => void, onQuerySaved: () => void, dryRun?: boolean }} context
 *        dryRun answers raise_query as if it worked without filing anything (used by the admin test set).
 * @returns {{ definitions: object[], run: (call: {id, name, input}) => Promise<{toolCallId, content, isError?}>,
 *            webSources: () => {url, title}[] | null }} webSources is null unless a search returned something.
 */
export function createChatTools({ github, visitorMessage, onStatus, onQuerySaved, searchWeb = null, dryRun = false }) {
  let queriesSaved = 0;
  let searches = 0;
  let webSources = null;
  const definitions = [
    raiseQuery,
    ...(github ? githubTools(github.repos, { canSearch: Boolean(github.token) }) : []),
    ...(searchWeb ? [webSearchTool] : []),
  ];

  async function runWebSearch(input) {
    const parsed = WebSearchInput.safeParse(input);
    if (!parsed.success) return { content: "Invalid input. A query of 3-300 characters is required.", isError: true };
    if (searches >= MAX_SEARCHES_PER_REPLY) return { content: "Already searched once for this reply; answer with what you have." };
    searches += 1;
    onStatus("Searching the web…");
    try {
      const { summary, sources } = await searchWeb(parsed.data.query);
      if (!summary.trim()) return { content: "The web search found nothing useful." };
      webSources = [...(webSources ?? []), ...sources];
      // Web pages can carry phone numbers and the like; the chat never repeats those.
      return { content: JSON.stringify({ summary: redactSensitiveData(summary), sources }) };
    } catch (error) {
      if (error instanceof AiProviderError) {
        console.error("Web search failed:", error.message);
        return { content: "Web search isn't available right now.", isError: true };
      }
      throw error;
    }
  }

  async function runGithub(name, input) {
    const parsed = GITHUB_INPUT[name].safeParse(input);
    if (!parsed.success) return { content: "Invalid input for this tool.", isError: true };
    const { repo } = parsed.data;
    if (!github.repos.includes(repo)) return { content: `Only these repositories are available: ${github.repos.join(", ")}`, isError: true };
    const options = { token: github.token };
    try {
      switch (name) {
        case "github_repo_overview":
          onStatus(`Looking at ${shortName(repo)} on GitHub…`);
          return { content: JSON.stringify(await getRepositoryOverview(repo, options)) };
        case "github_list_files":
          onStatus(`Browsing ${shortName(repo)}…`);
          return { content: (await listFiles(repo, parsed.data.path ?? "", options)).join("\n") || "(empty folder)" };
        case "github_read_file":
          onStatus(`Reading ${parsed.data.path.split("/").pop()}…`);
          return { content: await readFile(repo, parsed.data.path, options) };
        case "github_search_code":
          onStatus(`Searching ${shortName(repo)}…`);
          return { content: JSON.stringify(await searchCode(repo, parsed.data.query, options)) };
      }
    } catch (error) {
      if (error instanceof GithubError) return { content: error.message, isError: true };
      throw error;
    }
  }

  async function runRaiseQuery(input) {
    const parsed = RaiseQueryInput.safeParse(input);
    if (!parsed.success) {
      return { content: "Invalid input. A question of 3-500 characters is required, and the email must be valid.", isError: true };
    }
    if (queriesSaved >= MAX_QUERIES_PER_REPLY) return { content: "Already passed on." };
    if (!dryRun) await createVisitorQuery({
      question: parsed.data.question,
      visitorName: parsed.data.visitor_name || null,
      visitorEmail: parsed.data.visitor_email || null,
      context: `Visitor asked: ${visitorMessage}`.slice(0, 1000),
    });
    queriesSaved += 1;
    onQuerySaved();
    return { content: "Saved to Burhanuddin's inbox." };
  }

  async function run(call) {
    let result;
    if (call.name === "raise_query") result = await runRaiseQuery(call.input);
    else if (searchWeb && call.name === "web_search") result = await runWebSearch(call.input);
    else if (github && call.name in GITHUB_INPUT) result = await runGithub(call.name, call.input);
    else result = { content: `Unknown tool: ${call.name}`, isError: true };
    return { toolCallId: call.id, ...result };
  }

  return { definitions, run, webSources: () => webSources };
}
