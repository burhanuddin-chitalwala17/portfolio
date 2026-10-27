"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLockScreen() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Authentication failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Success - refresh the page to re-run layout auth check
      router.refresh();
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please check your connection and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="theme-light flex min-h-screen w-full items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-fg/10 bg-surface p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-semibold text-fg md:text-3xl">
              Admin Access
            </h1>
            <p className="mt-2 text-sm text-fg/60">
              Enter your password to access the admin dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-fg/80"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-lg border border-fg/20 bg-surface px-4 py-3 text-fg placeholder-fg/40 transition focus:border-fg focus:outline-none focus:ring-2 focus:ring-fg focus:ring-offset-1 ring-offset-surface disabled:cursor-not-allowed disabled:bg-canvas"
                placeholder="Enter admin password"
                autoFocus
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-danger/5 border border-danger/20 px-4 py-3 text-sm text-danger">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full rounded-lg bg-fg px-4 py-3 text-sm font-semibold text-surface transition hover:bg-fg/80 focus:outline-none focus:ring-2 focus:ring-fg focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-fg/40"
            >
              {isLoading ? "Authenticating..." : "Unlock Dashboard"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

