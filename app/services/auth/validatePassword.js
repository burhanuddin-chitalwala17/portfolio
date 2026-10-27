import { timingSafeEqual } from "crypto";

/**
 * Validates the provided password against the admin password from environment variables.
 * @param {string} inputPassword - The password to validate
 * @returns {boolean} True if password matches, false otherwise
 */
export function validatePassword(inputPassword) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error(
      "ADMIN_PASSWORD environment variable is not set. Please configure it in .env.local"
    );
  }

  if (!inputPassword || typeof inputPassword !== "string") {
    return false;
  }

  const expected = Buffer.from(adminPassword.trim());
  const received = Buffer.from(inputPassword.trim());
  return expected.length === received.length && timingSafeEqual(expected, received);
}

