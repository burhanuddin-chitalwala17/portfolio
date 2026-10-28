"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../ui/Button";
import { adminRequest } from "../_lib/adminRequest";

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

export default function QueryList({ queries }) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState(null);
  const [error, setError] = useState("");

  const setStatus = async (id, status) => {
    setPendingId(id);
    setError("");
    try {
      await adminRequest(`/api/admin/queries/${id}`, { method: "PATCH", body: { status } });
      router.refresh();
    } catch {
      setError("Couldn't update that question. Please try again.");
    } finally {
      setPendingId(null);
    }
  };

  if (!queries.length) {
    return (
      <div className="rounded-2xl border border-dashed border-fg/20 bg-surface px-5 py-10 text-center text-sm text-fg/60">
        No questions yet. They&apos;ll appear here once the chat is live.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <ul className="flex flex-col gap-3">
        {queries.map((query) => {
          const open = query.status === "open";
          return (
            <li key={query.id} className="rounded-2xl border border-fg/10 bg-surface p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-fg">{query.question}</p>
                  <p className="mt-1 text-sm text-fg/60">
                    {query.visitorName || "Anonymous visitor"}
                    {query.visitorEmail && (
                      <>
                        {" · "}
                        <a href={`mailto:${query.visitorEmail}`} className="underline underline-offset-2">
                          {query.visitorEmail}
                        </a>
                      </>
                    )}
                    {" · "}
                    {dateFormatter.format(new Date(query.createdAt))}
                  </p>
                  {query.context && <p className="mt-2 whitespace-pre-line text-sm text-fg/70">{query.context}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      open ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
                    }`}
                  >
                    {open ? "Open" : "Resolved"}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setStatus(query.id, open ? "resolved" : "open")}
                    disabled={pendingId === query.id}
                  >
                    {open ? "Mark resolved" : "Reopen"}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
