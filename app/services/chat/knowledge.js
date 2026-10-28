import "server-only";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "../db/client";
import { documents } from "../db/schema";
import { getPublishedContent } from "../content/siteContent";
import { redactSensitiveData } from "../privacy/sensitiveData";
import { outsideWork } from "../../data/siteData";
import { listRepositories } from "../github/api";
import { getGithubSettings, getGithubToken } from "../github/settings";
import { getLeetcodeProfile } from "../leetcode/api";
import { getLeetcodeSettings } from "../leetcode/settings";

/** Renders the published site content as plain text for the model. */
export function contentToText(content) {
  const { profile, education, experience, projects, impactNumbers, skillGroups } = content;
  const lines = [
    `Name: ${profile.firstName} ${profile.lastName}`,
    `Role: ${profile.role} (${profile.yearsExperience} years of experience)`,
    `Location: ${profile.location}`,
    profile.openTo && `Open to: ${profile.openTo}`,
    `Public email: ${profile.email}`,
    `Focus areas: ${profile.focusAreas.join(", ")}`,
    "",
    ...profile.summary,
    "",
    `Education: ${education.degree}, ${education.school}${education.score ? ` (${education.score})` : ""}`,
    "",
    "Experience:",
    ...[...experience].reverse().flatMap((job) => [
      `- ${job.role} at ${job.company}, ${job.place}, ${job.period}${job.current ? " (current)" : ""}. ${job.logline}`,
      ...job.highlights.map((highlight) => `  - ${highlight.title}: ${highlight.text}`),
    ]),
    "",
    "Projects:",
    ...projects.flatMap((project) => [
      `- ${project.title} (${project.subtitle}; ${project.kind}). ${project.logline}`,
      ...project.points.map((point) => `  - ${point}`),
      `  Tech: ${project.tech.join(", ")}`,
      ...project.links.map((link) => `  ${link.label}: ${link.href}`),
    ]),
    "",
    "Results:",
    ...impactNumbers.map((item) => `- ${item.value} ${item.label} (${item.source})`),
    "",
    "Skills:",
    ...skillGroups.map((group) => `- ${group.name}: ${group.items.join(", ")}`),
    "",
    `Outside work: ${outsideWork.join(", ")}.`,
    "",
    `Problem solving: ${profile.problemSolving.solved} LeetCode problems (${profile.problemSolving.medium} medium, ${profile.problemSolving.hard} hard), mostly in ${profile.problemSolving.language}.`,
    "",
    "Links:",
    ...Object.entries(profile.links)
      .filter(([, href]) => href)
      .map(([name, href]) => `- ${name}: ${href}`),
  ];
  return lines.filter((line) => line !== false && line !== undefined && line !== null).join("\n");
}

/** The repositories the chat may explore with its GitHub tools, linked to the site's projects. */
async function githubSection(content) {
  const settings = await getGithubSettings();
  if (!settings.repos.length) return null;
  const token = await getGithubToken();
  const known = await listRepositories({ username: settings.username, token }).catch(() => []);
  const details = new Map(known.map((repo) => [repo.fullName.toLowerCase(), repo]));
  const lines = settings.repos.map((fullName) => {
    const repo = details.get(fullName.toLowerCase());
    const project = content.projects.find((item) =>
      item.links.some((link) => link.href.toLowerCase().includes(`github.com/${fullName.toLowerCase()}`))
    );
    return [
      `- ${fullName}`,
      repo?.description && `: ${repo.description}`,
      repo?.language && ` (${repo.language})`,
      project && `. Site project: ${project.title}`,
      repo?.homepage && `. Live: ${repo.homepage}`,
    ]
      .filter(Boolean)
      .join("");
  });
  return `<github_repositories>
Repositories you can explore with the github tools for detailed questions about how a project is built:
${lines.join("\n")}
</github_repositories>`;
}

/** Live public LeetCode stats, when enabled in Admin → Sources. */
async function leetcodeSection() {
  const settings = await getLeetcodeSettings();
  if (!settings.enabled || !settings.username) return null;
  const profile = await getLeetcodeProfile(settings.username);
  if (!profile) return null;
  const list = (items) => items.map((item) => `${item.name} (${item.solved})`).join(", ");
  const lines = [
    profile.solved &&
      `Solved: ${profile.solved.total} problems (${profile.solved.easy} easy, ${profile.solved.medium} medium, ${profile.solved.hard} hard)`,
    profile.ranking && `Global ranking: ${profile.ranking.toLocaleString("en")}`,
    profile.languages?.length && `Languages: ${list(profile.languages)}`,
    profile.topTopics?.length && `Most-solved topics: ${list(profile.topTopics)}`,
    profile.contest && `Contests: rating ${profile.contest.rating} over ${profile.contest.contestsAttended} contests (top ${profile.contest.topPercentage}%)`,
    profile.badges?.length && `Badges: ${profile.badges.join(", ")}`,
    profile.recentlySolved?.length &&
      `Recently solved: ${profile.recentlySolved.map((item) => `${item.title} (${item.date})`).join(", ")}`,
  ].filter(Boolean);
  return `<leetcode_profile username="${profile.username}" fetched="${profile.fetchedAt}">
Live from leetcode.com; prefer these numbers over older ones elsewhere.
${lines.join("\n")}
</leetcode_profile>`;
}

/** Runs an optional knowledge source, leaving it out if it fails. */
function optional(load, label) {
  return load().catch((error) => {
    console.error(`${label} couldn't be added to the chat knowledge:`, error);
    return null;
  });
}

/**
 * Everything the chat may draw on: the published site content plus the text of documents the
 * admin allowed, with detected sensitive values removed. Ordered deterministically so the
 * prompt prefix (and its cache) stays stable until the content or documents change.
 */
export async function buildKnowledge() {
  const { content } = await getPublishedContent();
  const db = getDb();
  const allowedDocuments = db
    ? await db
        .select({ name: documents.name, text: documents.extractedText })
        .from(documents)
        .where(and(eq(documents.useInChat, true), isNotNull(documents.extractedText)))
        .orderBy(asc(documents.uploadedAt))
    : [];

  const [github, leetcode] = await Promise.all([
    optional(() => githubSection(content), "GitHub"),
    optional(leetcodeSection, "LeetCode"),
  ]);

  const allowed = [content.profile.email];
  const sections = [
    `<portfolio_content>\n${contentToText(content)}\n</portfolio_content>`,
    github,
    leetcode,
    ...allowedDocuments.map(
      (document) =>
        `<document name="${document.name.replace(/"/g, "'")}">\n${redactSensitiveData(document.text, { allowed })}\n</document>`
    ),
  ];
  const text = sections.filter(Boolean).join("\n\n");
  return { text, content, documentCount: allowedDocuments.length, approxTokens: Math.ceil(text.length / 4) };
}
