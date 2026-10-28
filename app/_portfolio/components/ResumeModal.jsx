"use client";

import { useEffect, useRef, useState } from "react";
import { m } from "framer-motion";
import { useContent } from "../content";
import { EASE } from "../motion";

export default function ResumeModal({ onClose }) {
  const { profile } = useContent();
  const closeRef = useRef(null);
  // Most phone and tablet browsers can't show a PDF inside a page, so touch screens get buttons instead.
  const [canEmbedPdf] = useState(() => !window.matchMedia("(pointer: coarse)").matches);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <m.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-scrim/85 p-3 backdrop-blur-sm md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      data-lenis-prevent
    >
      <m.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-title"
        className={`flex w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-surface ${canEmbedPdf ? "h-full max-h-[900px]" : "max-w-md"}`}
        initial={{ y: 40, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-fg/10 px-4 py-3">
          <h2 id="resume-title" className="font-display text-2xl tracking-wide text-fg">
            Resume
          </h2>
          {canEmbedPdf && (
            <>
              <a
                href={profile.resumePdf}
                download
                className="ml-auto rounded bg-accent px-3 py-1.5 text-sm font-semibold text-on-accent transition hover:bg-fg"
              >
                Download PDF
              </a>
              <a
                href={profile.resumePdf}
                target="_blank"
                rel="noreferrer"
                className="rounded border border-fg/20 px-3 py-1.5 text-sm text-fg/85 transition hover:border-fg"
              >
                Open in new tab
              </a>
            </>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto flex h-10 w-10 items-center justify-center rounded-full text-fg/80 transition hover:bg-fg/10 hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {canEmbedPdf ? (
          <iframe src={`${profile.resumePdf}#view=FitH`} title="Resume PDF" className="h-full w-full flex-1 bg-fg" />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-12 text-center">
            <p className="font-display text-4xl text-fg">{profile.firstName}</p>
            <p className="max-w-xs text-fg/70">{profile.role} · {profile.location}</p>
            <a
              href={profile.resumePdf}
              target="_blank"
              rel="noreferrer"
              className="mt-2 w-full max-w-xs rounded-md bg-fg px-5 py-3 font-semibold text-inverse transition hover:bg-accent"
            >
              Open resume
            </a>
            <a
              href={profile.resumePdf}
              download
              className="w-full max-w-xs rounded-md border border-fg/25 px-5 py-3 font-semibold text-fg transition hover:border-fg"
            >
              Download PDF
            </a>
          </div>
        )}
      </m.div>
    </m.div>
  );
}
