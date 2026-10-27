import { createHmac, timingSafeEqual } from "crypto";

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

/**
 * The key that signs session cookies. ADMIN_SESSION_SECRET is preferred; the admin
 * password is the fallback so existing deployments keep working.
 */
function getSigningKey() {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function sign(value, key) {
  return createHmac("sha256", key).update(value).digest("hex");
}

/**
 * Creates a signed session token of the form `<timestamp>.<signature>`.
 * @returns {string}
 */
export function createSessionToken() {
  const key = getSigningKey();
  if (!key) {
    throw new Error("ADMIN_PASSWORD environment variable is not set.");
  }
  const timestamp = Date.now().toString();
  return `${timestamp}.${sign(timestamp, key)}`;
}

/**
 * Validates a session cookie: the signature must match and the session must be under an hour old.
 * @param {string | undefined} cookieValue - The cookie value
 * @returns {boolean} True if the session is valid, false otherwise
 */
export function checkSession(cookieValue) {
  const key = getSigningKey();
  if (!cookieValue || !key) {
    return false;
  }

  const [timestampPart, signature] = cookieValue.split(".");
  if (!timestampPart || !signature) {
    return false;
  }

  const expected = Buffer.from(sign(timestampPart, key));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return false;
  }

  const timestamp = parseInt(timestampPart, 10);
  if (isNaN(timestamp)) {
    return false;
  }

  const sessionAge = Date.now() - timestamp;
  return sessionAge >= 0 && sessionAge < ONE_HOUR_IN_MS;
}
