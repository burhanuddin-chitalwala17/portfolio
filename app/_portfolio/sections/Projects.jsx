import ProjectCard from "../islands/ProjectCard";
import Rail from "../islands/Rail";
import PosterArt from "./PosterArt";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

function Poster({ project }) {
  return (
    <PosterArt project={project} className="aspect-[2/3]">
      <span className="absolute left-3 top-3 font-display text-2xl leading-none text-accent drop-shadow">B</span>
      <span className="absolute right-3 top-3 rounded-sm bg-scrim/40 px-1.5 py-0.5 text-2xs font-semibold uppercase tracking-widest text-fg/90 backdrop-blur">
        {project.kind}
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim/85 via-scrim/30 to-transparent p-3 pt-16">
        <h3 className="font-display text-3xl leading-[0.9] text-fg md:text-4xl">{project.title}</h3>
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
  );
}

export default function Projects({ content }) {
  return (
    <section id="projects" className="py-section" aria-labelledby="projects-title">
      <SectionHeading id="projects-title" eyebrow="Work" title="Projects">
        Things I&apos;ve built at work and on my own. Open any card for the details.
      </SectionHeading>
      <Rail label="Projects">
        {content.projects.map((project, index) => (
          <li key={project.id} className="w-[46vw] shrink-0 snap-start sm:w-[30vw] md:w-[22vw] lg:w-[17vw]">
            <Reveal delay={index * 0.06}>
              <ProjectCard projectId={project.id} label={`${project.title}: ${project.subtitle}. Open details`}>
                <Poster project={project} />
              </ProjectCard>
            </Reveal>
          </li>
        ))}
      </Rail>
    </section>
  );
}
