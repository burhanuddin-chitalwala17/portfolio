"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { profile } from "../../data/siteData";
import { EASE } from "../fx";

export default function ResumeModal({ onClose }) {
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      data-lenis-prevent
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="resume-title"
        className="flex h-full max-h-[900px] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-[#141414]"
        initial={{ y: 40, scale: 0.97 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, opacity: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
          <h2 id="resume-title" className="font-display text-2xl tracking-wide text-white">
            Resume
          </h2>
          <a
            href={profile.resumePdf}
            download
            className="ml-auto rounded bg-accent px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-white"
          >
            Download PDF
          </a>
          <a
            href={profile.resumePdf}
            target="_blank"
            rel="noreferrer"
            className="rounded border border-white/20 px-3 py-1.5 text-sm text-white/85 transition hover:border-white"
          >
            Open in new tab
          </a>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <iframe src={`${profile.resumePdf}#view=FitH`} title="Resume PDF" className="h-full w-full flex-1 bg-white" />
      </motion.div>
    </motion.div>
  );
}
