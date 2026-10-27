"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { EASE } from "../fx";
import { PosterArt } from "./Projects";

export default function ProjectModal({ project, onClose }) {
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
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-scrim/80 px-3 py-6 backdrop-blur-sm md:py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
      data-lenis-prevent
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-title"
        className="relative w-full max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <motion.div layoutId={`poster-${project.id}`} className="overflow-hidden rounded-t-lg">
          <PosterArt project={project} className="aspect-[16/9] md:aspect-[21/9]">
            <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-5 md:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{project.kind}</p>
              <h2 id="project-title" className="mt-1 font-display text-5xl leading-none text-fg md:text-7xl">
                {project.title}
              </h2>
              <p className="mt-1 text-sm uppercase tracking-[0.2em] text-fg/75">{project.subtitle}</p>
            </div>
          </PosterArt>
        </motion.div>

        <motion.div
          className="rounded-b-lg bg-surface p-5 md:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
        >
          <p className="text-lg leading-relaxed text-fg">{project.logline}</p>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-fg/50">What I did</h3>
          <ul className="mt-3 space-y-3">
            {project.points.map((point) => (
              <li key={point} className="flex gap-3 leading-relaxed text-fg/75">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                {point}
              </li>
            ))}
          </ul>

          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-fg/50">Tech stack</h3>
          <ul className="mt-3 flex flex-wrap gap-2">
            {project.tech.map((tech) => (
              <li key={tech} className="rounded-full border border-fg/15 px-3 py-1 text-sm text-fg/85">
                {tech}
              </li>
            ))}
          </ul>

          {project.links?.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {project.links.map((link, index) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 rounded-md px-5 py-2.5 font-semibold transition ${
                    index === 0 ? "bg-fg text-inverse hover:bg-accent" : "border border-fg/25 text-fg hover:border-fg"
                  }`}
                >
                  {link.label}
                  <span aria-hidden>↗</span>
                </a>
              ))}
            </div>
          )}
        </motion.div>

        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-scrim/70 text-fg transition hover:bg-scrim"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
