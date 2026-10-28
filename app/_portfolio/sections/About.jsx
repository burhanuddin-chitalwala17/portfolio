import Image from "next/image";
import { Tilt } from "../fx";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

function Fact({ label, children, className = "" }) {
  return (
    <>
      <dt className={`text-xs uppercase tracking-[0.25em] text-fg/50 ${className}`}>{label}</dt>
      {children}
    </>
  );
}

export default function About({ content }) {
  const { education, profile } = content;
  const { problemSolving } = profile;
  return (
    <section id="about" className="py-section" aria-labelledby="about-title">
      <SectionHeading id="about-title" eyebrow="About" title="A Bit About Me" />
      <div className="grid gap-10 px-gutter lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:gap-16">
        <Reveal>
          <Tilt className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-lg shadow-2xl shadow-scrim/60">
            <Image
              src={profile.portrait.src}
              alt={profile.portrait.alt}
              fill
              sizes="(min-width: 768px) 30vw, 90vw"
              className="object-cover object-[50%_20%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-scrim/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 p-5">
              <p className="font-display text-3xl text-fg">{profile.firstName}</p>
              <p className="text-sm text-fg/70">{profile.role}</p>
            </div>
          </Tilt>
        </Reveal>

        <div className="flex flex-col gap-6">
          {profile.summary.map((paragraph, index) => (
            <Reveal key={index} delay={index * 0.1}>
              <p className="text-lg leading-relaxed text-fg/80 md:text-xl">{paragraph}</p>
            </Reveal>
          ))}

          <Reveal delay={0.2}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-fg/10 bg-fg/[0.03] p-5">
                <Fact label="Education">
                  <dd className="mt-2 text-fg">{education.degree}</dd>
                  <dd className="mt-1 text-sm text-fg/60">{education.school}</dd>
                  {education.score && (
                    <dd className="mt-3 inline-block rounded bg-accent/15 px-2 py-0.5 text-sm text-accent">{education.score}</dd>
                  )}
                </Fact>
                <Fact label="Problem solving" className="mt-5">
                  <dd className="mt-2 text-fg">
                    <a
                      href={profile.links.leetcode}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-fg/30 underline-offset-4 transition hover:text-accent"
                    >
                      {problemSolving.solved} LeetCode problems
                    </a>{" "}
                    in {problemSolving.language}
                  </dd>
                  <dd className="mt-1 text-sm text-fg/60">
                    {problemSolving.medium} medium · {problemSolving.hard} hard · strongest in{" "}
                    {problemSolving.strengths.join(", ").toLowerCase()}
                  </dd>
                </Fact>
              </div>
              <div className="rounded-lg border border-fg/10 bg-fg/[0.03] p-5">
                <Fact label="Based in">
                  <dd className="mt-2 text-fg">{profile.location}</dd>
                </Fact>
                <Fact label="Focus areas" className="mt-4">
                  <dd className="mt-2 text-fg">{profile.focusAreas.join(" · ")}</dd>
                </Fact>
                {profile.openTo && (
                  <Fact label="Open to" className="mt-4">
                    <dd className="mt-2 text-fg">{profile.openTo}</dd>
                  </Fact>
                )}
              </div>
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
