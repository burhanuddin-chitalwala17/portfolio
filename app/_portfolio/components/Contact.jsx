"use client";

import { motion } from "framer-motion";
import { useContent } from "../content";
import { EASE, Magnetic, Particles, Reveal } from "../fx";

export default function Contact({ onOpenResume, onReplay, onOpenChat }) {
  const { profile } = useContent();
  const links = [
    { label: "LinkedIn", href: profile.links.linkedin },
    { label: "GitHub", href: profile.links.github },
    { label: "LeetCode", href: profile.links.leetcode },
    { label: "Twitter", href: profile.links.twitter },
    { label: "Instagram", href: profile.links.instagram },
  ].filter((link) => link.href);
  return (
    <section id="contact" className="relative overflow-hidden pb-10 pt-24 md:pt-32" aria-labelledby="contact-title">
      <Particles className="pointer-events-none absolute inset-0 h-full w-full opacity-60" count={40} />
      <div className="relative px-gutter text-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Contact</p>
        </Reveal>
        <h2 id="contact-title" className="mt-4 font-display text-display-section text-fg">
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, letterSpacing: "0.3em" }}
            whileInView={{ opacity: 1, letterSpacing: "0.02em" }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: EASE }}
          >
            LET&apos;S TALK
          </motion.span>
          <motion.span
            className="text-accent"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            …
          </motion.span>
        </h2>
        <Reveal delay={0.2}>
          <p className="mx-auto mt-6 max-w-xl text-lg text-fg/70">
            I&apos;m open to new roles and collaborations in full-stack, mobile and AI products. My inbox is always open.
          </p>
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
            <button
              type="button"
              onClick={onOpenResume}
              className="rounded-md bg-fg/15 px-7 py-3 text-lg font-semibold text-fg transition hover:bg-fg/25"
            >
              View resume
            </button>
          </Magnetic>
          {onOpenChat && (
            <Magnetic strength={0.2}>
              <button
                type="button"
                onClick={onOpenChat}
                className="rounded-md border border-accent/60 px-7 py-3 text-lg font-semibold text-accent transition hover:bg-accent hover:text-on-accent"
              >
                Chat with the AI me
              </button>
            </Magnetic>
          )}
        </Reveal>

        <Reveal delay={0.4}>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-fg/60">
            {links.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noreferrer" className="inline-block px-1 py-2 transition hover:text-accent">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <footer className="relative mt-20 flex flex-col items-center justify-between gap-3 border-t border-fg/10 px-gutter pt-6 text-xs text-fg/40 md:flex-row">
        <p>© {new Date().getFullYear()} Burhanuddin Chitalwala · {profile.location}</p>
        <button type="button" onClick={onReplay} className="py-2 transition hover:text-fg">
          ↺ Replay intro
        </button>
      </footer>
    </section>
  );
}
