"use client";

import { motion } from "framer-motion";
import { useContent } from "../content";
import { Reveal, Tilt } from "../fx";
import { Rail, SectionHeading } from "./Rail";

export default function Projects({ onOpen }) {
  const { projects } = useContent();
  return (
    <section id="projects" className="py-section" aria-labelledby="projects-title">
      <SectionHeading eyebrow="Work" title={<span id="projects-title">Projects</span>}>
        Things I&apos;ve built at work and on my own. Open any card for the details.
      </SectionHeading>
      <Rail label="Projects">
        {projects.map((project, index) => (
          <li key={project.id} className="w-[46vw] shrink-0 snap-start sm:w-[30vw] md:w-[22vw] lg:w-[17vw]">
            <Reveal delay={index * 0.06}>
              <Tilt>
                <button
                  type="button"
                  onClick={() => onOpen(project)}
                  className="group block w-full text-left"
                  aria-label={`${project.title}: ${project.subtitle}. Open details`}
                >
                  <Poster project={project} />
                </button>
              </Tilt>
            </Reveal>
          </li>
        ))}
      </Rail>
    </section>
  );
}

export function PosterArt({ project, className = "", children }) {
  const { from, via, to } = project.art;
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundImage: `linear-gradient(160deg, ${from} 0%, ${via} 55%, ${to} 120%)` }}
    >
      {/* film grain and a soft spotlight to give the gradient some depth */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 mix-blend-overlay"
        style={{ background: "radial-gradient(80% 60% at 70% 20%, rgb(var(--color-fg) / 0.35), transparent 60%)" }}
      />
      <div aria-hidden className="grain absolute inset-0 opacity-30" />
      {children}
    </div>
  );
}

function Poster({ project }) {
  return (
    <motion.div layoutId={`poster-${project.id}`} className="overflow-hidden rounded-md shadow-xl shadow-scrim/50">
      <PosterArt project={project} className="aspect-[2/3]">
        <span className="absolute left-3 top-3 font-display text-2xl leading-none text-accent drop-shadow">B</span>
        <span className="absolute right-3 top-3 rounded-sm bg-scrim/40 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-widest text-fg/90 backdrop-blur">
          {project.kind}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim/85 via-scrim/30 to-transparent p-3 pt-16">
          <p className="font-display text-3xl leading-[0.9] text-fg md:text-4xl">{project.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-fg/70">{project.subtitle}</p>
          <ul className="mt-3 flex max-h-0 flex-wrap gap-1 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-20 group-hover:opacity-100 group-focus-visible:max-h-20 group-focus-visible:opacity-100">
            {project.tech.slice(0, 3).map((tech) => (
              <li key={tech} className="rounded-sm bg-fg/15 px-1.5 py-0.5 text-2xs text-fg">
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </PosterArt>
    </motion.div>
  );
}
