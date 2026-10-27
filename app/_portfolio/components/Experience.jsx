"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useContent } from "../content";
import { EASE, Reveal } from "../fx";
import { SectionHeading } from "./Rail";

export default function Experience() {
  const { experience } = useContent();
  const currentIndex = experience.findIndex((job) => job.current);
  const [selected, setSelected] = useState(currentIndex >= 0 ? currentIndex : experience.length - 1);
  const job = experience[selected];

  return (
    <section id="experience" className="py-section" aria-labelledby="experience-title">
      <SectionHeading eyebrow="Experience" title={<span id="experience-title">Where I&apos;ve Worked</span>}>
        Three roles so far, from a US internship to building ad tech at scale.
      </SectionHeading>

      <div className="px-gutter">
        <Reveal>
          <div role="tablist" aria-label="Jobs" className="scrollbar-hide flex gap-2 overflow-x-auto">
            {experience.map((item, index) => (
              <button
                key={item.company}
                type="button"
                role="tab"
                id={`job-tab-${index}`}
                aria-selected={index === selected}
                aria-controls="job-panel"
                onClick={() => setSelected(index)}
                className={`relative shrink-0 rounded-md px-4 py-2 text-sm font-medium transition md:text-base ${
                  index === selected ? "text-inverse" : "text-fg/70 hover:text-fg"
                }`}
              >
                {index === selected && (
                  <motion.span
                    layoutId="job-pill"
                    className="absolute inset-0 rounded-md bg-fg"
                    transition={{ duration: 0.4, ease: EASE }}
                  />
                )}
                <span className="relative">
                  {item.company}
                  <span className="ml-2 hidden opacity-60 sm:inline">{item.years}</span>
                </span>
              </button>
            ))}
          </div>
        </Reveal>

        <AnimatePresence mode="wait">
          <motion.div
            key={job.company}
            id="job-panel"
            role="tabpanel"
            aria-labelledby={`job-tab-${selected}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-8"
          >
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg/50">
                  {job.period} · {job.place}
                  {job.current && <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-on-accent">CURRENT</span>}
                </p>
                <h3 className="mt-1 font-display text-4xl text-fg md:text-5xl">{job.role}</h3>
                <p className="mt-1 text-lg text-fg/85">{job.company}</p>
              </div>
              <p className="max-w-md text-sm text-fg/55">{job.logline}</p>
            </div>

            <ol className="mt-8 divide-y divide-fg/10 border-y border-fg/10">
              {job.highlights.map((highlight, index) => (
                <motion.li
                  key={highlight.title}
                  className="group grid grid-cols-[2.5rem_1fr] items-start gap-4 py-5 transition hover:bg-fg/[0.03] md:grid-cols-[12rem_1fr] md:gap-6 md:px-4"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.1 + index * 0.07 }}
                >
                  <span className="font-display text-4xl leading-none text-fg/30 transition group-hover:text-accent md:hidden">
                    {index + 1}
                  </span>
                  <HighlightNumber jobIndex={selected} company={job.company} number={index + 1} />
                  <div className="col-start-2">
                    <h4 className="font-semibold text-fg">{highlight.title}</h4>
                    <p className="mt-1 leading-relaxed text-fg/65">{highlight.text}</p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

const THUMB_TINTS = ["from-category-1/60", "from-category-2/60", "from-category-3/60"];

function HighlightNumber({ jobIndex, company, number }) {
  return (
    <div
      aria-hidden
      className={`relative hidden aspect-video items-center justify-center overflow-hidden rounded bg-gradient-to-br ${THUMB_TINTS[jobIndex % THUMB_TINTS.length]} to-scrim md:flex`}
    >
      <span className="font-display text-6xl leading-none text-fg/80 transition group-hover:scale-110 group-hover:text-fg">
        {String(number).padStart(2, "0")}
      </span>
      <span className="absolute bottom-1 left-2 text-2xs uppercase tracking-[0.2em] text-fg/60">{company}</span>
    </div>
  );
}
