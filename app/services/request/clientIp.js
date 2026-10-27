import "server-only";
import { createHash } from "crypto";

/**
 * A salted hash of the caller's IP address. Used for rate limits and lockouts so raw
 * IP addresses are never stored. On Vercel, x-forwarded-for is set by the platform.
 */
export function clientIpHash(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0].trim() || request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || "portfolio";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}
