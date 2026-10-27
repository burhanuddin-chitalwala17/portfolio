import "server-only";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "../db/client";
import { documents } from "../db/schema";
import { getPublishedContent } from "../content/siteContent";
import { redactSensitiveData } from "../privacy/sensitiveData";

/** Renders the published site content as plain text for the model. */
export function contentToText(content) {
  const { profile, education, experience, projects, impactNumbers, skillGroups } = content;
  const lines = [
    `Name: ${profile.firstName} ${profile.lastName}`,
    `Role: ${profile.role} (${profile.yearsExperience} years of experience)`,
    `Location: ${profile.location}`,
    profile.openTo && `Open to: ${profile.openTo}`,
    `Public email: ${profile.email}`,
    `Focus areas: ${profile.focusAreas.join(", ")}`,
    "",
    ...profile.summary,
    "",
    `Education: ${education.degree}, ${education.school}${education.score ? ` (${education.score})` : ""}`,
    "",
    "Experience:",
    ...[...experience].reverse().flatMap((job) => [
      `- ${job.role} at ${job.company}, ${job.place}, ${job.period}${job.current ? " (current)" : ""}. ${job.logline}`,
      ...job.highlights.map((highlight) => `  - ${highlight.title}: ${highlight.text}`),
    ]),
    "",
    "Projects:",
    ...projects.flatMap((project) => [
      `- ${project.title} (${project.subtitle}; ${project.kind}). ${project.logline}`,
      ...project.points.map((point) => `  - ${point}`),
      `  Tech: ${project.tech.join(", ")}`,
      ...project.links.map((link) => `  ${link.label}: ${link.href}`),
    ]),
    "",
    "Results:",
    ...impactNumbers.map((item) => `- ${item.value} ${item.label} (${item.source})`),
    "",
    "Skills:",
    ...skillGroups.map((group) => `- ${group.name}: ${group.items.join(", ")}`),
    "",
    `Problem solving: ${profile.problemSolving.solved} LeetCode problems (${profile.problemSolving.medium} medium, ${profile.problemSolving.hard} hard), mostly in ${profile.problemSolving.language}.`,
    "",
    "Links:",
    ...Object.entries(profile.links)
      .filter(([, href]) => href)
      .map(([name, href]) => `- ${name}: ${href}`),
  ];
  return lines.filter((line) => line !== false && line !== undefined && line !== null).join("\n");
}

/**
 * Everything the chat may draw on: the published site content plus the text of documents the
 * admin allowed, with detected sensitive values removed. Ordered deterministically so the
 * prompt prefix (and its cache) stays stable until the content or documents change.
 */
export async function buildKnowledge() {
  const { content } = await getPublishedContent();
  const db = getDb();
  const allowedDocuments = db
    ? await db
        .select({ name: documents.name, text: documents.extractedText })
        .from(documents)
        .where(and(eq(documents.useInChat, true), isNotNull(documents.extractedText)))
        .orderBy(asc(documents.uploadedAt))
    : [];

  const allowed = [content.profile.email];
  const sections = [
    `<portfolio_content>\n${contentToText(content)}\n</portfolio_content>`,
    ...allowedDocuments.map(
      (document) =>
        `<document name="${document.name.replace(/"/g, "'")}">\n${redactSensitiveData(document.text, { allowed })}\n</document>`
    ),
  ];
  const text = sections.join("\n\n");
  return { text, content, documentCount: allowedDocuments.length, approxTokens: Math.ceil(text.length / 4) };
}
