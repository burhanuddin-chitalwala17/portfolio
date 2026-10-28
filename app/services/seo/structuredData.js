import { getSiteUrl } from "./siteUrl";

/*
 * schema.org structured data (JSON-LD) for the homepage, built from the published content, so
 * search engines can show the owner as a person with their role, employer, skills and projects.
 */

const titleCase = (text) => text.charAt(0) + text.slice(1).toLowerCase();

export function personName(profile) {
  return `${titleCase(profile.firstName)} ${titleCase(profile.lastName)}`;
}

function absolute(url, base) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** @returns {object} a JSON-LD graph with the Person, the WebSite and the projects */
export function buildStructuredData(content) {
  const base = getSiteUrl();
  const { profile, experience, education, projects, skillGroups } = content;
  const current = experience.find((job) => job.current) ?? experience[experience.length - 1];
  const personId = `${base}/#person`;

  const person = {
    "@type": "Person",
    "@id": personId,
    name: personName(profile),
    jobTitle: profile.role,
    description: profile.logline,
    url: base,
    image: absolute(profile.portrait.src, base),
    email: profile.email ? `mailto:${profile.email}` : undefined,
    address: profile.location ? { "@type": "PostalAddress", addressLocality: profile.location } : undefined,
    worksFor: current ? { "@type": "Organization", name: current.company } : undefined,
    alumniOf: education?.school ? { "@type": "CollegeOrUniversity", name: education.school } : undefined,
    knowsAbout: [...new Set(skillGroups.flatMap((group) => group.items))].slice(0, 30),
    sameAs: Object.values(profile.links).filter((link) => link?.startsWith("http")),
  };

  const website = {
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base,
    name: `${personName(profile)} — ${profile.role}`,
    about: { "@id": personId },
  };

  const work = projects.map((project) => {
    const repo = project.links.find((link) => link.href.includes("github.com"));
    const site = project.links.find((link) => link.href.startsWith("http") && !link.href.includes("github.com"));
    return {
      "@type": repo ? "SoftwareSourceCode" : "CreativeWork",
      name: project.title,
      description: project.logline,
      creator: { "@id": personId },
      keywords: project.tech.join(", "),
      url: site?.href ?? repo?.href,
      codeRepository: repo?.href,
    };
  });

  return { "@context": "https://schema.org", "@graph": [person, website, ...work] };
}

/** Serialises JSON-LD for a <script> tag, escaping "<" so content can't close the tag early. */
export function serializeJsonLd(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
