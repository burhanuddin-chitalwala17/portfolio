"use client";

import { useRef } from "react";
import { Reveal } from "../fx";

export function SectionHeading({ eyebrow, title, children }) {
  return (
    <Reveal className="mb-6 px-4 md:mb-8 md:px-12">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">{eyebrow}</p>
      <h2 className="mt-2 font-display text-4xl tracking-wide text-white md:text-6xl">{title}</h2>
      {children && <p className="mt-2 max-w-2xl text-sm text-white/60 md:text-base">{children}</p>}
    </Reveal>
  );
}

/** A horizontally scrolling row with arrow buttons on wider screens. */
export function Rail({ children, label }) {
  const ref = useRef(null);

  const page = (direction) => {
    const element = ref.current;
    element.scrollBy({ left: direction * element.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <div className="group/rail relative">
      <ul
        ref={ref}
        aria-label={label}
        className="scrollbar-hide flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-6 pt-2 md:gap-4 md:px-12"
      >
        {children}
      </ul>
      {[-1, 1].map((direction) => (
        <button
          key={direction}
          type="button"
          onClick={() => page(direction)}
          aria-label={direction < 0 ? "Scroll left" : "Scroll right"}
          className={`absolute bottom-6 top-2 z-10 hidden w-12 items-center justify-center bg-black/50 text-white opacity-0 transition hover:bg-black/70 group-hover/rail:opacity-100 focus-visible:opacity-100 md:flex ${
            direction < 0 ? "left-0" : "right-0"
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
            <path
              d={direction < 0 ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"}
              stroke="currentColor"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}
