"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { visitorTypes } from "../data/siteData";
import { SmoothScrollProvider, useScrollLock, useSmoothScroll } from "./smoothScroll";
import { CursorRing } from "./fx";
import Opening from "./components/Opening";
import VisitorSelect from "./components/VisitorSelect";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import About from "./components/About";
import Experience from "./components/Experience";
import Projects from "./components/Projects";
import Impact from "./components/Impact";
import Skills from "./components/Skills";
import BeyondWork from "./components/BeyondWork";
import Contact from "./components/Contact";
import QuickIntro from "./components/QuickIntro";
import ProjectModal from "./components/ProjectModal";
import ResumeModal from "./components/ResumeModal";

const STORAGE_KEY = "burhanuddin-portfolio-visitor";

const SECTIONS = {
  about: About,
  experience: Experience,
  projects: Projects,
  impact: Impact,
  skills: Skills,
  beyond: BeyondWork,
};

// The chosen visitor type lives in sessionStorage (with an in-memory fallback) so a reload skips the intro.
let memoryVisitor = null;
const visitorListeners = new Set();

function readStoredVisitor() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (visitorTypes.some((viewer) => viewer.id === stored)) return stored;
  } catch {
    // Storage is unavailable; fall back to memory.
  }
  return memoryVisitor;
}

function storeVisitor(id) {
  memoryVisitor = id;
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage is unavailable, so the intro will simply play again next visit.
  }
  visitorListeners.forEach((listener) => listener());
}

function subscribeToVisitor(listener) {
  visitorListeners.add(listener);
  return () => visitorListeners.delete(listener);
}

function useStoredVisitor() {
  return useSyncExternalStore(subscribeToVisitor, readStoredVisitor, () => null);
}

export default function Portfolio() {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScrollProvider>
        <Home />
      </SmoothScrollProvider>
    </MotionConfig>
  );
}

function Home() {
  const storedVisitor = useStoredVisitor();
  const visitorId = storedVisitor ?? visitorTypes[0].id;
  // "auto" plays the intro for first-time visitors and skips them for returning ones.
  const [stageChoice, setStage] = useState("auto");
  const stage = stageChoice === "auto" ? (storedVisitor ? "home" : "opening") : stageChoice;
  const [introOpen, setIntroOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [toast, setToast] = useState(null);
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const overlayOpen = stage !== "home" || introOpen || resumeOpen || Boolean(project);
  useScrollLock(overlayOpen);

  const finishOpening = useCallback(() => setStage("welcome"), []);
  const closeIntro = useCallback(() => setIntroOpen(false), []);
  const closeResume = useCallback(() => setResumeOpen(false), []);
  const closeProject = useCallback(() => setProject(null), []);
  const openResume = useCallback(() => setResumeOpen(true), []);

  const pickVisitor = (id) => {
    storeVisitor(id);
    window.scrollTo(0, 0);
    setStage("home");
  };

  const switchVisitor = (id) => {
    storeVisitor(id);
    const visitor = visitorTypes.find((item) => item.id === id);
    setToast(`Showing the ${visitor.name.toLowerCase()} view: ${visitor.blurb.toLowerCase()}`);
    scrollTo(0);
  };

  const replayOpening = () => {
    window.scrollTo(0, 0);
    setStage("opening");
  };

  const order = visitorTypes.find((visitor) => visitor.id === visitorId).order;

  return (
    <>
      <CursorRing />

      <div className="relative min-h-screen overflow-x-clip bg-ink text-white" inert={overlayOpen}>
        <Navbar visitorId={visitorId} onSwitchVisitor={switchVisitor} onOpenResume={openResume} />
        <main>
          <Hero onPlayIntro={() => setIntroOpen(true)} onMoreInfo={() => scrollTo("about")} />
          <div className="relative z-10 -mt-[8vh] mx-auto max-w-[1600px]">
            {order.map((id) => {
              const Section = SECTIONS[id];
              return <Section key={id} onOpen={setProject} />;
            })}
          </div>
          <Contact onOpenResume={openResume} onReplay={replayOpening} />
        </main>
      </div>

      <AnimatePresence>{stage === "opening" && <Opening key="opening" onDone={finishOpening} />}</AnimatePresence>
      <AnimatePresence>{stage === "welcome" && <VisitorSelect key="welcome" onPick={pickVisitor} />}</AnimatePresence>
      <AnimatePresence>{introOpen && <QuickIntro key="intro" onClose={closeIntro} />}</AnimatePresence>
      <AnimatePresence>{project && <ProjectModal key={project.id} project={project} onClose={closeProject} />}</AnimatePresence>
      <AnimatePresence>{resumeOpen && <ResumeModal key="resume" onClose={closeResume} />}</AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="fixed bottom-6 left-1/2 z-[160] -translate-x-1/2 rounded-md bg-white px-5 py-3 text-sm font-medium text-black shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
