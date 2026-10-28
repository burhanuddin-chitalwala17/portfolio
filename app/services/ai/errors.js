/** A provider failure normalised across SDKs, so callers can react without knowing the provider. */
export class AiProviderError extends Error {
  /**
   * @param {"auth" | "rate_limit" | "overloaded" | "bad_request" | "network" | "unknown"} kind
   */
  constructor(kind, message, { status, cause } = {}) {
    super(message, { cause });
    this.name = "AiProviderError";
    this.kind = kind;
    this.status = status;
  }
}

/** Maps an HTTP status from any provider to an error kind. */
export function errorKindForStatus(status) {
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limit";
  if (status >= 500) return "overloaded";
  if (status >= 400) return "bad_request";
  return "unknown";
}

/** A short explanation for the admin panel. */
export function describeAiError(error) {
  if (!(error instanceof AiProviderError)) return "Something went wrong calling the provider.";
  switch (error.kind) {
    case "auth":
      return "The provider rejected the API key. Check it, or replace it.";
    case "rate_limit":
      return "The provider is rate-limiting this key, or the account is out of credit.";
    case "overloaded":
      return "The provider is having trouble right now. Try again in a minute.";
    case "network":
      return "Couldn't reach the provider. Check the base URL.";
    case "bad_request":
      return `The provider refused the request: ${error.message}`.slice(0, 300);
    default:
      return error.message.slice(0, 300);
  }
}
