import { NextResponse } from "next/server";
import { z } from "zod";
import { AiProviderError, getAdapter, resolveAiTask } from "../../services/ai";
import { CHAT_LIMITS } from "../../services/chat/config";
import { buildKnowledge } from "../../services/chat/knowledge";
import { personaInstructions } from "../../services/chat/persona";
import {
  appendMessage,
  countVisitorMessages,
  getOrCreateConversation,
  loadHistory,
} from "../../services/chat/history";
import { createVisitorQuery } from "../../services/queries/visitorQueries";
import { clientIpHash } from "../../services/request/clientIp";

export const maxDuration = 60;

const MAX_TOOL_ROUNDS = 3;
const MAX_QUERIES_PER_REPLY = 1;

const RequestSchema = z.object({
  conversationId: z.string().max(64).nullish(),
  message: z.string().trim().min(1).max(CHAT_LIMITS.maxMessageCharacters),
});

const RaiseQueryInput = z.object({
  question: z.string().trim().min(3).max(500),
  visitor_name: z.string().trim().max(80).nullish(),
  visitor_email: z.string().trim().email().max(200).nullish().or(z.literal("")),
});

// Provider-neutral tool definitions; each adapter converts them to its API's format.
const TOOLS = [
  {
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
  },
];

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
 * {type: "query_saved"}, {type: "error", message}, {type: "done"}.
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
  try {
    conversation = await getOrCreateConversation(parsed.data.conversationId, ipHash);
    history = await loadHistory(conversation.id, CHAT_LIMITS.maxHistoryMessages - 1);
    await appendMessage(conversation.id, "user", parsed.data.message);
    knowledge = await buildKnowledge();
  } catch (error) {
    console.error("Chat setup failed:", error);
    return jsonError("The chat isn't available right now.", 503);
  }

  const adapter = getAdapter(provider);
  const instructions = personaInstructions(knowledge.content);
  const knowledgeText = `Knowledge you may answer from:\n\n${knowledge.text}`;
  // Provider-neutral conversation: {role: "user" | "assistant", content}, plus, within a reply,
  // assistant turns with toolCalls and {role: "tool", results} turns. Adapters convert it.
  const messages = [...history, { role: "user", content: parsed.data.message }];
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const send = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      send({ type: "conversation", id: conversation.id });

      let reply = "";
      let queriesSaved = 0;
      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
          let turnText = "";
          const turn = await adapter.streamChat({
            instructions,
            knowledge: knowledgeText,
            messages,
            tools: TOOLS,
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
          for (const toolCall of turn.toolCalls) {
            const input = RaiseQueryInput.safeParse(toolCall.input);
            if (toolCall.name !== "raise_query" || !input.success) {
              results.push({
                toolCallId: toolCall.id,
                isError: true,
                content: "Invalid input. A question of 3-500 characters is required, and the email must be valid.",
              });
              continue;
            }
            if (queriesSaved >= MAX_QUERIES_PER_REPLY) {
              results.push({ toolCallId: toolCall.id, content: "Already passed on." });
              continue;
            }
            await createVisitorQuery({
              question: input.data.question,
              visitorName: input.data.visitor_name || null,
              visitorEmail: input.data.visitor_email || null,
              context: `Visitor asked: ${parsed.data.message}`.slice(0, 1000),
            });
            queriesSaved += 1;
            send({ type: "query_saved" });
            results.push({ toolCallId: toolCall.id, content: "Saved to Burhanuddin's inbox." });
          }
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
