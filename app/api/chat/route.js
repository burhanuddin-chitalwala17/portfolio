import { NextResponse } from "next/server";
import { z } from "zod";
import { AiProviderError, getAdapter, resolveAiTask } from "../../services/ai";
import { CHAT_LIMITS } from "../../services/chat/config";
import { buildKnowledge } from "../../services/chat/knowledge";
import { personaInstructions, scopeReminder } from "../../services/chat/persona";
import {
  appendMessage,
  countVisitorMessages,
  getOrCreateConversation,
  loadHistory,
} from "../../services/chat/history";
import { createChatTools } from "../../services/chat/tools";
import { resolveGithubAccess } from "../../services/github/settings";
import { clientIpHash } from "../../services/request/clientIp";

export const maxDuration = 60;

// Enough rounds to read a README, list a folder and open a couple of files before answering.
const MAX_TOOL_ROUNDS = 6;

const RequestSchema = z.object({
  conversationId: z.string().max(64).nullish(),
  message: z.string().trim().min(1).max(CHAT_LIMITS.maxMessageCharacters),
});

function jsonError(message, status) {
  return NextResponse.json({ error: message }, { status });
}

function friendlyError(error) {
  if (error instanceof AiProviderError && (error.kind === "rate_limit" || error.kind === "overloaded")) {
    return "I'm getting a lot of questions right now. Please try again in a minute.";
  }
  if (error instanceof AiProviderError) {
    return "Something went wrong on my side. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

/**
 * POST /api/chat
 * Body: { conversationId?: string, message: string }
 * Streams newline-delimited JSON events: {type: "conversation", id}, {type: "text", text},
 * {type: "status", text} (e.g. while reading GitHub), {type: "query_saved"}, {type: "error", message},
 * {type: "done"}.
 */
export async function POST(request) {
  let provider;
  try {
    provider = await resolveAiTask("chat");
  } catch (error) {
    console.error("Loading AI settings failed:", error);
  }
  if (!provider) return jsonError("The chat isn't available right now.", 503);

  const parsed = RequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return jsonError("Please send a message of up to 1,000 characters.", 400);

  const ipHash = clientIpHash(request);
  const now = Date.now();
  try {
    const [fromVisitor, overall] = await Promise.all([
      countVisitorMessages({ since: new Date(now - 60 * 60 * 1000), ipHash }),
      countVisitorMessages({ since: new Date(now - 24 * 60 * 60 * 1000) }),
    ]);
    if (fromVisitor >= CHAT_LIMITS.messagesPerVisitorPerHour) {
      return jsonError("You've reached the chat limit for now. Please try again in an hour, or email me directly.", 429);
    }
    if (overall >= CHAT_LIMITS.messagesPerDay) {
      return jsonError("The chat has reached its daily limit. Please email me directly instead.", 429);
    }
  } catch (error) {
    console.error("Chat rate-limit check failed:", error);
    return jsonError("The chat isn't available right now.", 503);
  }

  let conversation;
  let history;
  let knowledge;
  let github;
  try {
    conversation = await getOrCreateConversation(parsed.data.conversationId, ipHash);
    history = await loadHistory(conversation.id, CHAT_LIMITS.maxHistoryMessages - 1);
    await appendMessage(conversation.id, "user", parsed.data.message);
    [knowledge, github] = await Promise.all([
      buildKnowledge(),
      resolveGithubAccess().catch((error) => {
        console.error("Loading GitHub settings failed, chatting without it:", error);
        return null;
      }),
    ]);
  } catch (error) {
    console.error("Chat setup failed:", error);
    return jsonError("The chat isn't available right now.", 503);
  }

  const adapter = getAdapter(provider);
  const instructions = personaInstructions(knowledge.content);
  const knowledgeText = `Knowledge you may answer from:\n\n${knowledge.text}`;
  // Provider-neutral conversation: {role: "user" | "assistant", content}, plus, within a reply,
  // assistant turns with toolCalls and {role: "tool", results} turns. Adapters convert it.
  // The reminder only goes to the model; the transcript keeps the visitor's own words.
  const messages = [...history, { role: "user", content: `${parsed.data.message}\n\n${scopeReminder(knowledge.content)}` }];
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const send = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      send({ type: "conversation", id: conversation.id });

      let reply = "";
      const tools = createChatTools({
        github,
        visitorMessage: parsed.data.message,
        onStatus: (text) => send({ type: "status", text }),
        onQuerySaved: () => send({ type: "query_saved" }),
      });
      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
          let turnText = "";
          const turn = await adapter.streamChat({
            instructions,
            knowledge: knowledgeText,
            messages,
            tools: tools.definitions,
            onText: (delta) => {
              turnText += delta;
              reply += delta;
              send({ type: "text", text: delta });
            },
          });

          if (turn.stopReason === "refusal") {
            const note = "I can't help with that one. Feel free to ask me about my work, projects or experience.";
            reply += reply ? `\n\n${note}` : note;
            send({ type: "text", text: reply === note ? note : `\n\n${note}` });
            break;
          }
          if (turn.stopReason !== "tool_calls" || !turn.toolCalls.length) break;

          messages.push({ role: "assistant", content: turnText, toolCalls: turn.toolCalls, raw: turn.raw });
          const results = [];
          for (const toolCall of turn.toolCalls) results.push(await tools.run(toolCall));
          messages.push({ role: "tool", results });
          if (reply && !reply.endsWith("\n")) {
            reply += "\n\n";
            send({ type: "text", text: "\n\n" });
          }
        }
        if (reply.trim()) await appendMessage(conversation.id, "assistant", reply.trim());
        send({ type: "done" });
      } catch (error) {
        console.error("Chat failed:", error);
        send({ type: "error", message: friendlyError(error) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
