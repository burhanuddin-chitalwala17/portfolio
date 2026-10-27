"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { viewerProfiles } from "../data/siteData";
import { SmoothScrollProvider, useScrollLock, useSmoothScroll } from "./smoothScroll";
import { CursorRing } from "./fx";
import OpeningSequence from "./components/OpeningSequence";
import ProfileSelect from "./components/ProfileSelect";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Pilot from "./components/Pilot";
import Seasons from "./components/Seasons";
import Originals from "./components/Originals";
import TopNumbers from "./components/TopNumbers";
import Skills from "./components/Skills";
import BehindTheScenes from "./components/BehindTheScenes";
import Finale from "./components/Finale";
import IntroReel from "./components/IntroReel";
import ProjectModal from "./components/ProjectModal";
import ResumeModal from "./components/ResumeModal";

const STORAGE_KEY = "burhanuddin-series-profile";

const SECTIONS = {
  pilot: Pilot,
  seasons: Seasons,
  originals: Originals,
  numbers: TopNumbers,
  skills: Skills,
  bts: BehindTheScenes,
};

// The chosen profile lives in sessionStorage (with an in-memory fallback) so a reload skips the opening titles.
let memoryProfile = null;
const profileListeners = new Set();

function readStoredProfile() {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (viewerProfiles.some((viewer) => viewer.id === stored)) return stored;
  } catch {
    // Storage is unavailable; fall back to memory.
  }
  return memoryProfile;
}

function storeProfile(id) {
  memoryProfile = id;
  try {
    sessionStorage.setItem(STORAGE_KEY, id);
  } catch {
    // Storage is unavailable, so the opening titles will simply play again next visit.
  }
  profileListeners.forEach((listener) => listener());
}

function subscribeToProfile(listener) {
  profileListeners.add(listener);
  return () => profileListeners.delete(listener);
}

function useStoredProfile() {
  return useSyncExternalStore(subscribeToProfile, readStoredProfile, () => null);
}

export default function Series() {
  return (
    <MotionConfig reducedMotion="user">
      <SmoothScrollProvider>
        <Show />
      </SmoothScrollProvider>
    </MotionConfig>
  );
}

function Show() {
  const storedProfile = useStoredProfile();
  const profileId = storedProfile ?? viewerProfiles[0].id;
  // "auto" plays the opening titles for first-time visitors and skips them for returning ones.
  const [stageChoice, setStage] = useState("auto");
  const stage = stageChoice === "auto" ? (storedProfile ? "home" : "opening") : stageChoice;
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

  const finishOpening = useCallback(() => setStage("profiles"), []);
  const closeIntro = useCallback(() => setIntroOpen(false), []);
  const closeResume = useCallback(() => setResumeOpen(false), []);
  const closeProject = useCallback(() => setProject(null), []);
  const openResume = useCallback(() => setResumeOpen(true), []);

  const pickProfile = (id) => {
    storeProfile(id);
    window.scrollTo(0, 0);
    setStage("home");
  };

  const switchProfile = (id) => {
    storeProfile(id);
    const viewer = viewerProfiles.find((item) => item.id === id);
    setToast(`Now watching as ${viewer.name}: ${viewer.blurb.toLowerCase()}`);
    scrollTo(0);
  };

  const replayOpening = () => {
    window.scrollTo(0, 0);
    setStage("opening");
  };

  const order = viewerProfiles.find((viewer) => viewer.id === profileId).order;

  return (
    <>
      <CursorRing />

      <div className="relative min-h-screen overflow-x-clip bg-ink text-white" inert={overlayOpen}>
        <Navbar profileId={profileId} onSwitchProfile={switchProfile} onOpenResume={openResume} />
        <main>
          <Hero onPlayIntro={() => setIntroOpen(true)} onMoreInfo={() => scrollTo("pilot")} />
          <div className="relative z-10 -mt-[8vh] mx-auto max-w-[1600px]">
            {order.map((id) => {
              const Section = SECTIONS[id];
              return <Section key={id} onOpen={setProject} />;
            })}
          </div>
          <Finale onOpenResume={openResume} onReplay={replayOpening} />
        </main>
      </div>

      <AnimatePresence>{stage === "opening" && <OpeningSequence key="opening" onDone={finishOpening} />}</AnimatePresence>
      <AnimatePresence>{stage === "profiles" && <ProfileSelect key="profiles" onPick={pickProfile} />}</AnimatePresence>
      <AnimatePresence>{introOpen && <IntroReel key="intro" onClose={closeIntro} />}</AnimatePresence>
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
