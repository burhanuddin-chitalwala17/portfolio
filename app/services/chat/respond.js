import "server-only";
import { getAdapter } from "../ai";
import { personaInstructions, turnNote } from "./persona";
import { createChatTools } from "./tools";

// Enough rounds to read a README, list a folder and open a couple of files before answering.
const MAX_TOOL_ROUNDS = 6;

const REFUSAL_NOTE = "I can't help with that one. Feel free to ask me about my work, projects or experience.";

/**
 * Writes one chat reply, running tools between model turns. Shared by the public chat (which
 * streams it) and the admin test set (which grades it), so both exercise exactly the same chat.
 * @param {{ provider: object, knowledge: {text: string, content: object}, history: object[],
 *           message: string, audience?: string, github: object | null, dryRun?: boolean,
 *           onText?: (delta: string) => void, onStatus?: (text: string) => void,
 *           onQuerySaved?: () => void }} options
 *        dryRun keeps raise_query from filing anything in the inbox.
 * @returns {Promise<{ reply: string, toolsUsed: string[] }>}
 */
export async function generateReply({
  provider,
  knowledge,
  history,
  message,
  audience,
  github,
  dryRun = false,
  onText = () => {},
  onStatus = () => {},
  onQuerySaved = () => {},
}) {
  const adapter = getAdapter(provider);
  const instructions = personaInstructions(knowledge.content);
  const knowledgeText = `Knowledge you may answer from:\n\n${knowledge.text}`;
  // Provider-neutral conversation: {role: "user" | "assistant", content}, plus, within a reply,
  // assistant turns with toolCalls and {role: "tool", results} turns. Adapters convert it.
  // The note only goes to the model; the transcript keeps the visitor's own words.
  const messages = [...history, { role: "user", content: `${message}\n\n${turnNote(knowledge.content, audience)}` }];
  const tools = createChatTools({ github, visitorMessage: message, onStatus, onQuerySaved, dryRun });
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
  return { reply: reply.trim(), toolsUsed };
}
