import { NextResponse } from "next/server";
import { validatePassword } from "../../../services/auth/validatePassword";
import { createSessionToken } from "../../../services/auth/checkSession";

const COOKIE_NAME = "admin-auth";
const COOKIE_OPTIONS = {
  name: COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  path: "/",
  maxAge: undefined,
  // No Expires or Max-Age - this makes it a session cookie (cleared on browser close)
};

/**
 * POST /api/admin/auth
 * Authenticates admin user and sets session cookie.
 * Request body: { password: string }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Password is required" },
        { status: 400 }
      );
    }

    const isValid = validatePassword(password);

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid password" },
        { status: 401 }
      );
    }

    // Set a signed session cookie
    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, createSessionToken(), COOKIE_OPTIONS);

    return response;
  } catch (error) {
    console.error("Auth API error:", error);

    // Handle missing ADMIN_PASSWORD env var
    if (error.message?.includes("ADMIN_PASSWORD")) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Authentication failed" },
      { status: 500 }
    );
  }
}


/**
 * DELETE /api/admin/auth
 * Logs the admin out by clearing the session cookie.
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  return response;
}
