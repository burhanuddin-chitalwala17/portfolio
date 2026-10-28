import { ActionButton } from "../actions";
import { Magnetic, Particles } from "../fx";
import { personName } from "../../services/seo/structuredData";
import Reveal from "./Reveal";

const SOCIAL_LINKS = [
  ["LinkedIn", "linkedin"],
  ["GitHub", "github"],
  ["LeetCode", "leetcode"],
  ["Twitter", "twitter"],
  ["Instagram", "instagram"],
];

export default function Contact({ content }) {
  const { profile } = content;
  const links = SOCIAL_LINKS.map(([label, key]) => ({ label, href: profile.links[key] })).filter((link) => link.href);
  return (
    <section id="contact" className="relative overflow-hidden pb-10 pt-24 md:pt-32" aria-labelledby="contact-title">
      <Particles className="pointer-events-none absolute inset-0 h-full w-full opacity-60" count={40} />
      <div className="relative px-gutter text-center">
        <Reveal as="p" className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
          Contact
        </Reveal>
        <h2 id="contact-title" className="mt-4 font-display text-display-section text-fg">
          <Reveal as="span" variant="tracking" className="inline-block tracking-[0.02em]">
            LET&apos;S TALK
          </Reveal>
          <span className="text-accent motion-safe:animate-blink" aria-hidden>
            …
          </span>
        </h2>
        <Reveal as="p" delay={0.2} className="mx-auto mt-6 max-w-xl text-lg text-fg/70">
          I&apos;m always happy to talk about technology and innovation. My inbox is always open.
        </Reveal>

        <Reveal delay={0.3} className="mt-10 flex flex-wrap justify-center gap-3">
          <Magnetic strength={0.2}>
            <a
              href={`mailto:${profile.email}`}
              className="inline-block rounded-md bg-accent px-7 py-3 text-lg font-semibold text-on-accent transition hover:bg-fg"
            >
              Email me
            </a>
          </Magnetic>
          <Magnetic strength={0.2}>
            <ActionButton action="openResume" className="rounded-md bg-fg/15 px-7 py-3 text-lg font-semibold text-fg transition hover:bg-fg/25">
              View resume
            </ActionButton>
          </Magnetic>
          <ActionButton
            action="openChat"
            className="rounded-md border border-accent/60 px-7 py-3 text-lg font-semibold text-accent transition hover:bg-accent hover:text-on-accent"
          >
            Chat with the AI me
          </ActionButton>
        </Reveal>

        <Reveal as="ul" delay={0.4} className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-fg/60">
          {links.map((link) => (
            <li key={link.label}>
              <a href={link.href} target="_blank" rel="noreferrer me" className="inline-block px-1 py-2 transition hover:text-accent">
                {link.label}
              </a>
            </li>
          ))}
        </Reveal>
      </div>

      <footer className="relative mt-20 flex flex-col items-center justify-between gap-3 border-t border-fg/10 px-gutter pt-6 text-xs text-fg/40 md:flex-row">
        <p>
          © {new Date().getFullYear()} {personName(profile)} · {profile.location}
        </p>
        <ActionButton action="replayIntro" className="py-2 transition hover:text-fg">
          ↺ Replay intro
        </ActionButton>
      </footer>
    </section>
  );
}
