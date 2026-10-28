"use client";

import { m } from "framer-motion";
import { visitorTypes } from "../../data/siteData";
import { EASE } from "../motion";

export default function VisitorSelect({ onPick }) {
  return (
    <m.div
      className="fixed inset-0 z-[140] flex flex-col items-center justify-center bg-canvas px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08 }}
      transition={{ duration: 0.6, ease: EASE }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="visitor-title"
    >
      <m.h2
        id="visitor-title"
        className="text-center text-3xl font-medium text-fg md:text-5xl"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
      >
        What brings you here?
      </m.h2>
      <p className="mt-3 text-center text-sm text-fg/50 md:text-base">
        Pick one and I&apos;ll show you the most relevant parts first.
      </p>

      <ul className="mt-10 flex flex-wrap justify-center gap-3 sm:gap-6 md:mt-14 md:gap-10">
        {visitorTypes.map((visitor, index) => (
          <m.li
            key={visitor.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 + index * 0.1 }}
          >
            <button
              type="button"
              onClick={() => onPick(visitor.id)}
              className="group flex w-24 flex-col items-center gap-3 focus:outline-none sm:w-28 md:w-40"
            >
              <VisitorAvatar
                visitor={visitor}
                className="h-24 w-24 rounded-md ring-accent ring-offset-4 ring-offset-canvas transition duration-300 group-hover:scale-105 group-hover:ring-4 group-focus-visible:ring-4 sm:h-28 sm:w-28 md:h-40 md:w-40"
              />
              <span className="text-base text-fg/60 transition group-hover:text-fg md:text-lg">{visitor.name}</span>
              <span className="-mt-2 text-center text-xs text-fg/40">{visitor.blurb}</span>
            </button>
          </m.li>
        ))}
      </ul>
    </m.div>
  );
}

export function VisitorAvatar({ visitor, className = "" }) {
  return (
    <span aria-hidden className={`relative block overflow-hidden bg-gradient-to-br ${visitor.color} ${className}`}>
      {/* simple smiling face */}
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full text-fg/90">
        <circle cx="34" cy="40" r="5" fill="currentColor" />
        <circle cx="66" cy="40" r="5" fill="currentColor" />
        <path d="M28 62c12 12 32 12 44 0" stroke="currentColor" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
    </span>
  );
}
