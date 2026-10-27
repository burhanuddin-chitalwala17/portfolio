"use client";

import { skillGenres } from "../../data/siteData";
import { Reveal, Tilt } from "../fx";
import { SectionHeading } from "./Rail";

const GENRE_TINTS = [
  "from-amber-500/25",
  "from-sky-500/25",
  "from-emerald-500/25",
  "from-fuchsia-500/25",
];

export default function Skills() {
  return (
    <section id="skills" className="py-14 md:py-20" aria-labelledby="skills-title">
      <SectionHeading eyebrow="Browse by genre" title={<span id="skills-title">Skills</span>} />
      <div className="grid gap-4 px-4 sm:grid-cols-2 md:px-12 xl:grid-cols-4">
        {skillGenres.map((genre, index) => (
          <Reveal key={genre.genre} delay={index * 0.08}>
            <Tilt max={6} className="h-full">
              <div
                className={`h-full rounded-lg border border-white/10 bg-gradient-to-br ${GENRE_TINTS[index % GENRE_TINTS.length]} to-transparent p-5`}
              >
                <h3 className="font-display text-3xl tracking-wide text-white">{genre.genre}</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">{genre.items.length} titles</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {genre.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-white/15 bg-black/30 px-3 py-1 text-sm text-white/85 transition hover:border-accent hover:text-accent"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Tilt>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
