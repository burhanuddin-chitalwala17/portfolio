import Reveal from "./Reveal";

/** A section's eyebrow, title and optional intro. `id` labels the section for screen readers. */
export default function SectionHeading({ id, eyebrow, title, children }) {
  return (
    <Reveal className="mb-6 px-gutter md:mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">{eyebrow}</p>
      <h2 id={id} className="mt-2 font-display text-4xl tracking-wide text-fg md:text-6xl">
        {title}
      </h2>
      {children && <p className="mt-2 max-w-2xl text-sm text-fg/60 md:text-base">{children}</p>}
    </Reveal>
  );
}
