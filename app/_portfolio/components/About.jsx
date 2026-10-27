"use client";

import Image from "next/image";
import { useContent } from "../content";
import { Reveal, Tilt } from "../fx";
import { SectionHeading } from "./Rail";

export default function About() {
  const { education, profile } = useContent();
  const { problemSolving } = profile;
  return (
    <section id="about" className="py-section" aria-labelledby="about-title">
      <SectionHeading eyebrow="About" title={<span id="about-title">A Bit About Me</span>} />
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
                <dt className="text-xs uppercase tracking-[0.25em] text-fg/50">Education</dt>
                <dd className="mt-2 text-fg">{education.degree}</dd>
                <dd className="mt-1 text-sm text-fg/60">{education.school}</dd>
                <dd className="mt-3 inline-block rounded bg-accent/15 px-2 py-0.5 text-sm text-accent">{education.score}</dd>
                <dt className="mt-5 text-xs uppercase tracking-[0.25em] text-fg/50">Problem solving</dt>
                <dd className="mt-2 text-fg">
                  <a href={profile.links.leetcode} target="_blank" rel="noreferrer" className="underline decoration-fg/30 underline-offset-4 transition hover:text-accent">
                    {problemSolving.solved} LeetCode problems
                  </a>{" "}
                  in {problemSolving.language}
                </dd>
                <dd className="mt-1 text-sm text-fg/60">
                  {problemSolving.medium} medium · {problemSolving.hard} hard · strongest in {problemSolving.strengths.join(", ").toLowerCase()}
                </dd>
              </div>
              <div className="rounded-lg border border-fg/10 bg-fg/[0.03] p-5">
                <dt className="text-xs uppercase tracking-[0.25em] text-fg/50">Based in</dt>
                <dd className="mt-2 text-fg">{profile.location}</dd>
                <dt className="mt-4 text-xs uppercase tracking-[0.25em] text-fg/50">Focus areas</dt>
                <dd className="mt-2 text-fg">{profile.focusAreas.join(" · ")}</dd>
                <dt className="mt-4 text-xs uppercase tracking-[0.25em] text-fg/50">Open to</dt>
                <dd className="mt-2 text-fg">{profile.openTo}</dd>
              </div>
            </dl>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
