"use client";

import { topNumbers } from "../../data/siteData";
import { Reveal } from "../fx";
import { Rail, SectionHeading } from "./Rail";

export default function TopNumbers() {
  return (
    <section id="numbers" className="py-14 md:py-20" aria-labelledby="numbers-title">
      <SectionHeading eyebrow="Ratings" title={<span id="numbers-title">Top {topNumbers.length} in Impact</span>}>
        The numbers behind the work, straight from the resume.
      </SectionHeading>
      <Rail label="Impact numbers">
        {topNumbers.map((item, index) => (
          <li key={item.label} className="flex shrink-0 snap-start items-end">
            <Reveal delay={index * 0.05} className="flex items-end">
              <span
                aria-hidden
                className="font-display text-[9rem] leading-[0.75] text-transparent md:text-[12rem]"
                style={{ WebkitTextStroke: "2px rgba(255,255,255,0.35)" }}
              >
                {index + 1}
              </span>
              <div className="-ml-3 flex h-44 w-40 flex-col justify-between rounded-md border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4 backdrop-blur md:-ml-4 md:h-56 md:w-48">
                <span className="sr-only">Number {index + 1}:</span>
                <span className="font-display text-5xl leading-none text-accent md:text-6xl">{item.value}</span>
                <span className="text-sm leading-snug text-white/80">{item.label}</span>
                <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">{item.source}</span>
              </div>
            </Reveal>
          </li>
        ))}
      </Rail>
    </section>
  );
}
