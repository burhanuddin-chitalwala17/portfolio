/**
 * Calls an admin API route and returns its JSON. Throws an Error carrying the route's own
 * message (`{ error }`), so callers can show it as is; a list of problems (`{ errors: [] }`) is
 * also kept on the error as `details`.
 * @param {string} url
 * @param {{ method?: string, body?: unknown }} [options] FormData is sent as is (file uploads);
 *   any other body is sent as JSON
 */
export async function adminRequest(url, { method = "POST", body } = {}) {
  const isForm = body instanceof FormData;
  const json = body !== undefined && !isForm;
  let response;
  try {
    response = await fetch(url, {
      method,
      headers: json ? { "Content-Type": "application/json" } : undefined,
      body: json ? JSON.stringify(body) : body,
    });
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.errors?.join("; ") || "That didn't work. Please try again.");
    error.details = data.errors;
    throw error;
  }
  return data;
}
