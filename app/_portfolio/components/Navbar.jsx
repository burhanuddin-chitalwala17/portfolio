"use client";

import { useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { navSections, visitorTypes } from "../../data/siteData";
import { useSmoothScroll } from "../smoothScroll";
import { EASE } from "../fx";
import { VisitorAvatar } from "./VisitorSelect";

export default function Navbar({ visitorId, onSwitchVisitor, onOpenResume }) {
  const { scrollTo } = useSmoothScroll();
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewsOpen, setViewsOpen] = useState(false);
  const visitor = visitorTypes.find((item) => item.id === visitorId);

  useMotionValueEvent(scrollY, "change", (current) => {
    const previous = scrollY.getPrevious() ?? 0;
    setSolid(current > 40);
    setHidden(current > 400 && current > previous && !menuOpen && !viewsOpen);
  });

  const go = (id) => {
    setMenuOpen(false);
    scrollTo(id);
  };

  return (
    <motion.header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-500 ${
        solid ? "bg-ink/90 backdrop-blur-md" : "bg-gradient-to-b from-black/80 to-transparent"
      }`}
      animate={{ y: hidden ? "-100%" : 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      <nav className="mx-auto flex h-16 max-w-[1600px] items-center gap-6 px-4 md:h-[72px] md:px-12" aria-label="Main">
        <button
          type="button"
          onClick={() => scrollTo(0)}
          className="font-display text-2xl tracking-wider text-accent md:text-3xl"
          aria-label="Back to top"
        >
          BURHANUDDIN
        </button>

        <ul className="hidden items-center gap-5 text-sm text-white/75 md:flex">
          {navSections.map((section) => (
            <li key={section.id}>
              <button type="button" onClick={() => go(section.id)} className="px-1 py-2 transition hover:text-white">
                {section.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenResume}
            className="rounded border border-white/25 px-3 py-1.5 text-sm text-white/90 transition hover:border-accent hover:text-accent"
          >
            Resume
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setViewsOpen((open) => !open)}
              aria-expanded={viewsOpen}
              aria-haspopup="menu"
              aria-label={`Viewing as ${visitor.name}. Change view`}
              className="flex items-center gap-1"
            >
              <VisitorAvatar visitor={visitor} className="h-8 w-8 rounded" />
              <svg viewBox="0 0 24 24" className={`h-4 w-4 text-white transition ${viewsOpen ? "rotate-180" : ""}`} aria-hidden>
                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
            </button>
            <AnimatePresence>
              {viewsOpen && (
                <motion.ul
                  role="menu"
                  className="absolute right-0 mt-3 w-56 overflow-hidden rounded-md border border-white/10 bg-black/95 py-2 shadow-2xl"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {visitorTypes.map((item) => (
                    <li key={item.id} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setViewsOpen(false);
                          onSwitchVisitor(item.id);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
                      >
                        <VisitorAvatar visitor={item} className="h-7 w-7 rounded" />
                        <span className="flex-1">{item.name}</span>
                        {item.id === visitorId && <span className="text-xs text-accent">Current</span>}
                      </button>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" aria-hidden>
              <path
                d={menuOpen ? "M6 6l12 12M18 6 6 18" : "M4 7h16M4 12h16M4 17h16"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.ul
            id="mobile-menu"
            className="overflow-hidden border-t border-white/10 bg-ink/95 px-4 md:hidden"
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          >
            {navSections.map((section) => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => go(section.id)}
                  className="block w-full py-3 text-left text-lg text-white/80"
                >
                  {section.label}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
