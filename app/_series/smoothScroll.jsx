"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import Lenis from "lenis";

const SmoothScrollContext = createContext(null);
const NAV_OFFSET = -72;

/** Lenis smooth scrolling plus a counted scroll lock for overlays. */
export function SmoothScrollProvider({ children }) {
  const lenisRef = useRef(null);
  const locksRef = useRef(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ autoRaf: true, duration: 1.15 });
    lenisRef.current = lenis;
    if (locksRef.current > 0) lenis.stop();
    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  const api = useMemo(
    () => ({
      scrollTo(target) {
        const element = typeof target === "string" ? document.getElementById(target) : null;
        if (lenisRef.current) {
          lenisRef.current.scrollTo(element ?? target, { offset: element ? NAV_OFFSET : 0 });
        } else if (element) {
          window.scrollTo({ top: element.getBoundingClientRect().top + window.scrollY + NAV_OFFSET, behavior: "smooth" });
        } else {
          window.scrollTo({ top: target, behavior: "smooth" });
        }
      },
      lock() {
        locksRef.current += 1;
        lenisRef.current?.stop();
        document.documentElement.style.overflow = "hidden";
      },
      unlock() {
        locksRef.current = Math.max(0, locksRef.current - 1);
        if (locksRef.current > 0) return;
        lenisRef.current?.start();
        document.documentElement.style.overflow = "";
      },
    }),
    []
  );

  return <SmoothScrollContext.Provider value={api}>{children}</SmoothScrollContext.Provider>;
}

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

/** Locks page scrolling for as long as `active` is true. */
export function useScrollLock(active) {
  const { lock, unlock } = useSmoothScroll();
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active, lock, unlock]);
}
