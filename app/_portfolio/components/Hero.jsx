"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { experience, profile, projects } from "../../data/siteData";
import { EASE, Magnetic, Particles } from "../fx";
import { PlayIcon } from "./Opening";

const current = experience.find((job) => job.current) ?? experience[experience.length - 1];

export default function Hero({ onPlayIntro, onMoreInfo }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const portraitScale = useTransform(scrollYProgress, [0, 1], [1.05, 1.15]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[620px] w-full overflow-hidden" aria-label="Featured">
      <motion.div className="absolute inset-0 md:left-[30%]" style={{ y: portraitY, scale: portraitScale }}>
        <Image
          src={profile.portrait.src}
          alt={profile.portrait.alt}
          fill
          priority
          sizes="(min-width: 768px) 70vw, 100vw"
          className="object-cover object-[50%_25%]"
        />
      </motion.div>

      {/* fade the portrait into the page on the left and bottom */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/70 to-transparent md:via-ink/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-black/40" />

      <Particles className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* light streaks */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-1/3 h-px w-[150%] rotate-[-8deg] bg-gradient-to-r from-transparent via-accent/50 to-transparent"
        animate={{ x: ["-30%", "30%"] }}
        transition={{ duration: 9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-4 pb-[14vh] md:justify-center md:px-12 md:pb-0"
        style={{ y: copyY, opacity: fade }}
      >
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
        >
          <span className="font-display text-3xl leading-none text-accent">B</span>
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-white/80">Portfolio</span>
        </motion.div>

        <motion.h1
          className="mt-3 font-display text-[18vw] leading-[0.82] text-white md:text-[9vw]"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
        >
          {profile.firstName}
          <span className="block text-[0.55em] tracking-wide text-white/85">{profile.lastName}</span>
        </motion.h1>

        <motion.div
          className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/80 md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <span className="font-semibold text-emerald-400">Currently at {current.company}</span>
          <span>Since 2023</span>
          <span className="rounded border border-white/40 px-1.5 text-xs">{experience.length} roles</span>
          <span className="rounded border border-white/40 px-1.5 text-xs">{projects.length} projects</span>
          <span className="rounded border border-white/40 px-1.5 text-xs">1.5+ yrs</span>
        </motion.div>

        <motion.p
          className="mt-4 max-w-xl text-base leading-relaxed text-white/85 md:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
        >
          {profile.logline}
        </motion.p>

        <motion.div
          className="mt-7 flex flex-wrap gap-3"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.85 }}
        >
          <Magnetic strength={0.2}>
            <button
              type="button"
              onClick={onPlayIntro}
              className="flex items-center gap-2 rounded-md bg-white px-6 py-3 text-base font-semibold text-black transition hover:bg-white/80 md:px-8 md:text-lg"
            >
              <PlayIcon className="h-5 w-5" />
              Quick Intro
            </button>
          </Magnetic>
          <Magnetic strength={0.2}>
            <button
              type="button"
              onClick={onMoreInfo}
              className="flex items-center gap-2 rounded-md bg-white/20 px-6 py-3 text-base font-semibold text-white backdrop-blur transition hover:bg-white/30 md:px-8 md:text-lg"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
                <path d="M12 11v6M12 7.5v.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              About Me
            </button>
          </Magnetic>
        </motion.div>

        <motion.ul
          className="mt-6 flex flex-wrap gap-2 text-xs text-white/70 md:text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          aria-label="Focus areas"
        >
          {profile.focusAreas.map((area, index) => (
            <li key={area} className="flex items-center gap-2">
              {index > 0 && <span className="h-1 w-1 rounded-full bg-white/40" aria-hidden />}
              {area}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      {/* floating chips, desktop only */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block" aria-hidden>
        {[
          { text: "5M+ users", className: "right-[12%] top-[24%]", delay: 0 },
          { text: "LLM-powered", className: "right-[30%] top-[58%]", delay: 1.2 },
          { text: "Next.js · Kotlin", className: "right-[8%] top-[70%]", delay: 2.4 },
        ].map((chip) => (
          <motion.span
            key={chip.text}
            className={`absolute rounded-full border border-white/15 bg-black/40 px-4 py-2 text-sm text-white/80 backdrop-blur-md ${chip.className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, -12, 0] }}
            transition={{
              opacity: { duration: 1, delay: 1.2 + chip.delay / 3 },
              y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: chip.delay },
            }}
          >
            {chip.text}
          </motion.span>
        ))}
      </div>
    </section>
  );
}
