"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "../_lib/adminRequest";
import Button from "../../ui/Button";
import Notice from "../../ui/Notice";
import { Field, TextInput } from "../../ui/fields";

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
      await adminRequest("/api/admin/auth", { body: { password } });
      // Signed in: refresh so the layout re-checks the session. The button stays busy until then.
      router.refresh();
    } catch (loginError) {
      setError(loginError.message);
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field label="Password">
              <TextInput
                type="password"
                id="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isLoading}
                placeholder="Enter admin password"
                autoComplete="current-password"
                autoFocus
                required
              />
            </Field>
            {error && <Notice tone="danger">{error}</Notice>}
            <Button type="submit" size="lg" fullWidth disabled={isLoading || !password.trim()}>
              {isLoading ? "Signing in…" : "Unlock dashboard"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

