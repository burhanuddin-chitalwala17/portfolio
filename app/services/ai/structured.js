import "server-only";
import { z } from "zod";
import { getAdapter } from "./index";

// Keywords structured-output modes may not enforce. They're dropped from the schema we
// send, and the full zod schema validates the result afterwards instead.
const UNENFORCED_KEYWORDS = new Set(["$schema", "minLength", "maxLength", "minItems", "maxItems", "pattern", "format", "default"]);

/** A JSON schema for a zod schema, without the keywords providers' structured output rejects. */
export function toStructuredOutputSchema(schema) {
  const strip = (node) => {
    if (Array.isArray(node)) return node.map(strip);
    if (!node || typeof node !== "object") return node;
    return Object.fromEntries(
      Object.entries(node)
        .filter(([key]) => !UNENFORCED_KEYWORDS.has(key))
        .map(([key, value]) => [key, strip(value)])
    );
  };
  return strip(z.toJSONSchema(schema));
}

/** Parses the model's reply, tolerating a Markdown code fence around the JSON. */
export function parseJson(text) {
  const unfenced = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(unfenced);
  } catch {
    return null;
  }
}

export class StructuredOutputError extends Error {}

/**
 * Asks a resolved provider for JSON matching a zod schema, with one retry that shows the model
 * what failed validation. Returns the parsed data.
 */
export async function generateStructured({ provider, instructions, input, schema }) {
  const adapter = getAdapter(provider);
  const outputSchema = toStructuredOutputSchema(schema);
  const messages = [{ role: "user", content: input }];
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const reply = await adapter.generateJson({ instructions, messages, schema: outputSchema });
    if (reply.stopReason === "refusal") throw new StructuredOutputError("The model declined this request.");
    if (reply.stopReason === "max_tokens") throw new StructuredOutputError("The reply was too long. Try with less text.");
    const parsed = schema.safeParse(parseJson(reply.text));
    if (parsed.success) return parsed.data;
    const issues = parsed.error.issues.slice(0, 8).map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`);
    messages.push(
      { role: "assistant", content: reply.text, raw: reply.raw },
      { role: "user", content: `That didn't match the required format:\n- ${issues.join("\n- ")}\nReturn the full corrected JSON.` }
    );
  }
  throw new StructuredOutputError("The model's answer didn't match the expected format twice. Please try again.");
}
