import "server-only";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_NAME, checkSession } from "./checkSession";

/** True when the current request carries a valid admin session cookie. */
export async function isAdminRequest() {
  const cookieStore = await cookies();
  return checkSession(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}
