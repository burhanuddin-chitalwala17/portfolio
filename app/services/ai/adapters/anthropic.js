import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { AiProviderError, errorKindForStatus } from "../errors";

// Claude models that accept the server-side refusal fallback (`fallbacks: "default"`).
const SERVER_FALLBACK_MODELS = new Set(["claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"]);
// Models that accept output_config.effort and structured JSON output. Older ones get neither.
const MODERN_MODEL = /^claude-(fable|mythos|opus-5|opus-4-[5-9]|sonnet-5|sonnet-4-6|haiku-5)/;

function client(apiKey) {
  return new Anthropic({ apiKey });
}

function requestExtras(model, effort) {
  return {
    ...(SERVER_FALLBACK_MODELS.has(model) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" } : {}),
    ...(MODERN_MODEL.test(model) ? { output_config: { effort } } : {}),
  };
}

function toProviderError(error) {
  if (error instanceof Anthropic.APIConnectionError) return new AiProviderError("network", error.message, { cause: error });
  if (error instanceof Anthropic.APIError) {
    return new AiProviderError(errorKindForStatus(error.status), error.message, { status: error.status, cause: error });
  }
  return error;
}

/** Converts the provider-neutral conversation (see chat route) to Messages API turns. */
function toMessages(messages) {
  return messages.map((message) => {
    if (message.role === "tool") {
      return {
        role: "user",
        content: message.results.map((result) => ({
          type: "tool_result",
          tool_use_id: result.toolCallId,
          content: result.content,
          ...(result.isError ? { is_error: true } : {}),
        })),
      };
    }
    // Within a turn, the assistant's own content blocks go back unchanged (thinking blocks included).
    if (message.role === "assistant" && message.raw) return { role: "assistant", content: message.raw };
    return { role: message.role, content: message.content };
  });
}

const STOP_REASONS = { end_turn: "end", tool_use: "tool_calls", refusal: "refusal", max_tokens: "max_tokens" };

/**
 * Streams one assistant turn. `knowledge` is cached as a prompt prefix, since it's identical for
 * every visitor until the content or documents change.
 */
export async function streamChat({ apiKey, model, instructions, knowledge, messages, tools = [], onText }) {
  try {
    const stream = client(apiKey).beta.messages.stream({
      model,
      max_tokens: 4000,
      ...requestExtras(model, "low"),
      system: [
        { type: "text", text: instructions },
        { type: "text", text: knowledge, cache_control: { type: "ephemeral" } },
      ],
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        input_schema: tool.parameters,
        eager_input_streaming: true,
      })),
      messages: toMessages(messages),
    });
    stream.on("text", onText);
    const message = await stream.finalMessage();
    return {
      stopReason: STOP_REASONS[message.stop_reason] ?? "end",
      toolCalls: message.content
        .filter((block) => block.type === "tool_use")
        .map((block) => ({ id: block.id, name: block.name, input: block.input })),
      raw: message.content,
    };
  } catch (error) {
    throw toProviderError(error);
  }
}

/**
 * Asks for a JSON object matching `schema`. Returns the raw text; the caller parses and validates.
 * Uses structured output where the model supports it.
 */
export async function generateJson({ apiKey, model, instructions, messages, schema }) {
  try {
    const extras = requestExtras(model, "high");
    if (extras.output_config) extras.output_config.format = { type: "json_schema", schema };
    const stream = client(apiKey).beta.messages.stream({
      model,
      max_tokens: 32000,
      ...extras,
      system: extras.output_config
        ? instructions
        : `${instructions}\n\nReply with only a JSON object matching this JSON schema:\n${JSON.stringify(schema)}`,
      messages: toMessages(messages),
    });
    const message = await stream.finalMessage();
    return {
      stopReason: STOP_REASONS[message.stop_reason] ?? "end",
      text: message.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join(""),
      raw: message.content,
    };
  } catch (error) {
    throw toProviderError(error);
  }
}

/** Model ids the key can use, newest first. */
export async function listModels({ apiKey }) {
  try {
    const models = [];
    for await (const model of client(apiKey).models.list()) models.push(model.id);
    return models;
  } catch (error) {
    throw toProviderError(error);
  }
}
