"use client";

import { useCallback, useState } from "react";

/**
 * Runs one async action at a time and reports how it went, so components don't each repeat the
 * busy / success / error bookkeeping.
 *
 *   const { busy, message, run } = useAsyncAction();
 *   run("save", async () => { await adminRequest(...); return "Saved."; });
 *
 * `busy` is the name of the running action (or null). The action's return value becomes a success
 * message; a thrown error's message becomes an error message.
 */
export function useAsyncAction() {
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState(null);

  const run = useCallback(async (name, action) => {
    setBusy(name);
    setMessage(null);
    try {
      const text = await action();
      if (text) setMessage({ tone: "success", text });
      return true;
    } catch (error) {
      setMessage({ tone: "danger", text: error.message || "That didn't work. Please try again." });
      return false;
    } finally {
      setBusy(null);
    }
  }, []);

  return { busy, message, setMessage, run };
}
