"use client";

import { Fragment, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, LazyMotion, MotionConfig, m } from "framer-motion";
import { visitorTypes } from "../data/siteData";
import { SmoothScrollProvider, useScrollLock, useSmoothScroll } from "./smoothScroll";
import { CursorRing } from "./fx";
import { ContentProvider } from "./content";
import { PortfolioActionsProvider } from "./actions";
import RevealObserver from "./islands/RevealObserver";
import Opening from "./components/Opening";
import VisitorSelect from "./components/VisitorSelect";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";

// Shown only on demand, so their code loads when first needed instead of with the page.
const QuickIntro = dynamic(() => import("./components/QuickIntro"));
const ProjectModal = dynamic(() => import("./components/ProjectModal"));
const ResumeModal = dynamic(() => import("./components/ResumeModal"));
const Chat = dynamic(() => import("./components/Chat"));

const STORAGE_KEY = "burhanuddin-portfolio-visitor";

const loadMotionFeatures = () => import("./motionFeatures").then((module) => module.default);

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

/**
 * The interactive frame of the homepage: navigation, hero, intro and overlays, chat, and the order
 * of sections for the chosen kind of visitor. The sections themselves are Server Components
 * rendered by app/page.js and passed in as `sections` (keyed by id) and `footer`.
 */
export default function PortfolioShell({ content, chatEnabled = false, hasResume = false, sections, footer }) {
  return (
    <ContentProvider content={content}>
      {/* `m` components with lazily loaded features keep most of Framer Motion out of the first load;
          `strict` makes accidental use of the full `motion` component an error. */}
      <LazyMotion features={loadMotionFeatures} strict>
        <MotionConfig reducedMotion="user">
          <SmoothScrollProvider>
            <Home content={content} chatEnabled={chatEnabled} hasResume={hasResume} sections={sections} footer={footer} />
          </SmoothScrollProvider>
        </MotionConfig>
      </LazyMotion>
    </ContentProvider>
  );
}

function Home({ content, chatEnabled, hasResume, sections, footer }) {
  const storedVisitor = useStoredVisitor();
  const visitorId = storedVisitor ?? visitorTypes[0].id;
  // "auto" plays the intro for first-time visitors and skips them for returning ones.
  const [stageChoice, setStage] = useState("auto");
  const stage = stageChoice === "auto" ? (storedVisitor ? "home" : "opening") : stageChoice;
  const [introOpen, setIntroOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [project, setProject] = useState(null);
  const [toast, setToast] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
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

  const actions = useMemo(
    () => ({
      openIntro: () => setIntroOpen(true),
      // Resume buttons only appear when a resume is chosen in Admin → Documents.
      openResume: hasResume ? openResume : undefined,
      openProject: (id) => setProject(content.projects.find((item) => item.id === id) ?? null),
      openChat: chatEnabled ? () => setChatOpen(true) : undefined,
      replayIntro: () => {
        window.scrollTo(0, 0);
        setStage("opening");
      },
      scrollTo,
    }),
    [chatEnabled, hasResume, content.projects, openResume, scrollTo]
  );

  const order = visitorTypes.find((visitor) => visitor.id === visitorId).order;

  return (
    <PortfolioActionsProvider value={actions}>
      <CursorRing />
      <RevealObserver />

      <div className="relative min-h-screen overflow-x-clip bg-canvas text-fg" inert={overlayOpen}>
        <Navbar visitorId={visitorId} onSwitchVisitor={switchVisitor} onOpenResume={actions.openResume} />
        <main>
          <Hero />
          <div className="relative z-10 -mt-[8vh] mx-auto max-w-[1600px]">
            {order.map((id) => (
              <Fragment key={id}>{sections[id]}</Fragment>
            ))}
          </div>
          {footer}
        </main>
      </div>

      <AnimatePresence>{stage === "opening" && <Opening key="opening" onDone={finishOpening} />}</AnimatePresence>
      <AnimatePresence>{stage === "welcome" && <VisitorSelect key="welcome" onPick={pickVisitor} />}</AnimatePresence>
      <AnimatePresence>{introOpen && <QuickIntro key="intro" onClose={closeIntro} />}</AnimatePresence>
      <AnimatePresence>{project && <ProjectModal key={project.id} project={project} onClose={closeProject} />}</AnimatePresence>
      <AnimatePresence>{resumeOpen && <ResumeModal key="resume" onClose={closeResume} />}</AnimatePresence>

      {chatEnabled && (
        <Chat open={chatOpen} onOpenChange={setChatOpen} hidden={overlayOpen} audience={storedVisitor} />
      )}

      <AnimatePresence>
        {toast && (
          <m.div
            role="status"
            className="fixed bottom-6 left-1/2 z-[160] -translate-x-1/2 rounded-md bg-fg px-5 py-3 text-sm font-medium text-inverse shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            {toast}
          </m.div>
        )}
      </AnimatePresence>
    </PortfolioActionsProvider>
  );
}
