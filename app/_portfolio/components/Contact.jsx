"use client";

import { motion } from "framer-motion";
import { profile } from "../../data/siteData";
import { EASE, Magnetic, Particles, Reveal } from "../fx";

const LINKS = [
  { label: "LinkedIn", href: profile.links.linkedin },
  { label: "GitHub", href: profile.links.github },
  { label: "Twitter", href: profile.links.twitter },
  { label: "Instagram", href: profile.links.instagram },
];

export default function Contact({ onOpenResume, onReplay }) {
  return (
    <section id="contact" className="relative overflow-hidden pb-10 pt-24 md:pt-32" aria-labelledby="contact-title">
      <Particles className="pointer-events-none absolute inset-0 h-full w-full opacity-60" count={40} />
      <div className="relative px-4 text-center md:px-12">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">Contact</p>
        </Reveal>
        <h2 id="contact-title" className="mt-4 font-display text-[16vw] leading-[0.85] text-white md:text-[9vw]">
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
          <p className="mx-auto mt-6 max-w-xl text-lg text-white/70">
            I&apos;m open to new roles and collaborations in full-stack, mobile and AI products. My inbox is always open.
          </p>
        </Reveal>

        <Reveal delay={0.3} className="mt-10 flex flex-wrap justify-center gap-3">
          <Magnetic strength={0.2}>
            <a
              href={`mailto:${profile.email}`}
              className="inline-block rounded-md bg-accent px-7 py-3 text-lg font-semibold text-black transition hover:bg-white"
            >
              Email me
            </a>
          </Magnetic>
          <Magnetic strength={0.2}>
            <button
              type="button"
              onClick={onOpenResume}
              className="rounded-md bg-white/15 px-7 py-3 text-lg font-semibold text-white transition hover:bg-white/25"
            >
              View resume
            </button>
          </Magnetic>
        </Reveal>

        <Reveal delay={0.4}>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-white/60">
            {LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href} target="_blank" rel="noreferrer" className="transition hover:text-accent">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>

      <footer className="relative mt-20 flex flex-col items-center justify-between gap-3 border-t border-white/10 px-4 pt-6 text-xs text-white/40 md:flex-row md:px-12">
        <p>© {new Date().getFullYear()} Burhanuddin Chitalwala · {profile.location}</p>
        <button type="button" onClick={onReplay} className="transition hover:text-white">
          ↺ Replay intro
        </button>
      </footer>
    </section>
  );
}
