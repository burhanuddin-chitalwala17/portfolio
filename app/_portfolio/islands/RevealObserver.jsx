"use client";

import { useEffect } from "react";

// Reveal a little before content reaches the viewport, so it's mostly in place when seen.
const ROOT_MARGIN = "0px 0px -12% 0px";

/**
 * Animates every [data-reveal] element (see sections/Reveal.jsx). Content already on screen when
 * the page loads stays as it is; content below the fold is hidden, then revealed on scroll.
 * Mounted once by the page shell.
 */
export default function RevealObserver() {
  useEffect(() => {
    const elements = [...document.querySelectorAll("[data-reveal='']")];
    if (!elements.length || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.dataset.reveal = "shown";
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: ROOT_MARGIN }
    );

    const fold = window.innerHeight;
    for (const element of elements) {
      if (element.getBoundingClientRect().top < fold) continue;
      element.dataset.reveal = "pending";
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, []);

  return null;
}
