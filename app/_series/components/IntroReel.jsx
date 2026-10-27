"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { introSlides, profile } from "../../data/siteData";
import { EASE } from "../fx";

const SLIDE_MS = 4500;

/** "Play Intro": a story-style highlight reel. Arrows step, Space pauses, Esc closes. */
export default function IntroReel({ onClose }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => {
    if (index === introSlides.length - 1) onClose();
    else setIndex(index + 1);
  }, [index, onClose]);
  const previous = useCallback(() => setIndex((current) => Math.max(0, current - 1)), []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(next, SLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, next]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
      else if (event.key === "ArrowRight") next();
      else if (event.key === "ArrowLeft") previous();
      else if (event.key === " ") {
        event.preventDefault();
        setPaused((value) => !value);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, previous, onClose]);

  const slide = introSlides[index];

  return (
    <motion.div
      className="fixed inset-0 z-[130] overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      role="dialog"
      aria-modal="true"
      aria-label="Intro highlight reel"
    >
      <motion.div
        aria-hidden
        className="absolute inset-0"
        initial={{ scale: 1.6, opacity: 0 }}
        animate={{ scale: 1.1 + index * 0.04, opacity: 0.35 }}
        transition={{ duration: 1.6, ease: EASE }}
      >
        <Image src={profile.portrait.src} alt="" fill sizes="100vw" className="object-cover object-[50%_25%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/80" />
      </motion.div>

      {/* progress bars */}
      <div className="absolute inset-x-0 top-0 z-20 flex gap-1.5 p-4 md:px-12 md:pt-6">
        {introSlides.map((item, slideIndex) => (
          <div key={item.title} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
            <motion.div
              key={slideIndex === index ? `active-${index}-${paused}` : slideIndex}
              className="h-full origin-left bg-white"
              initial={{ scaleX: slideIndex < index ? 1 : 0 }}
              animate={{ scaleX: slideIndex < index ? 1 : slideIndex === index && !paused ? 1 : 0 }}
              transition={{ duration: slideIndex === index && !paused ? SLIDE_MS / 1000 : 0, ease: "linear" }}
            />
          </div>
        ))}
      </div>

      {/* tap zones */}
      <button type="button" aria-label="Previous" onClick={previous} className="absolute inset-y-0 left-0 z-10 w-1/3 cursor-w-resize" />
      <button type="button" aria-label="Next" onClick={next} className="absolute inset-y-0 right-0 z-10 w-2/3 cursor-e-resize" />

      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
            transition={{ duration: 0.6, ease: EASE }}
            aria-live="polite"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-accent md:text-sm">{slide.eyebrow}</p>
            <h2 className="mt-3 font-display text-[15vw] leading-[0.85] text-white md:text-[8vw]">{slide.title}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/80 md:text-xl">{slide.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 right-4 z-20 flex gap-2 md:right-12">
        <button
          type="button"
          onClick={() => setPaused((value) => !value)}
          className="rounded border border-white/30 bg-black/40 px-4 py-2 text-sm text-white backdrop-blur transition hover:border-white"
        >
          {paused ? "Resume" : "Pause"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-white/30 bg-black/40 px-4 py-2 text-sm text-white backdrop-blur transition hover:border-white"
        >
          Close
        </button>
      </div>
    </motion.div>
  );
}
