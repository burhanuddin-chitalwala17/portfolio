"use client";

import { createContext, useContext } from "react";

/*
 * Page-level actions (open the resume, a project, the chat…) that live in the client shell.
 * Server-rendered sections reach them through the small client pieces below, so the sections
 * themselves stay Server Components.
 */

const PortfolioActionsContext = createContext(null);

/** @param {{ value: { openIntro, openResume, openProject, openChat?, replayIntro, scrollTo } }} props */
export function PortfolioActionsProvider({ value, children }) {
  return <PortfolioActionsContext.Provider value={value}>{children}</PortfolioActionsContext.Provider>;
}

export function usePortfolioActions() {
  const actions = useContext(PortfolioActionsContext);
  if (!actions) throw new Error("usePortfolioActions must be used inside PortfolioActionsProvider");
  return actions;
}

/**
 * A button that runs a page action, for use inside Server Components. Renders nothing when the
 * action isn't available (e.g. the chat is switched off).
 * @param {{ action: "openIntro" | "openResume" | "openChat" | "replayIntro", ... }} props
 */
export function ActionButton({ action, children, ...props }) {
  const actions = usePortfolioActions();
  const run = actions[action];
  if (!run) return null;
  return (
    <button type="button" onClick={() => run()} {...props}>
      {children}
    </button>
  );
}
