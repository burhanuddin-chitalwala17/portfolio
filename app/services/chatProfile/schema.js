import { z } from "zod";

/*
 * The chat profile: what the portfolio chat knows about Burhanuddin beyond the site's bullets,
 * written by him (with the AI interview's help) in Admin → Chat. It's the chat's primary source.
 */

const text = (max) => z.string().trim().max(max);
const required = (max) => z.string().trim().min(1).max(max);

export const SKILL_LEVELS = ["expert", "strong", "working"];

export const StrengthSchema = z.object({
  title: required(100),
  evidence: required(800),
});

export const DecisionSchema = z.object({
  decision: required(200),
  why: required(800),
});

export const CaseStudySchema = z.object({
  /** The site project this describes, or "" for one that isn't on the site. */
  projectId: text(60),
  title: required(100),
  problem: text(1500),
  role: text(1000),
  architecture: text(2500),
  decisions: z.array(DecisionSchema).max(6),
  impact: text(1200),
  challenges: text(1500),
  nextTime: text(1000),
});

export const SkillEvidenceSchema = z.object({
  name: required(60),
  level: z.enum(SKILL_LEVELS),
  evidence: required(600),
});

export const FaqSchema = z.object({
  question: required(200),
  answer: required(1500),
});

export const ChatProfileSchema = z.object({
  pitch: text(1500),
  strengths: z.array(StrengthSchema).max(6),
  caseStudies: z.array(CaseStudySchema).max(20),
  skills: z.array(SkillEvidenceSchema).max(40),
  faqs: z.array(FaqSchema).max(30),
});

export const EMPTY_CHAT_PROFILE = Object.freeze({ pitch: "", strengths: [], caseStudies: [], skills: [], faqs: [] });

/** One question in the chat's test set, with the facts a good answer has to get across. */
export const EvalCaseSchema = z.object({
  id: required(40),
  question: required(300),
  audience: z.enum(["recruiter", "engineer", "browsing"]),
  mustInclude: z.array(required(200)).min(1).max(6),
});

export const EvalSetSchema = z.array(EvalCaseSchema).max(40);
