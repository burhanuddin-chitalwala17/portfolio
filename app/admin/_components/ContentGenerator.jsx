"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../ui/Button";
import { adminRequest } from "../_lib/adminRequest";
import { Field, Select, TextInput } from "../../ui/fields";
import Card from "../../ui/Card";
import Notice from "../../ui/Notice";

export default function ContentGenerator({ enabled, manualEditEnabled, resumeOptions }) {
  const router = useRouter();
  const [file, setFile] = useState(null);
  const [documentId, setDocumentId] = useState("");
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  const generate = async (event) => {
    event.preventDefault();
    if (!file && !documentId) {
      setError("Choose a resume file or one you've already uploaded.");
      return;
    }
    setBusy("generate");
    setError("");
    const formData = new FormData();
    if (file) formData.append("file", file);
    else formData.append("documentId", documentId);
    try {
      await adminRequest("/api/admin/content/generate", { body: formData });
      setFile(null);
      setDocumentId("");
      router.refresh();
    } catch (generateError) {
      setError(generateError.message || "Generating the draft failed. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  const startManualEdit = async () => {
    setBusy("manual");
    setError("");
    try {
      await adminRequest("/api/admin/content");
      router.refresh();
    } catch (manualError) {
      setError(manualError.message || "Couldn't start a draft. Please try again.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card
      headingLevel={2}
      title="Update the site"
      description="Upload a new resume and the AI drafts updated content for every section. Nothing changes on the site until you review the draft and publish it."
    >
      <form onSubmit={generate} className="flex flex-col gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="New resume (PDF or .docx)">
            <TextInput
              type="file"
              accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              disabled={!enabled || busy !== null}
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
                setDocumentId("");
              }}
              className="file:mr-3 file:rounded-full file:border-0 file:bg-fg/5 file:px-3 file:py-1 file:text-sm"
            />
          </Field>
          <Field label="…or one you've uploaded">
            <Select
              value={documentId}
              disabled={!enabled || busy !== null || !resumeOptions.length}
              onChange={(event) => {
                setDocumentId(event.target.value);
                setFile(null);
              }}
            >
              <option value="">{resumeOptions.length ? "Choose a document" : "No uploaded documents yet"}</option>
              {resumeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <p className="text-xs text-fg/50">
          A new resume is stored privately and kept out of the chat. The draft never includes your phone number,
          address or other personal details, and it&apos;s privacy-checked before you see it.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="lg"
            type="submit"
            disabled={!enabled || busy !== null}
          >
            {busy === "generate" ? "Reading the resume… (up to a minute)" : "Generate draft"}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={startManualEdit}
            disabled={!manualEditEnabled || busy !== null}
          >
            {busy === "manual" ? "Starting…" : "Edit by hand instead"}
          </Button>
        </div>
        {error && <Notice tone="danger">{error}</Notice>}
      </form>
    </Card>
  );
}
