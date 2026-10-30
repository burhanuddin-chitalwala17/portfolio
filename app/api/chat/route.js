import { NextResponse } from "next/server";
import { z } from "zod";
import { AiProviderError, resolveAiTask } from "../../services/ai";
import { CHAT_LIMITS } from "../../services/chat/config";
import { buildKnowledge } from "../../services/chat/knowledge";
import {
  appendMessage,
  countVisitorMessages,
  getOrCreateConversation,
  loadHistory,
} from "../../services/chat/history";
import { generateReply } from "../../services/chat/respond";
import { resolveGithubAccess } from "../../services/github/settings";
import { clientIpHash } from "../../services/request/clientIp";

export const maxDuration = 60;

const RequestSchema = z.object({
  conversationId: z.string().max(64).nullish(),
  message: z.string().trim().min(1).max(CHAT_LIMITS.maxMessageCharacters),
  // The visitor type picked on the site, so answers lead with what that visitor cares about.
  audience: z.enum(["recruiter", "engineer", "browsing"]).nullish().catch(null),
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
 * Body: { conversationId?: string, message: string, audience?: "recruiter" | "engineer" | "browsing" }
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

  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const send = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      send({ type: "conversation", id: conversation.id });
      try {
        const { reply } = await generateReply({
          provider,
          knowledge,
          history,
          message: parsed.data.message,
          audience: parsed.data.audience,
          github,
          onText: (text) => send({ type: "text", text }),
          onStatus: (text) => send({ type: "status", text }),
          onQuerySaved: () => send({ type: "query_saved" }),
        });
        if (reply) await appendMessage(conversation.id, "assistant", reply);
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
