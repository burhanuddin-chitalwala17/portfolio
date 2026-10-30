"use client";

import { useEffect, useMemo, useState } from "react";
import Badge from "../../../ui/Badge";
import Button from "../../../ui/Button";
import Card from "../../../ui/Card";
import StatusMessage from "../../../ui/StatusMessage";
import { Field, Select, TextArea, TextInput } from "../../../ui/fields";
import { useAsyncAction } from "../../../ui/hooks/useAsyncAction";
import { adminRequest } from "../../_lib/adminRequest";
import InterviewPanel from "./InterviewPanel";

const SKILL_LEVELS = [
  { id: "expert", label: "Expert" },
  { id: "strong", label: "Strong" },
  { id: "working", label: "Working" },
];

const EMPTY_CASE_STUDY = { title: "", problem: "", role: "", architecture: "", decisions: [], impact: "", challenges: "", nextTime: "" };

const replaceAt = (list, index, value) => list.map((item, i) => (i === index ? value : item));
const removeAt = (list, index) => list.filter((_, i) => i !== index);

/** A labelled list of editable items with add and remove. */
function ListEditor({ items, onChange, empty, addLabel, renderItem, max }) {
  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && <p className="text-sm text-fg/50">{empty}</p>}
      {items.map((item, index) => (
        <div key={index} className="flex flex-col gap-2 rounded-xl border border-fg/10 p-3">
          {renderItem(item, (value) => onChange(replaceAt(items, index, value)))}
          <Button variant="danger" size="sm" onClick={() => onChange(removeAt(items, index))}>
            Remove
          </Button>
        </div>
      ))}
      {items.length < max && (
        <Button variant="secondary" size="sm" onClick={() => onChange([...items, null])}>
          {addLabel}
        </Button>
      )}
    </div>
  );
}

function PitchSection({ profile, update, aiEnabled }) {
  return (
    <Card
      headingLevel={2}
      title="Pitch and strengths"
      description="How you'd introduce yourself, and the few things that genuinely set you apart, each with proof. The chat leads with these."
    >
      <InterviewPanel
        topic={{ kind: "pitch" }}
        enabled={aiEnabled}
        onDraft={(draft) => update({ pitch: draft.pitch, strengths: draft.strengths })}
      />
      <Field label="Pitch" hint="About 60–100 words, in your voice.">
        <TextArea rows={4} maxLength={1500} value={profile.pitch} onChange={(event) => update({ pitch: event.target.value })} />
      </Field>
      <ListEditor
        items={profile.strengths}
        max={6}
        empty="No strengths yet."
        addLabel="Add a strength"
        onChange={(strengths) => update({ strengths: strengths.map((item) => item ?? { title: "", evidence: "" }) })}
        renderItem={(strength, set) => (
          <>
            <TextInput aria-label="Strength" placeholder="Strength" maxLength={100} value={strength.title} onChange={(event) => set({ ...strength, title: event.target.value })} />
            <TextArea aria-label="Evidence" placeholder="The evidence: a project, decision or result that proves it" rows={2} maxLength={800} value={strength.evidence} onChange={(event) => set({ ...strength, evidence: event.target.value })} />
          </>
        )}
      />
    </Card>
  );
}

function CaseStudyFields({ study, set }) {
  const text = (key, label, rows, max, hint) => (
    <Field label={label} hint={hint}>
      <TextArea rows={rows} maxLength={max} value={study[key]} onChange={(event) => set({ ...study, [key]: event.target.value })} />
    </Field>
  );
  return (
    <div className="flex flex-col gap-3">
      <Field label="Title">
        <TextInput maxLength={100} value={study.title} onChange={(event) => set({ ...study, title: event.target.value })} />
      </Field>
      {text("problem", "Problem", 3, 1500, "What problem it solved, and for whom.")}
      {text("role", "My role", 3, 1000, "What you personally owned.")}
      {text("architecture", "How it's built", 5, 2500)}
      <div className="flex flex-col gap-2">
        <p className="text-sm text-fg/80">Key decisions</p>
        <ListEditor
          items={study.decisions}
          max={6}
          empty="No decisions yet."
          addLabel="Add a decision"
          onChange={(decisions) => set({ ...study, decisions: decisions.map((item) => item ?? { decision: "", why: "" }) })}
          renderItem={(item, setItem) => (
            <>
              <TextInput aria-label="Decision" placeholder="The decision" maxLength={200} value={item.decision} onChange={(event) => setItem({ ...item, decision: event.target.value })} />
              <TextArea aria-label="Why" placeholder="Why, and what you weighed it against" rows={2} maxLength={800} value={item.why} onChange={(event) => setItem({ ...item, why: event.target.value })} />
            </>
          )}
        />
      </div>
      {text("impact", "Impact", 3, 1200, "Only real, measurable outcomes.")}
      {text("challenges", "Hardest parts", 3, 1500)}
      {text("nextTime", "What I'd do differently", 2, 1000)}
    </div>
  );
}

function CaseStudiesSection({ profile, update, projects, aiEnabled }) {
  const [openId, setOpenId] = useState(null);
  const indexOf = (projectId) => profile.caseStudies.findIndex((study) => study.projectId === projectId);

  const setStudy = (projectId, study) => {
    const index = indexOf(projectId);
    update({
      caseStudies: index === -1 ? [...profile.caseStudies, study] : replaceAt(profile.caseStudies, index, study),
    });
  };

  return (
    <Card
      headingLevel={2}
      title="Project case studies"
      description="The story behind each project: the problem, what you owned, how it's built, the decisions and the impact. This is what lets the chat answer project questions with substance."
    >
      <ul className="flex flex-col divide-y divide-fg/10 rounded-xl border border-fg/10">
        {projects.map((project) => {
          const index = indexOf(project.id);
          const study = index === -1 ? null : profile.caseStudies[index];
          const open = openId === project.id;
          return (
            <li key={project.id} className="flex flex-col gap-4 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-fg">{project.title}</p>
                  <p className="text-xs text-fg/50">{project.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={study ? "success" : "neutral"}>{study ? "Written" : "Not yet"}</Badge>
                  <Button variant="secondary" size="sm" onClick={() => setOpenId(open ? null : project.id)} aria-expanded={open}>
                    {open ? "Close" : study ? "Edit" : "Write"}
                  </Button>
                </div>
              </div>
              {open && (
                <div className="flex flex-col gap-4">
                  <InterviewPanel
                    topic={{ kind: "project", projectId: project.id }}
                    enabled={aiEnabled}
                    startLabel={study ? "Interview me again" : "Interview me"}
                    onDraft={(draft) => setStudy(project.id, draft)}
                  />
                  <CaseStudyFields
                    study={study ?? { ...EMPTY_CASE_STUDY, projectId: project.id, title: project.title }}
                    set={(value) => setStudy(project.id, value)}
                  />
                  {study && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        update({ caseStudies: removeAt(profile.caseStudies, index) });
                        setOpenId(null);
                      }}
                    >
                      Delete this case study
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** A section the AI can draft in one go (no interview), replacing what's there after a confirm. */
function DraftButton({ topic, label, hasItems, onDraft, aiEnabled }) {
  const { busy, message, run } = useAsyncAction();
  const draft = () => {
    if (hasItems && !window.confirm("Replace this section with a fresh draft? Unsaved edits here will be lost.")) return;
    run("draft", async () => {
      onDraft((await adminRequest("/api/admin/chat/draft", { body: { topic } })).draft);
      return "Draft added. Review and edit it, then save.";
    });
  };
  return (
    <div className="flex flex-col gap-1">
      <Button variant="secondary" size="sm" onClick={draft} disabled={!aiEnabled || busy !== null}>
        {busy ? "Drafting…" : label}
      </Button>
      <StatusMessage message={message} className="text-xs" />
    </div>
  );
}

function SkillsSection({ profile, update, aiEnabled }) {
  return (
    <Card
      headingLevel={2}
      title="Skills with evidence"
      description="Each skill with how deep it goes and where you used it, so the chat can back up “does he know X?” with proof instead of a list."
      actions={
        <DraftButton
          topic={{ kind: "skills" }}
          label="Draft from what the chat knows"
          hasItems={profile.skills.length > 0}
          aiEnabled={aiEnabled}
          onDraft={(draft) => update({ skills: draft.skills })}
        />
      }
    >
      <ListEditor
        items={profile.skills}
        max={40}
        empty="No skills yet. Draft them, then adjust the levels honestly."
        addLabel="Add a skill"
        onChange={(skills) => update({ skills: skills.map((item) => item ?? { name: "", level: "strong", evidence: "" }) })}
        renderItem={(skill, set) => (
          <>
            <div className="grid gap-2 sm:grid-cols-[1fr_10rem]">
              <TextInput aria-label="Skill" placeholder="Skill" maxLength={60} value={skill.name} onChange={(event) => set({ ...skill, name: event.target.value })} />
              <Select aria-label="Level" value={skill.level} onChange={(event) => set({ ...skill, level: event.target.value })}>
                {SKILL_LEVELS.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.label}
                  </option>
                ))}
              </Select>
            </div>
            <TextArea aria-label="Evidence" placeholder="Where and how you used it" rows={2} maxLength={600} value={skill.evidence} onChange={(event) => set({ ...skill, evidence: event.target.value })} />
          </>
        )}
      />
    </Card>
  );
}

function FaqSection({ profile, update, aiEnabled }) {
  return (
    <Card
      headingLevel={2}
      title="Answers to common questions"
      description="Your own answers to what visitors ask most. The chat treats these as your position and adapts them to each question."
      actions={
        <DraftButton
          topic={{ kind: "faqs" }}
          label="Suggest questions and answers"
          hasItems={profile.faqs.length > 0}
          aiEnabled={aiEnabled}
          onDraft={(draft) => update({ faqs: draft.faqs })}
        />
      }
    >
      <ListEditor
        items={profile.faqs}
        max={30}
        empty="No answers yet."
        addLabel="Add a question"
        onChange={(faqs) => update({ faqs: faqs.map((item) => item ?? { question: "", answer: "" }) })}
        renderItem={(faq, set) => (
          <>
            <TextInput aria-label="Question" placeholder="Question" maxLength={200} value={faq.question} onChange={(event) => set({ ...faq, question: event.target.value })} />
            <TextArea aria-label="Answer" placeholder="Your answer" rows={3} maxLength={1500} value={faq.answer} onChange={(event) => set({ ...faq, answer: event.target.value })} />
          </>
        )}
      />
    </Card>
  );
}

/**
 * Admin → Chat profile: everything the chat knows about you beyond the site's bullets. Edits stay
 * local until saved; saving makes them live in the chat straight away.
 * @param {{ initialProfile: object, projects: {id, title, subtitle}[], enabled: boolean, aiEnabled: boolean }} props
 */
export default function ChatProfileEditor({ initialProfile, projects, enabled, aiEnabled }) {
  const [profile, setProfile] = useState(initialProfile);
  const [saved, setSaved] = useState(() => JSON.stringify(initialProfile));
  const dirty = useMemo(() => JSON.stringify(profile) !== saved, [profile, saved]);
  const { busy, message, setMessage, run } = useAsyncAction();
  const update = (patch) => {
    setProfile((current) => ({ ...current, ...patch }));
    setMessage(null);
  };

  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (event) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    run("save", async () => {
      const data = await adminRequest("/api/admin/chat/profile", { method: "PUT", body: profile });
      setProfile(data.profile);
      setSaved(JSON.stringify(data.profile));
      return "Saved. The chat uses it from the next message.";
    });

  const sections = { profile, update, aiEnabled: enabled && aiEnabled };
  return (
    <div className="flex flex-col gap-6">
      <PitchSection {...sections} />
      <CaseStudiesSection {...sections} projects={projects} />
      <SkillsSection {...sections} />
      <FaqSection {...sections} />
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl border border-fg/10 bg-surface/95 px-5 py-3 shadow-lg backdrop-blur">
        <Button size="lg" onClick={save} disabled={!enabled || !dirty || busy !== null}>
          {busy === "save" ? "Saving…" : "Save profile"}
        </Button>
        {dirty ? <span className="text-sm text-warning">Unsaved changes</span> : !message && <span className="text-sm text-fg/50">All changes saved</span>}
        <StatusMessage message={message} />
      </div>
    </div>
  );
}
