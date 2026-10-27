"use client";

import { createContext, useContext } from "react";
import { defaultContent } from "../data/siteData";

const ContentContext = createContext(defaultContent);

/** Supplies the published homepage content (or the built-in defaults) to every section. */
export function ContentProvider({ content, children }) {
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function useContent() {
  return useContext(ContentContext);
}
