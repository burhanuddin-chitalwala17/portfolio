"use client";

import { useRef, useState } from "react";
import Button from "../../ui/Button";
import Card from "../../ui/Card";
import { TextArea } from "../../ui/fields";
import UploadMessages from "./UploadMessages";
import UploadReview from "./UploadReview";
import { useDocumentUpload } from "./useDocumentUpload";
import { buildLinkedinProfile, readExportFiles } from "../_lib/linkedinExport";

const EXPORT_URL = "https://www.linkedin.com/mypreferences/d/download-my-data";

export default function LinkedinImport({ enabled, profileUrl }) {
  const inputRef = useRef(null);
  const { stage, review, messages, setMessages, checkFiles, updateItem, upload, reset, blocked } = useDocumentUpload();
  const [imported, setImported] = useState(null);
  const [reading, setReading] = useState(false);

  const readExport = async (fileList) => {
    const picked = Array.from(fileList ?? []);
    if (!picked.length) return;
    setReading(true);
    setMessages({ tone: "success", items: [] });
    try {
      const result = buildLinkedinProfile(await readExportFiles(picked));
      if (!result.included.length) {
        setImported(null);
        setMessages({ tone: "error", items: ["No profile sections found. Pick the export ZIP, or files like Profile.csv and Positions.csv."] });
      } else {
        setImported(result);
      }
    } catch (error) {
      console.error("Reading the LinkedIn export failed:", error);
      setMessages({ tone: "error", items: ["Couldn't read that file. Pick the ZIP LinkedIn sent, or its CSV files."] });
    } finally {
      setReading(false);
    }
  };

  const check = () => {
    if (!imported?.text.trim()) return;
    checkFiles([new File([imported.text.trim()], "LinkedIn profile.txt", { type: "text/plain" })]);
  };

  const save = async () => {
    const saved = await upload({ successMessage: () => "Saved as “LinkedIn profile.txt” in Documents." });
    if (saved) setImported(null);
  };

  return (
    <Card
      title="LinkedIn"
      description={
        <>
          <p>
            LinkedIn doesn&apos;t let apps read profiles, so import your own data export instead. It&apos;s read here in your
            browser: only your public profile sections (headline, about, experience, education, skills, certifications,
            projects, public recommendations) are kept, and messages, connections and contact details never leave your
            device. Re-import whenever your profile changes.
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-fg/60">
            <li>
              On LinkedIn, open{" "}
              <a href={EXPORT_URL} target="_blank" rel="noreferrer" className="text-info underline">
                Get a copy of your data
              </a>
              , choose the larger archive or pick Profile, Positions, Education, Skills, Recommendations and Certifications,
              and request it.
            </li>
            <li>When LinkedIn emails you (usually within minutes), download the ZIP and choose it below.</li>
          </ol>
          {profileUrl && (
            <p className="mt-2 text-xs text-fg/50">
              Quicker alternative: on{" "}
              <a href={profileUrl} target="_blank" rel="noreferrer" className="underline">
                your profile
              </a>{" "}
              use More → Save to PDF and upload that PDF in Documents.
            </p>
          )}
        </>
      }
    >
      {stage === "review" || stage === "uploading" ? (
        <UploadReview
          stage={stage}
          review={review}
          updateItem={updateItem}
          blocked={blocked}
          onSave={save}
          onCancel={reset}
          saveLabel="Save"
        />
      ) : imported ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-fg/80">
            Found {imported.included.map((section) => `${section.title.toLowerCase()} (${section.count})`).join(", ")}.
            {imported.skipped.length > 0 && ` Left out ${imported.skipped.length} other files.`} Edit anything you
            don&apos;t want the chat to know before saving.
          </p>
          <TextArea
            value={imported.text}
            onChange={(event) => setImported((current) => ({ ...current, text: event.target.value }))}
            rows={12}
            aria-label="Imported LinkedIn profile"
            className="min-h-[240px] font-mono"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="lg" onClick={check} disabled={stage === "checking" || !imported.text.trim()}>
              {stage === "checking" ? "Checking for sensitive data…" : "Check and save"}
            </Button>
            <Button variant="secondary" size="lg" onClick={() => setImported(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button variant="secondary" onClick={() => inputRef.current?.click()} disabled={!enabled || reading}>
            {reading ? "Reading…" : "Choose the LinkedIn export (ZIP or CSV files)"}
          </Button>
          {!enabled && <p className="mt-2 text-xs text-fg/50">Importing switches on once storage is connected.</p>}
          <input
            ref={inputRef}
            type="file"
            accept=".zip,.csv"
            multiple
            className="hidden"
            onChange={(event) => {
              readExport(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      )}

      <UploadMessages messages={messages} />
    </Card>
  );
}
