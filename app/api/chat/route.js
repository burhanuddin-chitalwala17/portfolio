import { NextResponse } from "next/server";
import { z } from "zod";
import { AiProviderError, resolveAiTask } from "../../services/ai";
import { CHAT_LIMITS } from "../../services/chat/config";
import {
  appendMessage,
  visitorMessageWindow,
  getOrCreateConversation,
  loadHistory,
} from "../../services/chat/history";
import { generateReply, loadChatContext } from "../../services/chat/respond";
import { getPublishedContent } from "../../services/content/siteContent";
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

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/**
 * The response when this visitor (per hour) or the whole site (per day) has used up its messages,
 * or null. `limit.retryAt` is when the oldest message leaves the window, so the chat can say when
 * to come back instead of showing an error.
 */
async function checkLimits(ipHash) {
  const now = Date.now();
  const [visitor, site] = await Promise.all([
    visitorMessageWindow({ since: new Date(now - HOUR), ipHash }),
    visitorMessageWindow({ since: new Date(now - DAY) }),
  ]);
  const reached = [
    visitor.count >= CHAT_LIMITS.messagesPerVisitorPerHour && { scope: "visitor", oldest: visitor.oldest, window: HOUR },
    site.count >= CHAT_LIMITS.messagesPerDay && { scope: "site", oldest: site.oldest, window: DAY },
  ]
    .filter(Boolean)
    .map(({ scope, oldest, window }) => ({ scope, retryAt: new Date((oldest?.getTime() ?? now) + window + 60_000) }))
    .sort((a, b) => b.retryAt - a.retryAt);
  if (!reached.length) return null;
  const { scope, retryAt } = reached[0];
  const error =
    scope === "visitor"
      ? "You've reached the chat limit for now. Please try again later, or email me directly."
      : "The chat has reached its daily limit. Please try again later, or email me directly.";
  return NextResponse.json({ error, limit: { scope, retryAt: retryAt.toISOString() } }, { status: 429 });
}

/**
 * POST /api/chat
 * Body: { conversationId?: string, message: string, audience?: "recruiter" | "engineer" | "browsing" }
 * Streams newline-delimited JSON events: {type: "conversation", id}, {type: "text", text},
 * {type: "status", text} (e.g. while reading GitHub), {type: "query_saved"}, {type: "error", message},
 * {type: "done"}. A used-up limit answers 429 with { error, limit: { scope: "visitor" | "site", retryAt } }.
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
  try {
    const limited = await checkLimits(ipHash);
    if (limited) return limited;
  } catch (error) {
    console.error("Chat rate-limit check failed:", error);
    return jsonError("The chat isn't available right now.", 503);
  }

  let conversation;
  let history;
  let content;
  try {
    conversation = await getOrCreateConversation(parsed.data.conversationId, ipHash);
    [history, { content }] = await Promise.all([
      loadHistory(conversation.id, CHAT_LIMITS.maxHistoryMessages - 1),
      getPublishedContent(),
    ]);
    await appendMessage(conversation.id, "user", parsed.data.message);
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
          content,
          history,
          message: parsed.data.message,
          audience: parsed.data.audience,
          loadContext: loadChatContext,
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
