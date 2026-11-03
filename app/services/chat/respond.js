import "server-only";
import { getAdapter } from "../ai";
import { searchWeb, supportsWebSearch } from "../ai/webSearch";
import { resolveGithubAccess } from "../github/settings";
import { buildKnowledge } from "./knowledge";
import { checkIntent, offTopicReply } from "./intent";
import { personaInstructions, turnNote, webDisclaimer } from "./persona";
import { createChatTools } from "./tools";

// Enough rounds to read a README, list a folder and open a couple of files before answering.
const MAX_TOOL_ROUNDS = 6;

const REFUSAL_NOTE = "I can't help with that one. Feel free to ask me about my work, projects or experience.";

/**
 * Writes one chat reply. Shared by the public chat (which streams it) and the admin test set
 * (which grades it), so both exercise exactly the same chat:
 * 1. a quick intent check: off-topic messages get a short decline and stop here;
 * 2. only then the knowledge and GitHub access are loaded and the answer is written, running
 *    tools between model turns.
 * @param {{ provider: object, content: object, history: object[], message: string, audience?: string,
 *           loadContext: () => Promise<{ knowledge: {text: string, content: object}, github: object | null }>,
 *           dryRun?: boolean, onText?: (delta: string) => void, onStatus?: (text: string) => void,
 *           onQuerySaved?: () => void }} options
 *        dryRun keeps raise_query from filing anything in the inbox.
 * @returns {Promise<{ reply: string, toolsUsed: string[], offTopic: boolean }>}
 */
export async function generateReply({
  provider,
  content,
  history,
  message,
  audience,
  loadContext,
  dryRun = false,
  onText = () => {},
  onStatus = () => {},
  onQuerySaved = () => {},
}) {
  const intent = await checkIntent({ provider, content, history, message });
  if (intent.offTopic) {
    const reply = offTopicReply(intent.suggestion);
    onText(reply);
    return { reply, toolsUsed: [], offTopic: true };
  }

  const { knowledge, github } = await loadContext();
  const adapter = getAdapter(provider);
  const instructions = personaInstructions(knowledge.content);
  const knowledgeText = `Knowledge you may answer from:\n\n${knowledge.text}`;
  // Provider-neutral conversation: {role: "user" | "assistant", content}, plus, within a reply,
  // assistant turns with toolCalls and {role: "tool", results} turns. Adapters convert it.
  // The note only goes to the model; the transcript keeps the visitor's own words.
  const messages = [...history, { role: "user", content: `${message}\n\n${turnNote(knowledge.content, audience)}` }];
  const canSearch = provider.webSearch !== false && supportsWebSearch(provider);
  const tools = createChatTools({
    github,
    visitorMessage: message,
    onStatus,
    onQuerySaved,
    dryRun,
    searchWeb: canSearch ? (query) => searchWeb(provider, query) : null,
  });
  const toolsUsed = [];

  let reply = "";
  const emit = (text) => {
    reply += text;
    onText(text);
  };
  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    let turnText = "";
    const turn = await adapter.streamChat({
      instructions,
      knowledge: knowledgeText,
      messages,
      tools: tools.definitions,
      onText: (delta) => {
        turnText += delta;
        emit(delta);
      },
    });

    if (turn.stopReason === "refusal") {
      emit(reply ? `\n\n${REFUSAL_NOTE}` : REFUSAL_NOTE);
      break;
    }
    if (turn.stopReason !== "tool_calls" || !turn.toolCalls.length) break;

    messages.push({ role: "assistant", content: turnText, toolCalls: turn.toolCalls, raw: turn.raw });
    const results = [];
    for (const toolCall of turn.toolCalls) {
      toolsUsed.push(toolCall.name);
      results.push(await tools.run(toolCall));
    }
    messages.push({ role: "tool", results });
    if (reply && !reply.endsWith("\n")) emit("\n\n");
  }
  // Added here rather than left to the model, so an answer that used the web is always labelled.
  const webSources = tools.webSources();
  if (webSources && reply.trim()) emit(`${reply.endsWith("\n") ? "\n" : "\n\n"}${webDisclaimer(knowledge.content, webSources)}`);
  return { reply: reply.trim(), toolsUsed, offTopic: false };
}

/** What an on-topic answer needs: the knowledge and the GitHub access for the chat's tools. */
export async function loadChatContext() {
  const [knowledge, github] = await Promise.all([
    buildKnowledge(),
    resolveGithubAccess().catch((error) => {
      console.error("Loading GitHub settings failed, chatting without it:", error);
      return null;
    }),
  ]);
  return { knowledge, github };
}
