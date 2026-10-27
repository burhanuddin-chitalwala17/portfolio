"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { useContent } from "../content";
import { EASE, Magnetic, Particles } from "../fx";
import { PlayIcon } from "./Opening";

export default function Hero({ onPlayIntro, onMoreInfo }) {
  const { experience, profile, projects } = useContent();
  const current = experience.find((job) => job.current) ?? experience[experience.length - 1];
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const portraitY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} id="top" className="relative h-[100svh] min-h-[620px] w-full overflow-hidden" aria-label="Featured">
      {/* gold glow behind the portrait: centred on phones, to the right on wider screens */}
      <div
        aria-hidden
        className="absolute inset-0 lg:hidden"
        style={{ background: "radial-gradient(70% 40% at 50% 28%, rgb(var(--color-accent) / 0.2), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 hidden lg:block"
        style={{ background: "radial-gradient(42% 60% at 74% 60%, rgb(var(--color-accent) / 0.22), transparent 70%)" }}
      />

      <Particles className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* Background-removed portrait. On phones and tablets it sits above the copy and fades out
          downwards; on laptops and up it stands on the bottom edge to the right of the copy. */}
      <div className="absolute left-1/2 top-[8%] aspect-[947/921] h-[44%] -translate-x-1/2 [-webkit-mask-image:linear-gradient(to_bottom,black_55%,transparent)] [mask-image:linear-gradient(to_bottom,black_55%,transparent)] lg:bottom-0 lg:left-auto lg:right-[3%] lg:top-auto lg:h-[66%] lg:translate-x-0 lg:[-webkit-mask-image:none] lg:[mask-image:none] xl:h-[86%]">
        <motion.div className="relative h-full w-full" style={{ y: portraitY }}>
          <Image
            src={profile.portrait.cutout ?? profile.portrait.src}
            alt={profile.portrait.alt}
            fill
            priority
            sizes="(min-width: 768px) 55vw, 100vw"
            className="object-contain object-bottom drop-shadow-[0_24px_60px_rgb(var(--color-scrim)/0.6)]"
          />
        </motion.div>
      </div>

      {/* blend the waist-level crop into the page, and keep the copy readable on phones */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-canvas via-canvas/70 to-transparent lg:h-1/3 lg:via-canvas/40" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-canvas/80 via-transparent to-transparent lg:block" />

      {/* light streaks */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-1/3 h-px w-[150%] rotate-[-8deg] bg-gradient-to-r from-transparent via-accent/50 to-transparent"
        animate={{ x: ["-30%", "30%"] }}
        transition={{ duration: 9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 mx-auto flex h-full max-w-[1600px] flex-col justify-end px-gutter pb-[12vh] lg:justify-center lg:pb-0"
        style={{ y: copyY, opacity: fade }}
      >
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
        >
          <span className="font-display text-3xl leading-none text-accent">B</span>
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-fg/80">Portfolio</span>
        </motion.div>

        <motion.h1
          className="mt-3 font-display text-display-hero text-fg"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: EASE, delay: 0.3 }}
        >
          {profile.firstName}
          <span className="block text-[0.55em] tracking-wide text-fg/85">{profile.lastName}</span>
        </motion.h1>

        <motion.div
          className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-fg/80 md:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <span className="font-semibold text-success">Currently at {current.company}</span>
          <span>Since 2023</span>
          <span className="rounded border border-fg/40 px-1.5 text-xs">{experience.length} roles</span>
          <span className="rounded border border-fg/40 px-1.5 text-xs">{projects.length} projects</span>
          <span className="rounded border border-fg/40 px-1.5 text-xs">{profile.yearsExperience} yrs</span>
        </motion.div>

        <motion.p
          className="mt-4 max-w-xl text-base leading-relaxed text-fg/85 md:text-lg"
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
              className="flex items-center gap-2 rounded-md bg-fg px-6 py-3 text-base font-semibold text-inverse transition hover:bg-fg/80 md:px-8 md:text-lg"
            >
              <PlayIcon className="h-5 w-5" />
              Quick Intro
            </button>
          </Magnetic>
          <Magnetic strength={0.2}>
            <button
              type="button"
              onClick={onMoreInfo}
              className="flex items-center gap-2 rounded-md bg-fg/20 px-6 py-3 text-base font-semibold text-fg backdrop-blur transition hover:bg-fg/30 md:px-8 md:text-lg"
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
          className="mt-6 flex flex-wrap gap-2 text-xs text-fg/70 md:text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1 }}
          aria-label="Focus areas"
        >
          {profile.focusAreas.map((area, index) => (
            <li key={area} className="flex items-center gap-2">
              {index > 0 && <span className="h-1 w-1 rounded-full bg-fg/40" aria-hidden />}
              {area}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      {/* floating chips, desktop only */}
      <div className="pointer-events-none absolute inset-0 z-10 hidden xl:block" aria-hidden>
        {[
          { text: "$786M+ projected", className: "right-[12%] top-[24%]", delay: 0 },
          { text: "LLM-powered", className: "right-[30%] top-[58%]", delay: 1.2 },
          { text: "Next.js · Java · Python", className: "right-[8%] top-[70%]", delay: 2.4 },
        ].map((chip) => (
          <motion.span
            key={chip.text}
            className={`absolute rounded-full border border-fg/15 bg-scrim/40 px-4 py-2 text-sm text-fg/80 backdrop-blur-md ${chip.className}`}
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
