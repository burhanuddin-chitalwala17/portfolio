import "server-only";
import { AiProviderError, describeAiError } from "../ai";
import { StructuredOutputError } from "../ai/structured";
import { jsonError } from "../auth/adminRoute";
import { InterviewError } from "./interview";
import { EvalError } from "./evals";

/** The response for a failed Admin → Chat request: the reason when it's one the admin can act on. */
export function chatAdminError(error, action) {
  if (error instanceof InterviewError || error instanceof EvalError || error instanceof StructuredOutputError) {
    return jsonError(error.message, 400);
  }
  if (error instanceof AiProviderError) return jsonError(describeAiError(error), 502);
  console.error(`${action} failed:`, error);
  return jsonError(`${action} failed. Please try again.`, 500);
}
