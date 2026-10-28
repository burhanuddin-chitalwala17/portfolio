import Rail from "../islands/Rail";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

export default function Impact({ content }) {
  return (
    <section id="impact" className="py-section" aria-labelledby="impact-title">
      <SectionHeading id="impact-title" eyebrow="Impact" title="By the Numbers">
        A few results I&apos;m proud of.
      </SectionHeading>
      <Rail label="Impact numbers">
        {content.impactNumbers.map((item, index) => (
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
