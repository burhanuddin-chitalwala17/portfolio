import "server-only";
import OpenAI from "openai";
import { AiProviderError, errorKindForStatus } from "../errors";

// Model families that aren't chat models, hidden from the model picker.
const NON_CHAT_MODEL = /embed|whisper|tts|dall-e|image|moderation|audio|realtime|transcribe|search|computer-use|davinci|babbage/i;

function client({ apiKey, baseURL }) {
  return new OpenAI({ apiKey, baseURL });
}

function toProviderError(error) {
  if (error instanceof OpenAI.APIConnectionError) return new AiProviderError("network", error.message, { cause: error });
  if (error instanceof OpenAI.APIError) {
    return new AiProviderError(errorKindForStatus(error.status), error.message, { status: error.status, cause: error });
  }
  return error;
}

/** OpenAI renamed max_tokens for its own API; other compatible providers still expect the old name. */
function tokenLimit(baseURL, limit) {
  return baseURL?.startsWith("https://api.openai.com") ? { max_completion_tokens: limit } : { max_tokens: limit };
}

/** Converts the provider-neutral conversation (see chat route) to Chat Completions messages. */
function toMessages(messages) {
  return messages.flatMap((message) => {
    if (message.role === "tool") {
      return message.results.map((result) => ({
        role: "tool",
        tool_call_id: result.toolCallId,
        content: result.isError ? `Error: ${result.content}` : result.content,
      }));
    }
    if (message.role === "assistant" && message.toolCalls?.length) {
      return {
        role: "assistant",
        content: message.content || null,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: "function",
          function: { name: call.name, arguments: JSON.stringify(call.input ?? {}) },
        })),
      };
    }
    return { role: message.role, content: message.content };
  });
}

function parseArguments(text) {
  try {
    return JSON.parse(text || "{}");
  } catch {
    return null; // the caller validates tool input and reports invalid arguments back
  }
}

const STOP_REASONS = { stop: "end", tool_calls: "tool_calls", length: "max_tokens", content_filter: "refusal" };

/** Streams one assistant turn. Providers cache the long, stable system prompt on their own. */
export async function streamChat({ apiKey, baseURL, model, instructions, knowledge, messages, tools = [], onText }) {
  try {
    const stream = await client({ apiKey, baseURL }).chat.completions.create({
      model,
      stream: true,
      ...tokenLimit(baseURL, 4000),
      messages: [{ role: "system", content: `${instructions}\n\n${knowledge}` }, ...toMessages(messages)],
      // Some providers reject an empty tools list, so leave it out when there are none.
      ...(tools.length
        ? {
            tools: tools.map((tool) => ({
              type: "function",
              function: { name: tool.name, description: tool.description, parameters: tool.parameters },
            })),
          }
        : {}),
    });

    let text = "";
    let finishReason = null;
    let refused = false;
    const calls = [];
    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      if (!choice) continue;
      const { delta } = choice;
      if (delta?.content) {
        text += delta.content;
        onText(delta.content);
      }
      if (delta?.refusal) refused = true;
      for (const part of delta?.tool_calls ?? []) {
        const call = (calls[part.index] ??= { id: "", name: "", arguments: "" });
        if (part.id) call.id = part.id;
        if (part.function?.name) call.name += part.function.name;
        if (part.function?.arguments) call.arguments += part.function.arguments;
      }
      if (choice.finish_reason) finishReason = choice.finish_reason;
    }

    const toolCalls = calls
      .filter(Boolean)
      .map((call) => ({ id: call.id, name: call.name, input: parseArguments(call.arguments) }));
    return {
      stopReason: refused ? "refusal" : toolCalls.length ? "tool_calls" : (STOP_REASONS[finishReason] ?? "end"),
      toolCalls,
      text,
    };
  } catch (error) {
    throw toProviderError(error);
  }
}

/**
 * Asks for a JSON object matching `schema`. Tries JSON-schema output first, then plain JSON mode
 * for providers or models without it. Returns the raw text; the caller parses and validates.
 */
export async function generateJson({ apiKey, baseURL, model, instructions, messages, schema }) {
  const openai = client({ apiKey, baseURL });
  const request = {
    model,
    ...tokenLimit(baseURL, 32000),
    messages: [
      { role: "system", content: `${instructions}\n\nReply with only a JSON object matching this JSON schema:\n${JSON.stringify(schema)}` },
      ...messages,
    ],
  };
  try {
    let completion;
    try {
      completion = await openai.chat.completions.create({
        ...request,
        response_format: { type: "json_schema", json_schema: { name: "site_content", schema, strict: false } },
      });
    } catch (error) {
      if (!(error instanceof OpenAI.BadRequestError)) throw error;
      completion = await openai.chat.completions.create({ ...request, response_format: { type: "json_object" } });
    }
    const choice = completion.choices[0];
    return {
      stopReason: choice?.message?.refusal ? "refusal" : (STOP_REASONS[choice?.finish_reason] ?? "end"),
      text: choice?.message?.content ?? "",
    };
  } catch (error) {
    throw toProviderError(error);
  }
}

/** Chat model ids the key can use, sorted. Gemini prefixes ids with "models/", which requests don't need. */
export async function listModels({ apiKey, baseURL }) {
  try {
    const models = [];
    for await (const model of client({ apiKey, baseURL }).models.list()) {
      const id = model.id.replace(/^models\//, "");
      if (!NON_CHAT_MODEL.test(id)) models.push(id);
    }
    return models.sort();
  } catch (error) {
    throw toProviderError(error);
  }
}
