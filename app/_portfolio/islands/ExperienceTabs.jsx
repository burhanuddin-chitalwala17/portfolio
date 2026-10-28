"use client";

import { Children, useState } from "react";
import { m } from "framer-motion";
import { EASE } from "../motion";

/**
 * Tabs for the jobs. Every job's panel (`children`, in tab order) is server-rendered and stays in
 * the HTML for search engines; the tabs only choose which one is visible.
 * @param {{ tabs: {label: string, detail: string}[], initialIndex: number, children: React.ReactNode }} props
 */
export default function ExperienceTabs({ tabs, initialIndex, children }) {
  const [selected, setSelected] = useState(initialIndex);
  const panels = Children.toArray(children);

  return (
    <>
      <div role="tablist" aria-label="Jobs" className="scrollbar-hide flex gap-2 overflow-x-auto">
        {tabs.map((tab, index) => (
          <button
            key={tab.label}
            type="button"
            role="tab"
            id={`job-tab-${index}`}
            aria-selected={index === selected}
            aria-controls={`job-panel-${index}`}
            onClick={() => setSelected(index)}
            className={`relative shrink-0 rounded-md px-4 py-2 text-sm font-medium transition md:text-base ${
              index === selected ? "text-inverse" : "text-fg/70 hover:text-fg"
            }`}
          >
            {index === selected && (
              <m.span layoutId="job-pill" className="absolute inset-0 rounded-md bg-fg" transition={{ duration: 0.4, ease: EASE }} />
            )}
            <span className="relative">
              {tab.label}
              <span className="ml-2 hidden opacity-60 sm:inline">{tab.detail}</span>
            </span>
          </button>
        ))}
      </div>
      {panels.map((panel, index) => (
        <div
          key={index}
          id={`job-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`job-tab-${index}`}
          hidden={index !== selected}
          // CSS animations restart whenever a hidden element is shown, so the entrance replays per tab.
          className="mt-8 animate-rise motion-reduce:animate-none"
        >
          {panel}
        </div>
      ))}
    </>
  );
}
