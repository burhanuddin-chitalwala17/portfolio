"use client";

import { useContent } from "../content";
import { Reveal } from "../fx";
import { Rail, SectionHeading } from "./Rail";

export default function Impact() {
  const { impactNumbers } = useContent();
  return (
    <section id="impact" className="py-section" aria-labelledby="impact-title">
      <SectionHeading eyebrow="Impact" title={<span id="impact-title">By the Numbers</span>}>
        A few results I&apos;m proud of.
      </SectionHeading>
      <Rail label="Impact numbers">
        {impactNumbers.map((item, index) => (
          <li key={item.label} className="flex shrink-0 snap-start items-end">
            <Reveal delay={index * 0.05} className="flex items-end">
              <span
                aria-hidden
                className="font-display text-display-numeral text-transparent"
                style={{ WebkitTextStroke: "2px rgb(var(--color-fg) / 0.35)" }}
              >
                {index + 1}
              </span>
              <div className="-ml-3 flex h-44 w-40 flex-col justify-between rounded-md border border-fg/10 bg-gradient-to-br from-fg/[0.08] to-fg/[0.02] p-4 backdrop-blur md:-ml-4 md:h-56 md:w-48">
                <span className="sr-only">Number {index + 1}:</span>
                <span className="font-display text-5xl leading-none text-accent md:text-6xl">{item.value}</span>
                <span className="text-sm leading-snug text-fg/80">{item.label}</span>
                <span className="text-2xs uppercase tracking-[0.2em] text-fg/40">{item.source}</span>
              </div>
            </Reveal>
          </li>
        ))}
      </Rail>
    </section>
  );
}
