import "server-only";
import { readSetting, writeSetting } from "../settings/store";
import { scanSensitiveData } from "../privacy/sensitiveData";
import { ChatProfileSchema, EMPTY_CHAT_PROFILE } from "./schema";

const SETTINGS_KEY = "chat_profile";

const SECTION_NAMES = { strengths: "Strength", caseStudies: "Case study", skills: "Skill", faqs: "Question", decisions: "decision" };
const FIELD_NAMES = { nextTime: "what you'd do differently", evidence: "evidence", why: "why" };

/** A validation problem in the admin's terms, such as "Skill 3: Name can't be empty." */
function describeIssue(issue) {
  const parts = [];
  for (let i = 0; i < issue.path.length; i += 1) {
    const key = issue.path[i];
    if (SECTION_NAMES[key] && typeof issue.path[i + 1] === "number") {
      parts.push(`${SECTION_NAMES[key]} ${issue.path[i + 1] + 1}`);
      i += 1;
    } else if (typeof key === "string") {
      parts.push(FIELD_NAMES[key] ?? key);
    }
  }
  const field = parts.pop() ?? "the profile";
  const problem =
    issue.code === "too_small" && issue.minimum === 1
      ? `${field} can't be empty`
      : issue.code === "too_big"
        ? `${field} is too long (up to ${issue.maximum} ${issue.origin === "array" ? "items" : "characters"})`
        : `${field}: ${issue.message}`;
  return `${parts.length ? `${parts.join(", ")}: ` : ""}${problem.charAt(0).toUpperCase()}${problem.slice(1)}.`;
}

export function getChatProfile() {
  return readSetting(SETTINGS_KEY, ChatProfileSchema, EMPTY_CHAT_PROFILE);
}

/**
 * Validates and saves the profile. Everything in it is readable by visitors through the chat, so
 * anything that looks like a phone number, ID or secret is refused rather than stored.
 */
export async function saveChatProfile(profile, { publicEmail } = {}) {
  const parsed = ChatProfileSchema.safeParse(profile);
  if (!parsed.success) return { ok: false, error: describeIssue(parsed.error.issues[0]) };
  const findings = scanSensitiveData(JSON.stringify(parsed.data), { allowed: [publicEmail].filter(Boolean) });
  if (findings.length) {
    const kinds = [...new Set(findings.map((finding) => finding.label.toLowerCase()))].join(", ");
    return { ok: false, error: `Visitors can get the chat to repeat anything here, so remove the ${kinds} before saving.` };
  }
  await writeSetting(SETTINGS_KEY, parsed.data);
  return { ok: true, profile: parsed.data };
}

export function isChatProfileEmpty(profile) {
  return !profile.pitch && !profile.strengths.length && !profile.caseStudies.length && !profile.skills.length && !profile.faqs.length;
}

/** The profile as plain text for the chat, project titles resolved from the site content. */
export function chatProfileToText(profile, content) {
  const projectTitle = (id) => content.projects.find((project) => project.id === id)?.title;
  const lines = [];
  if (profile.pitch) lines.push("In my own words:", profile.pitch, "");
  if (profile.strengths.length) {
    lines.push("What sets me apart:");
    for (const strength of profile.strengths) lines.push(`- ${strength.title}: ${strength.evidence}`);
    lines.push("");
  }
  for (const study of profile.caseStudies) {
    const linked = study.projectId && projectTitle(study.projectId);
    lines.push(`Case study: ${study.title}${linked && linked !== study.title ? ` (site project: ${linked})` : ""}`);
    const field = (label, value) => value && lines.push(`${label}: ${value}`);
    field("Problem", study.problem);
    field("My role", study.role);
    field("How it's built", study.architecture);
    for (const { decision, why } of study.decisions) lines.push(`Decision: ${decision}. Why: ${why}`);
    field("Impact", study.impact);
    field("Hardest parts", study.challenges);
    field("What I'd do differently", study.nextTime);
    lines.push("");
  }
  if (profile.skills.length) {
    lines.push("Skills, with how deep they go and where I used them:");
    for (const skill of profile.skills) lines.push(`- ${skill.name} (${skill.level}): ${skill.evidence}`);
    lines.push("");
  }
  if (profile.faqs.length) {
    lines.push("Questions I get asked, with the answers I'd give:");
    for (const faq of profile.faqs) lines.push(`Q: ${faq.question}`, `A: ${faq.answer}`);
  }
  return lines.join("\n").trim();
}
