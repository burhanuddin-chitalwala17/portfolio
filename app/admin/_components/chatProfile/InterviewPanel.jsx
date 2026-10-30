"use client";

import { useState } from "react";
import Button from "../../../ui/Button";
import StatusMessage from "../../../ui/StatusMessage";
import { TextArea } from "../../../ui/fields";
import { useAsyncAction } from "../../../ui/hooks/useAsyncAction";
import { adminRequest } from "../../_lib/adminRequest";

/**
 * The AI interview for one profile section: it asks questions based on what the chat already
 * knows, then writes the answers up as a draft that lands in the editor below (unsaved).
 * @param {{ topic: object, enabled: boolean, onDraft: (draft: object) => void, startLabel?: string }} props
 */
export default function InterviewPanel({ topic, enabled, onDraft, startLabel = "Interview me" }) {
  const [questions, setQuestions] = useState(null);
  const [answers, setAnswers] = useState([]);
  const { busy, message, run } = useAsyncAction();

  const start = () =>
    run("questions", async () => {
      const data = await adminRequest("/api/admin/chat/interview", { body: { topic } });
      setQuestions(data.questions);
      setAnswers(data.questions.map(() => ""));
    });

  const writeUp = () =>
    run("draft", async () => {
      const data = await adminRequest("/api/admin/chat/draft", {
        body: { topic, answers: questions.map((question, index) => ({ question, answer: answers[index] })) },
      });
      onDraft(data.draft);
      setQuestions(null);
      return "Draft added below. Review it, edit anything that's off, then save.";
    });

  if (!questions) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-dashed border-fg/20 p-4">
        <p className="text-sm text-fg/70">
          The AI reads everything the chat already knows and asks what&apos;s missing. Answer in your own words, as if
          talking to a colleague; it writes the answers up for you to review.
        </p>
        <Button variant="secondary" size="sm" onClick={start} disabled={!enabled || busy !== null}>
          {busy === "questions" ? "Preparing questions…" : startLabel}
        </Button>
        <StatusMessage message={message} className="text-xs" />
      </div>
    );
  }

  const answered = answers.filter((answer) => answer.trim()).length;
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-info/30 bg-info/[0.03] p-4">
      <p className="text-sm text-fg/70">Skip anything that doesn&apos;t apply. Specifics (numbers, decisions, what went wrong) help most.</p>
      {questions.map((question, index) => (
        <label key={question} className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-fg">
            {index + 1}. {question}
          </span>
          <TextArea
            rows={3}
            maxLength={4000}
            value={answers[index]}
            onChange={(event) => setAnswers((current) => current.map((value, i) => (i === index ? event.target.value : value)))}
          />
        </label>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={writeUp} disabled={busy !== null || !answered}>
          {busy === "draft" ? "Writing it up…" : `Write it up (${answered} answered)`}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setQuestions(null)} disabled={busy !== null}>
          Cancel
        </Button>
      </div>
      <StatusMessage message={message} className="text-xs" />
    </div>
  );
}
