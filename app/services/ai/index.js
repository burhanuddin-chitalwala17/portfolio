import "server-only";
import * as anthropic from "./adapters/anthropic";
import * as openaiCompatible from "./adapters/openaiCompatible";
import { ADAPTERS } from "./providers";

const ADAPTER_MODULES = {
  [ADAPTERS.ANTHROPIC]: anthropic,
  [ADAPTERS.OPENAI_COMPATIBLE]: openaiCompatible,
};

/**
 * The adapter for a resolved provider (see resolveAiTask). Every adapter exposes the same
 * functions, all taking the resolved `{apiKey, baseURL, model}` plus their own arguments:
 * - streamChat({instructions, knowledge, messages, tools, onText}) → {stopReason, toolCalls, text?, raw?}
 * - generateJson({instructions, messages, schema}) → {stopReason, text, raw?}
 * - listModels() → string[]
 * stopReason is one of "end", "tool_calls", "refusal", "max_tokens".
 */
export function getAdapter(resolved) {
  const adapter = ADAPTER_MODULES[resolved.adapter];
  return {
    streamChat: (args) => adapter.streamChat({ ...resolved, ...args }),
    generateJson: (args) => adapter.generateJson({ ...resolved, ...args }),
    listModels: () => adapter.listModels(resolved),
  };
}

export { resolveAiTask, resolveProvider } from "./settings";
export { AiProviderError, describeAiError } from "./errors";
