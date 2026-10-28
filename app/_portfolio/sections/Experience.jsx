import ExperienceTabs from "../islands/ExperienceTabs";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const THUMB_TINTS = ["from-category-1/60", "from-category-2/60", "from-category-3/60"];

function HighlightNumber({ tint, company, number }) {
  return (
    <div
      aria-hidden
      className={`relative hidden aspect-video items-center justify-center overflow-hidden rounded bg-gradient-to-br ${tint} to-scrim md:flex`}
    >
      <span className="font-display text-6xl leading-none text-fg/80 transition group-hover:scale-110 group-hover:text-fg">
        {String(number).padStart(2, "0")}
      </span>
      <span className="absolute bottom-1 left-2 text-2xs uppercase tracking-[0.2em] text-fg/60">{company}</span>
    </div>
  );
}

function JobPanel({ job, index }) {
  return (
    <>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg/50">
            {job.period} · {job.place}
            {job.current && <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-on-accent">CURRENT</span>}
          </p>
          <h3 className="mt-1 font-display text-4xl text-fg md:text-5xl">{job.role}</h3>
          <p className="mt-1 text-lg text-fg/85">{job.company}</p>
        </div>
        {job.logline && <p className="max-w-md text-sm text-fg/55">{job.logline}</p>}
      </div>

      <ol className="mt-8 divide-y divide-fg/10 border-y border-fg/10">
        {job.highlights.map((highlight, highlightIndex) => (
          <li
            key={highlight.title}
            className="group grid grid-cols-[2.5rem_1fr] items-start gap-4 py-5 transition hover:bg-fg/[0.03] motion-safe:animate-rise md:grid-cols-[12rem_1fr] md:gap-6 md:px-4"
            style={{ animationDelay: `${0.1 + highlightIndex * 0.07}s`, "--rise-distance": "12px" }}
          >
            <span className="font-display text-4xl leading-none text-fg/30 transition group-hover:text-accent md:hidden">
              {highlightIndex + 1}
            </span>
            <HighlightNumber tint={THUMB_TINTS[index % THUMB_TINTS.length]} company={job.company} number={highlightIndex + 1} />
            <div className="col-start-2">
              <h4 className="font-semibold text-fg">{highlight.title}</h4>
              <p className="mt-1 leading-relaxed text-fg/65">{highlight.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

export default function Experience({ content }) {
  const { experience } = content;
  const current = experience.findIndex((job) => job.current);
  return (
    <section id="experience" className="py-section" aria-labelledby="experience-title">
      <SectionHeading id="experience-title" eyebrow="Experience" title="Where I've Worked">
        {experience.length} roles so far, from a US internship to building ad tech at scale.
      </SectionHeading>
      <Reveal className="px-gutter">
        <ExperienceTabs
          tabs={experience.map((job) => ({ label: job.company, detail: job.years }))}
          initialIndex={current >= 0 ? current : experience.length - 1}
        >
          {experience.map((job, index) => (
            <JobPanel key={job.company} job={job} index={index} />
          ))}
        </ExperienceTabs>
      </Reveal>
    </section>
  );
}
