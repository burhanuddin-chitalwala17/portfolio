"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { AnimatePresence, m } from "framer-motion";
import { useContent } from "../content";
import { EASE } from "../motion";
import { useScrollLock } from "../smoothScroll";

const STORAGE_KEY = "burhanuddin-portfolio-chat";
const MAX_CHARACTERS = 1000;

const SUGGESTIONS = [
  "What are you working on at InMobi?",
  "Tell me about the in-car AI assistant",
  "How did you build this portfolio?",
  "What's your strongest tech stack?",
];

const PHONE_QUERY = "(max-width: 767px)";

function subscribeToViewport(onChange) {
  const query = window.matchMedia(PHONE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function readSavedChat() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && Array.isArray(saved.messages)) return saved;
  } catch {
    // Storage unavailable or corrupt; start fresh.
  }
  return { conversationId: null, messages: [] };
}

function saveChat(chat) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
  } catch {
    // Storage unavailable; the chat still works for this page view.
  }
}

/** Reads the newline-delimited JSON events streamed by /api/chat. */
async function* readEvents(response) {
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) {
      if (line.trim()) yield JSON.parse(line);
    }
  }
  if (buffer.trim()) yield JSON.parse(buffer);
}

export default function Chat({ open, onOpenChange, hidden }) {
  const { profile } = useContent();
  // The saved chat only shows once the panel is opened, so reading storage here can't cause a hydration mismatch.
  const [chat, setChat] = useState(() => (typeof window === "undefined" ? { conversationId: null, messages: [] } : readSavedChat()));
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const isPhone = useSyncExternalStore(
    subscribeToViewport,
    () => window.matchMedia(PHONE_QUERY).matches,
    () => false
  );
  useScrollLock(open && isPhone);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [chat.messages, pending]);

  const update = (updater) => {
    setChat((current) => {
      const next = updater(current);
      saveChat(next);
      return next;
    });
  };

  const send = async (text) => {
    const message = text.trim();
    if (!message || pending) return;
    setDraft("");
    setError("");
    setPending(true);
    update((current) => ({
      ...current,
      messages: [...current.messages, { role: "user", text: message }, { role: "assistant", text: "" }],
    }));

    const appendToReply = (fn) =>
      update((current) => {
        const messages = [...current.messages];
        messages[messages.length - 1] = fn(messages[messages.length - 1]);
        return { ...current, messages };
      });

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: chat.conversationId, message }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "The chat isn't available right now.");
      }
      for await (const event of readEvents(response)) {
        if (event.type === "conversation") update((current) => ({ ...current, conversationId: event.id }));
        else if (event.type === "text") appendToReply((reply) => ({ ...reply, text: reply.text + event.text, status: null }));
        else if (event.type === "status") appendToReply((reply) => ({ ...reply, status: event.text }));
        else if (event.type === "query_saved") appendToReply((reply) => ({ ...reply, querySaved: true }));
        else if (event.type === "error") throw new Error(event.message);
      }
    } catch (sendError) {
      setError(sendError.message || "Something went wrong. Please try again.");
      // Drop an empty reply bubble so the failed turn doesn't leave a blank message.
      update((current) => {
        const last = current.messages[current.messages.length - 1];
        return last?.role === "assistant" && !last.text.trim()
          ? { ...current, messages: current.messages.slice(0, -1) }
          : current;
      });
    } finally {
      setPending(false);
      // A status like "Reading page.js…" only makes sense while the reply is being written.
      update((current) => {
        const last = current.messages[current.messages.length - 1];
        return last?.status ? { ...current, messages: [...current.messages.slice(0, -1), { ...last, status: null }] } : current;
      });
    }
  };

  const startOver = () => {
    update(() => ({ conversationId: null, messages: [] }));
    setError("");
    inputRef.current?.focus();
  };

  const firstName = `${profile.firstName.charAt(0)}${profile.firstName.slice(1).toLowerCase()}`;
  const lastReply = chat.messages[chat.messages.length - 1];
  const waitingForFirstWord = pending && lastReply?.role === "assistant" && !lastReply.text && !lastReply.status;

  return (
    <>
      <AnimatePresence>
        {!open && !hidden && (
          <m.button
            key="chat-launcher"
            type="button"
            onClick={() => onOpenChange(true)}
            className="fixed bottom-4 right-4 z-[90] flex items-center gap-2 rounded-full bg-accent py-2 pl-2 pr-4 text-sm font-semibold text-on-accent shadow-2xl shadow-scrim/50 transition hover:bg-fg md:bottom-6 md:right-6"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.35, ease: EASE }}
            aria-haspopup="dialog"
          >
            <span className="relative h-8 w-8 overflow-hidden rounded-full">
              <Image src={profile.portrait.src} alt="" fill sizes="32px" className="object-cover object-[50%_20%]" />
            </span>
            Ask me anything
          </m.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <m.section
            key="chat-panel"
            role="dialog"
            aria-modal={isPhone}
            aria-label={`Chat with the AI version of ${firstName}`}
            className="fixed inset-0 z-[125] flex flex-col bg-surface md:inset-auto md:bottom-6 md:right-6 md:h-[min(640px,calc(100svh-6rem))] md:w-[400px] md:overflow-hidden md:rounded-2xl md:border md:border-fg/10 md:shadow-2xl md:shadow-scrim/60"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <header className="flex items-center gap-3 border-b border-fg/10 px-4 py-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-accent">
                <Image src={profile.portrait.src} alt="" fill sizes="40px" className="object-cover object-[50%_20%]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-fg">
                  {firstName} <span className="font-normal text-fg/50">· AI</span>
                </p>
                <p className="text-xs leading-snug text-fg/50">Answers from my resume, notes and code. It can get things wrong.</p>
              </div>
              {chat.messages.length > 0 && (
                <button
                  type="button"
                  onClick={startOver}
                  className="rounded-md px-2 py-2 text-xs text-fg/60 transition hover:bg-fg/10 hover:text-fg"
                >
                  Start over
                </button>
              )}
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close chat"
                className="flex h-10 w-10 items-center justify-center rounded-full text-fg/70 transition hover:bg-fg/10 hover:text-fg"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            </header>

            <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4" data-lenis-prevent aria-live="polite">
              {chat.messages.length === 0 ? (
                <div className="flex h-full flex-col justify-end gap-4">
                  <p className="text-sm leading-relaxed text-fg/80">
                    Hi, I&apos;m the AI version of {firstName}. Ask me about my work, projects or how I build things. If I
                    don&apos;t know something, I can pass your question to the real me.
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((suggestion) => (
                      <li key={suggestion}>
                        <button
                          type="button"
                          onClick={() => send(suggestion)}
                          className="rounded-full border border-fg/15 px-3 py-2 text-left text-sm text-fg/85 transition hover:border-accent hover:text-accent"
                        >
                          {suggestion}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <ol className="flex flex-col gap-3">
                  {chat.messages.map((message, index) => (
                    <li key={index} className={message.role === "user" ? "flex justify-end" : "flex flex-col items-start gap-2"}>
                      {(message.text || message.role === "user") && (
                        <p
                          className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                            message.role === "user"
                              ? "rounded-br-sm bg-accent text-on-accent"
                              : "rounded-bl-sm bg-fg/[0.07] text-fg/90"
                          }`}
                        >
                          {message.text.trim()}
                        </p>
                      )}
                      {pending && index === chat.messages.length - 1 && message.status && (
                        <p className="flex items-center gap-2 px-2 text-xs text-fg/60">
                          <m.span
                            className="h-1.5 w-1.5 rounded-full bg-accent"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            aria-hidden
                          />
                          {message.status}
                        </p>
                      )}
                      {message.querySaved && (
                        <p className="rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
                          Passed to {firstName}&apos;s inbox. He&apos;ll follow up if you left an email.
                        </p>
                      )}
                    </li>
                  ))}
                  {waitingForFirstWord && (
                    <li className="flex gap-1 px-2 py-3" aria-label="Typing">
                      {[0, 1, 2].map((dot) => (
                        <m.span
                          key={dot}
                          className="h-2 w-2 rounded-full bg-fg/50"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }}
                        />
                      ))}
                    </li>
                  )}
                </ol>
              )}
            </div>

            {error && (
              <p role="alert" className="border-t border-danger/30 bg-danger/10 px-4 py-2 text-sm text-danger">
                {error}
              </p>
            )}

            <form
              className="flex items-end gap-2 border-t border-fg/10 p-3"
              onSubmit={(event) => {
                event.preventDefault();
                send(draft);
              }}
            >
              <label htmlFor="chat-input" className="sr-only">
                Your message
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, MAX_CHARACTERS))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    send(draft);
                  }
                }}
                rows={1}
                placeholder="Ask about my work…"
                className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-fg/15 bg-canvas px-3 py-2.5 text-input text-fg placeholder:text-fg/40 focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent transition hover:bg-fg disabled:cursor-not-allowed disabled:opacity-40"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                  <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.25" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
            {draft.length > MAX_CHARACTERS - 100 && (
              <p className="-mt-2 px-4 pb-2 text-right text-2xs text-fg/50">
                {draft.length}/{MAX_CHARACTERS}
              </p>
            )}
          </m.section>
        )}
      </AnimatePresence>
    </>
  );
}
