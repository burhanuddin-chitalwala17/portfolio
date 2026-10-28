"use client";

import { m } from "framer-motion";
import { usePortfolioActions } from "../actions";
import { Tilt } from "../fx";

/**
 * The clickable shell around a server-rendered project poster: tilts toward the pointer, opens the
 * project, and shares its layout id with the open modal so the poster animates between them.
 */
export default function ProjectCard({ projectId, label, children }) {
  const { openProject } = usePortfolioActions();
  return (
    <Tilt>
      <button type="button" onClick={() => openProject(projectId)} className="group block w-full text-left" aria-label={label}>
        <m.div layoutId={`poster-${projectId}`} className="overflow-hidden rounded-md shadow-xl shadow-scrim/50">
          {children}
        </m.div>
      </button>
    </Tilt>
  );
}
