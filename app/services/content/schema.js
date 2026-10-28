import { z } from "zod";

/*
 * The homepage content that can change without a deploy. Every version, whether generated
 * from a resume or edited by hand, must pass ContentSchema before it can be published.
 */

const text = (max) => z.string().trim().min(1).max(max);
const optionalText = (max) => z.string().trim().max(max);
const url = z.union([z.literal(""), z.string().trim().url().max(300), z.string().trim().regex(/^\/[\w\-./]*$/).max(200)]);

const linkSchema = z.object({ label: text(40), href: url });
const artSchema = z.object({
  from: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  via: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  to: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

const problemSolvingSchema = z.object({
  solved: z.number().int().min(0),
  medium: z.number().int().min(0),
  hard: z.number().int().min(0),
  language: optionalText(40),
  strengths: z.array(text(40)).max(8),
  badges: optionalText(200),
});

const profileFields = {
  role: text(80),
  yearsExperience: text(10),
  focusAreas: z.array(text(40)).min(1).max(5),
  logline: text(300),
  summary: z.array(text(600)).min(1).max(4),
  openTo: optionalText(120),
  location: text(80),
  email: z.string().trim().email(),
  links: z.object({
    linkedin: url,
    github: url,
    leetcode: url,
    twitter: url,
    instagram: url,
  }),
  problemSolving: problemSolvingSchema,
};

const experienceSchema = z.object({
  years: text(20),
  company: text(80),
  role: text(80),
  place: text(80),
  period: text(40),
  current: z.boolean().default(false),
  logline: optionalText(300),
  highlights: z.array(z.object({ title: text(60), text: text(600) })).min(1).max(8),
});

const projectFields = {
  id: z.string().trim().regex(/^[a-z0-9-]{1,40}$/),
  title: text(40),
  subtitle: text(50),
  kind: text(30),
  logline: text(300),
  points: z.array(text(400)).min(1).max(6),
  tech: z.array(text(30)).max(10),
  links: z.array(linkSchema).max(3).default([]),
};

const sharedSections = {
  education: z.object({ school: text(120), degree: text(120), score: optionalText(30) }),
  experience: z.array(experienceSchema).min(1).max(10),
  impactNumbers: z.array(z.object({ value: text(12), label: text(120), source: text(40) })).min(1).max(10),
  skillGroups: z.array(z.object({ name: text(40), items: z.array(text(40)).min(1).max(16) })).min(1).max(8),
  introSlides: z.array(z.object({ eyebrow: text(30), title: text(40), text: text(200) })).min(2).max(7),
};

export const ContentSchema = z.object({
  profile: z.object({
    ...profileFields,
    firstName: text(30),
    lastName: text(30),
    introCard: text(40),
    resumePdf: text(200),
    portrait: z.object({ src: text(200), alt: text(120), cutout: text(200).optional() }),
    // Short tags that float beside the portrait on large screens.
    heroTags: z.array(text(32)).max(3).default([]),
  }),
  projects: z.array(z.object({ ...projectFields, art: artSchema.optional() })).min(1).max(12),
  ...sharedSections,
});

/**
 * What the model fills in from a resume. Presentation-only fields (name styling, portrait,
 * project colours) are kept from the current version instead.
 */
export const GeneratedContentSchema = z.object({
  changeSummary: z.string(),
  profile: z.object(profileFields),
  projects: z.array(z.object(projectFields)),
  ...sharedSections,
});

/** Turns a zod error into short messages like "projects.2.title: Too big". */
export function describeIssues(error) {
  return error.issues.slice(0, 8).map((issue) => `${issue.path.join(".") || "content"}: ${issue.message}`);
}
