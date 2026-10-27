"use client";

import { motion } from "framer-motion";
import { originals } from "../../data/siteData";
import { Reveal, Tilt } from "../fx";
import { Rail, SectionHeading } from "./Rail";

export default function Originals({ onOpen }) {
  return (
    <section id="originals" className="py-14 md:py-20" aria-labelledby="originals-title">
      <SectionHeading eyebrow="Projects" title={<span id="originals-title">Originals</span>}>
        Things I&apos;ve built at work and on my own. Pick a poster for the full story.
      </SectionHeading>
      <Rail label="Projects">
        {originals.map((project, index) => (
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
        style={{ background: "radial-gradient(80% 60% at 70% 20%, rgba(255,255,255,0.35), transparent 60%)" }}
      />
      <div aria-hidden className="grain absolute inset-0 opacity-30" />
      {children}
    </div>
  );
}

function Poster({ project }) {
  return (
    <motion.div layoutId={`poster-${project.id}`} className="overflow-hidden rounded-md shadow-xl shadow-black/50">
      <PosterArt project={project} className="aspect-[2/3]">
        <span className="absolute left-3 top-3 font-display text-2xl leading-none text-accent drop-shadow">B</span>
        <span className="absolute right-3 top-3 rounded-sm bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white/90 backdrop-blur">
          {project.kind}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-3 pt-16">
          <p className="font-display text-3xl leading-[0.9] text-white md:text-4xl">{project.title}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/70">{project.subtitle}</p>
          <ul className="mt-3 flex max-h-0 flex-wrap gap-1 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-20 group-hover:opacity-100 group-focus-visible:max-h-20 group-focus-visible:opacity-100">
            {project.tech.slice(0, 3).map((tech) => (
              <li key={tech} className="rounded-sm bg-white/15 px-1.5 py-0.5 text-[10px] text-white">
                {tech}
              </li>
            ))}
          </ul>
        </div>
      </PosterArt>
    </motion.div>
  );
}
