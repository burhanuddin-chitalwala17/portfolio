"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { experience } from "../../data/siteData";
import { EASE, Reveal } from "../fx";
import { SectionHeading } from "./Rail";

const currentIndex = experience.findIndex((job) => job.current);

export default function Experience() {
  const [selected, setSelected] = useState(currentIndex >= 0 ? currentIndex : experience.length - 1);
  const job = experience[selected];

  return (
    <section id="experience" className="py-14 md:py-20" aria-labelledby="experience-title">
      <SectionHeading eyebrow="Experience" title={<span id="experience-title">Where I&apos;ve Worked</span>}>
        Three roles so far, from a US internship to building ad tech at scale.
      </SectionHeading>

      <div className="px-4 md:px-12">
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
                  index === selected ? "text-black" : "text-white/70 hover:text-white"
                }`}
              >
                {index === selected && (
                  <motion.span
                    layoutId="job-pill"
                    className="absolute inset-0 rounded-md bg-white"
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
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/50">
                  {job.period} · {job.place}
                  {job.current && <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-black">CURRENT</span>}
                </p>
                <h3 className="mt-1 font-display text-4xl text-white md:text-5xl">{job.role}</h3>
                <p className="mt-1 text-lg text-white/85">{job.company}</p>
              </div>
              <p className="max-w-md text-sm text-white/55">{job.logline}</p>
            </div>

            <ol className="mt-8 divide-y divide-white/10 border-y border-white/10">
              {job.highlights.map((highlight, index) => (
                <motion.li
                  key={highlight.title}
                  className="group grid grid-cols-[2.5rem_1fr] items-start gap-4 py-5 transition hover:bg-white/[0.03] md:grid-cols-[4rem_12rem_1fr] md:gap-6 md:px-4"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.1 + index * 0.07 }}
                >
                  <span className="font-display text-4xl leading-none text-white/30 transition group-hover:text-accent md:text-5xl">
                    {index + 1}
                  </span>
                  <HighlightThumb jobIndex={selected} company={job.company} number={index + 1} />
                  <div className="col-start-2 md:col-start-3">
                    <h4 className="font-semibold text-white">{highlight.title}</h4>
                    <p className="mt-1 leading-relaxed text-white/65">{highlight.text}</p>
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

const THUMB_TINTS = ["from-amber-500/60", "from-sky-500/60", "from-fuchsia-500/60"];

function HighlightThumb({ jobIndex, company, number }) {
  return (
    <div
      aria-hidden
      className={`relative hidden aspect-video overflow-hidden rounded bg-gradient-to-br ${THUMB_TINTS[jobIndex % THUMB_TINTS.length]} to-black md:block`}
    >
      <span className="absolute bottom-1 left-2 font-display text-sm tracking-wider text-white/80">
        {company} · {String(number).padStart(2, "0")}
      </span>
      <span className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
        <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-black/40">
          <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4 text-white" fill="currentColor">
            <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" />
          </svg>
        </span>
      </span>
    </div>
  );
}
