"use client";

import { useContent } from "../content";
import { Reveal, Tilt } from "../fx";
import { SectionHeading } from "./Rail";

const GROUP_TINTS = [
  "from-category-1/25",
  "from-category-2/25",
  "from-category-4/25",
  "from-category-3/25",
  "from-category-5/25",
  "from-category-6/25",
];

export default function Skills() {
  const { skillGroups } = useContent();
  return (
    <section id="skills" className="py-section" aria-labelledby="skills-title">
      <SectionHeading eyebrow="Toolkit" title={<span id="skills-title">Skills</span>} />
      <div className="grid gap-4 px-gutter sm:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group, index) => (
          <Reveal key={group.name} delay={index * 0.08}>
            <Tilt max={6} className="h-full">
              <div
                className={`h-full rounded-lg border border-fg/10 bg-gradient-to-br ${GROUP_TINTS[index % GROUP_TINTS.length]} to-transparent p-5`}
              >
                <h3 className="font-display text-3xl tracking-wide text-fg">{group.name}</h3>
                <p className="text-xs uppercase tracking-[0.2em] text-fg/45">{group.items.length} skills</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-fg/15 bg-scrim/30 px-3 py-1 text-sm text-fg/85 transition hover:border-accent hover:text-accent"
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
