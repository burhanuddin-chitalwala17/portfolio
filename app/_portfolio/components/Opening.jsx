"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useContent } from "../content";
import { EASE, LetterReveal, Magnetic } from "../fx";

// black → intro card → first name → last name → portrait → role → ENTER
const TIMELINE = [
  { at: 300, beat: 1 },
  { at: 2000, beat: 2 },
  { at: 3000, beat: 3 },
  { at: 3700, beat: 4 },
  { at: 4500, beat: 5 },
  { at: 5200, beat: 6 },
];

export default function Opening({ onDone }) {
  const { profile } = useContent();
  const reduced = useReducedMotion();
  const [beat, setBeat] = useState(0);
  const shown = reduced ? 6 : beat;

  useEffect(() => {
    if (reduced) return;
    const timers = TIMELINE.map(({ at, beat }) => window.setTimeout(() => setBeat(beat), at));
    return () => timers.forEach(clearTimeout);
  }, [reduced]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape" || event.key === "Enter") onDone();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onDone]);

  return (
    <motion.div
      className="fixed inset-0 z-[150] overflow-hidden bg-scrim"
      exit={{ opacity: 0, scale: 1.05, filter: "blur(14px)" }}
      transition={{ duration: 0.9, ease: EASE }}
      role="dialog"
      aria-modal="true"
      aria-label="Intro"
    >
      {/* letterbox bars that slide away once the titles finish */}
      <motion.div
        className="absolute inset-x-0 top-0 z-30 h-[8vh] bg-scrim"
        animate={{ y: shown >= 6 ? "-100%" : 0 }}
        transition={{ duration: 1.2, ease: EASE }}
      />
      <motion.div
        className="absolute inset-x-0 bottom-0 z-30 h-[8vh] bg-scrim"
        animate={{ y: shown >= 6 ? "100%" : 0 }}
        transition={{ duration: 1.2, ease: EASE }}
      />

      {/* projector glow */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(55% 45% at 50% 55%, rgb(var(--color-accent) / 0.2), transparent 70%)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: shown >= 2 ? [0, 1, 0.55, 1] : 0 }}
        transition={{ duration: 1.4 }}
      />

      {/* portrait fading up behind the title */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ opacity: 0, scale: 1.15 }}
        animate={{ opacity: shown >= 4 ? 0.45 : 0, scale: shown >= 4 ? 1 : 1.15 }}
        transition={{ duration: 2.2, ease: EASE }}
      >
        <Image
          src={profile.portrait.src}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[50%_25%] grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-scrim via-scrim/40 to-scrim/70" />
      </motion.div>

      {/* intro card */}
      <AnimatePresence>
        {shown === 1 && (
          <motion.div
            key="intro-card"
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(6px)" }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              className="h-px bg-gradient-to-r from-transparent via-accent to-transparent"
              initial={{ width: 0 }}
              animate={{ width: 220 }}
              transition={{ duration: 1.2, ease: EASE }}
            />
            <span className="text-xs font-medium tracking-[0.6em] text-fg/80 md:text-sm">{profile.introCard}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* title block */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center">
        {shown >= 2 && (
          <h1 className="font-display text-display-intro tracking-wide text-fg drop-shadow-[0_0_40px_rgb(var(--color-accent)/0.35)]">
            <LetterReveal text={profile.firstName} stagger={reduced ? 0 : 0.06} />
          </h1>
        )}
        <motion.p
          className="mt-3 font-display text-2xl tracking-[0.5em] text-accent md:text-4xl"
          initial={{ opacity: 0, letterSpacing: "1.2em" }}
          animate={shown >= 3 ? { opacity: 1, letterSpacing: "0.5em" } : {}}
          transition={{ duration: 1.1, ease: EASE }}
        >
          {profile.lastName}
        </motion.p>
        <motion.p
          className="mt-6 text-sm uppercase tracking-[0.3em] text-fg/70 md:text-base"
          initial={{ opacity: 0, y: 10 }}
          animate={shown >= 5 ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE }}
        >
          {profile.role}
        </motion.p>
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={shown >= 6 ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7, ease: EASE }}
        >
          <Magnetic>
            <button
              type="button"
              onClick={onDone}
              disabled={shown < 6}
              className="group flex items-center gap-3 rounded-full bg-fg px-8 py-4 text-lg font-semibold text-inverse transition hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <PlayIcon className="h-5 w-5 transition group-hover:scale-110" />
              ENTER
            </button>
          </Magnetic>
        </motion.div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="absolute bottom-[10vh] right-6 z-40 rounded border border-fg/30 bg-scrim/40 px-4 py-2 text-sm text-fg/80 backdrop-blur transition hover:border-fg hover:text-fg"
      >
        Skip
      </button>
    </motion.div>
  );
}

export function PlayIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
    </svg>
  );
}
