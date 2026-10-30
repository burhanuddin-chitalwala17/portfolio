"use client";

import { useMemo, useState } from "react";
import Badge from "../../../ui/Badge";
import Button from "../../../ui/Button";
import Card from "../../../ui/Card";
import StatusMessage from "../../../ui/StatusMessage";
import { Select, TextArea, TextInput } from "../../../ui/fields";
import { useAsyncAction } from "../../../ui/hooks/useAsyncAction";
import { adminRequest } from "../../_lib/adminRequest";

const AUDIENCES = [
  { id: "recruiter", label: "Recruiter" },
  { id: "engineer", label: "Engineer" },
  { id: "browsing", label: "Just browsing" },
];

const dateFormatter = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" });

const scoreTone = (score) => (score >= 8 ? "success" : score >= 5 ? "warning" : "danger");

// mustInclude is edited as one point per line.
const toLines = (points) => points.join("\n");
const fromLines = (text) =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function Result({ result }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-fg/[0.03] p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={scoreTone(result.score)}>{result.score}/10</Badge>
        <span className="text-fg/80">{result.summary}</span>
      </div>
      <details>
        <summary className="cursor-pointer text-xs text-fg/60">Reply and grading details</summary>
        <div className="mt-2 flex flex-col gap-2 text-xs">
          <p className="whitespace-pre-wrap rounded-lg border border-fg/10 bg-surface p-3 text-sm text-fg/80">{result.reply || "(empty reply)"}</p>
          {result.missing.length > 0 && <p className="text-warning">Missing: {result.missing.join("; ")}</p>}
          {result.problems.length > 0 && <p className="text-danger">Problems: {result.problems.join("; ")}</p>}
          {result.covered.length > 0 && <p className="text-success">Covered: {result.covered.join("; ")}</p>}
          <p className="text-fg/50">
            {result.model}
            {result.toolsUsed.length > 0 && ` · used ${result.toolsUsed.join(", ")}`} · {dateFormatter.format(new Date(result.ranAt))}
          </p>
        </div>
      </details>
    </div>
  );
}

/**
 * Admin → Chat profile → test set: real questions with the points a good answer needs, run through
 * the same chat visitors use and graded, so changes to the profile, prompt or model can be compared.
 */
export default function ChatTests({ initialCases, initialResults, enabled }) {
  const [cases, setCases] = useState(initialCases);
  const [saved, setSaved] = useState(() => JSON.stringify(initialCases));
  const [results, setResults] = useState(initialResults);
  const [progress, setProgress] = useState(null);
  const dirty = useMemo(() => JSON.stringify(cases) !== saved, [cases, saved]);
  const { busy, message, setMessage, run } = useAsyncAction();

  const scored = cases.map((item) => results[item.id]).filter(Boolean);
  const average = scored.length ? (scored.reduce((sum, item) => sum + item.score, 0) / scored.length).toFixed(1) : null;

  const edit = (index, patch) => {
    setCases((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setMessage(null);
  };

  const save = () =>
    run("save", async () => {
      const cleaned = cases.map((item) => ({ ...item, mustInclude: fromLines(toLines(item.mustInclude)) }));
      const data = await adminRequest("/api/admin/chat/evals", { method: "PUT", body: { cases: cleaned } });
      setCases(data.cases);
      setSaved(JSON.stringify(data.cases));
      return "Tests saved.";
    });

  const suggest = () => {
    if (cases.length && !window.confirm("Replace your tests with suggested ones?")) return;
    run("suggest", async () => {
      setCases((await adminRequest("/api/admin/chat/evals/suggest")).cases);
      return "Suggested tests added. Check each expected point is right, then save.";
    });
  };

  const runTests = (ids) =>
    run("run", async () => {
      let failed = 0;
      for (const [position, id] of ids.entries()) {
        setProgress({ id, position: position + 1, total: ids.length });
        try {
          const { result } = await adminRequest("/api/admin/chat/evals/run", { body: { caseId: id } });
          setResults((current) => ({ ...current, [id]: result }));
        } catch (error) {
          failed += 1;
          if (ids.length === 1) throw error;
        }
      }
      setProgress(null);
      return failed ? `Done, but ${failed} test${failed === 1 ? "" : "s"} couldn't run.` : "Done.";
    }).finally(() => setProgress(null));

  return (
    <Card
      headingLevel={2}
      title="Test the chat"
      description="Questions with the points a good answer must get across. Each runs through the real chat (nothing reaches your inbox) and the drafts model grades the reply. Re-run after changing the profile or the model to see whether answers got better. Each run costs a little API usage."
      actions={
        <div className="flex shrink-0 flex-wrap gap-2 whitespace-nowrap">
          <Button variant="secondary" size="sm" onClick={suggest} disabled={!enabled || busy !== null}>
            {busy === "suggest" ? "Suggesting…" : "Suggest tests"}
          </Button>
          <Button size="sm" onClick={() => runTests(cases.map((item) => item.id))} disabled={!enabled || dirty || !cases.length || busy !== null}>
            {busy === "run" && progress ? `Running ${progress.position} of ${progress.total}…` : "Run all"}
          </Button>
        </div>
      }
    >
      {average && (
        <p className="text-sm text-fg/70">
          Average score <span className="font-semibold text-fg">{average}/10</span> across {scored.length} of {cases.length} tests.
        </p>
      )}
      {cases.length === 0 && <p className="text-sm text-fg/50">No tests yet. Suggest some from what the chat knows, or add your own.</p>}
      <ol className="flex flex-col gap-4">
        {cases.map((item, index) => (
          <li key={item.id} className="flex flex-col gap-2 rounded-xl border border-fg/10 p-3">
            <div className="grid gap-2 sm:grid-cols-[1fr_10rem]">
              <TextInput aria-label="Question" placeholder="A question a visitor would ask" maxLength={300} value={item.question} onChange={(event) => edit(index, { question: event.target.value })} />
              <Select aria-label="Audience" value={item.audience} onChange={(event) => edit(index, { audience: event.target.value })}>
                {AUDIENCES.map((audience) => (
                  <option key={audience.id} value={audience.id}>
                    {audience.label}
                  </option>
                ))}
              </Select>
            </div>
            <TextArea
              aria-label="Points a good answer must include, one per line"
              placeholder="Points a good answer must include, one per line"
              rows={Math.max(2, item.mustInclude.length)}
              value={toLines(item.mustInclude)}
              onChange={(event) => edit(index, { mustInclude: event.target.value.split("\n") })}
              onBlur={(event) => edit(index, { mustInclude: fromLines(event.target.value) })}
            />
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={() => runTests([item.id])} disabled={!enabled || dirty || busy !== null}>
                {progress?.id === item.id ? "Running…" : "Run"}
              </Button>
              <Button variant="danger" size="sm" onClick={() => setCases((current) => current.filter((_, i) => i !== index))} disabled={busy !== null}>
                Remove
              </Button>
            </div>
            {results[item.id] && <Result result={results[item.id]} />}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() =>
            setCases((current) => [...current, { id: `test-${Date.now().toString(36)}`, question: "", audience: "recruiter", mustInclude: [] }])
          }
          disabled={cases.length >= 40}
        >
          Add a test
        </Button>
        <Button size="sm" onClick={save} disabled={!enabled || !dirty || busy !== null}>
          {busy === "save" ? "Saving…" : "Save tests"}
        </Button>
        {dirty && <span className="text-sm text-warning">Save before running</span>}
        <StatusMessage message={message} />
      </div>
    </Card>
  );
}
