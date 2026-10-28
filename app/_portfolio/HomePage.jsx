import PortfolioShell from "./PortfolioShell";
import About from "./sections/About";
import BeyondWork from "./sections/BeyondWork";
import Contact from "./sections/Contact";
import Experience from "./sections/Experience";
import Impact from "./sections/Impact";
import Projects from "./sections/Projects";
import Skills from "./sections/Skills";

/**
 * The portfolio page for a given content version. Server-first: every section renders here as a
 * Server Component, so the whole page is in the HTML. PortfolioShell (client) adds navigation,
 * the hero, overlays, the chat and the visitor's choice of section order.
 * Used by the homepage and the admin preview.
 */
export default function HomePage({ content, chatEnabled = false, hasResume = false }) {
  const sections = {
    about: <About content={content} />,
    experience: <Experience content={content} />,
    projects: <Projects content={content} />,
    impact: <Impact content={content} />,
    skills: <Skills content={content} />,
    beyond: <BeyondWork />,
  };
  return (
    <PortfolioShell
      content={content}
      chatEnabled={chatEnabled}
      hasResume={hasResume}
      sections={sections}
      footer={<Contact content={content} />}
    />
  );
}
