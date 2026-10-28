"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { adminRequest } from "../_lib/adminRequest";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

/**
 * The scan → review → upload flow shared by file uploads, pasted notes and imports. Every file is
 * checked for sensitive data before it's stored, and risky files stay out of the chat unless the
 * admin confirms. Render the review step with <UploadReview> and results with <UploadMessages>.
 * Stages: idle → checking → review → uploading → idle.
 */
export function useDocumentUpload() {
  const router = useRouter();
  const [stage, setStage] = useState("idle");
  const [review, setReview] = useState([]);
  const [messages, setMessages] = useState({ tone: "success", items: [] });

  const reset = useCallback(() => {
    setReview([]);
    setStage("idle");
  }, []);

  const checkFiles = useCallback(async (files) => {
    const tooLarge = files.filter((file) => file.size > MAX_UPLOAD_BYTES);
    const candidates = files.filter((file) => file.size <= MAX_UPLOAD_BYTES);
    const sizeErrors = tooLarge.map((file) => `${file.name}: files must be 4 MB or smaller.`);
    setMessages({ tone: "error", items: sizeErrors });
    if (!candidates.length) return;

    setStage("checking");
    const formData = new FormData();
    candidates.forEach((file) => formData.append("files", file));
    try {
      const data = await adminRequest("/api/admin/documents/scan", { body: formData });
      setReview(
        candidates.map((file, index) => {
          const result = data.results[index];
          const risky = result.findings.length > 0;
          return { file, ...result, useInChat: result.ok && result.hasText && !risky, acknowledgedRisks: false };
        })
      );
      setStage("review");
    } catch (error) {
      setMessages({ tone: "error", items: [...sizeErrors, error.message || "Couldn't check the files. Try again."] });
      setStage("idle");
    }
  }, []);

  const updateItem = (index, changes) => {
    setReview((items) => items.map((item, i) => (i === index ? { ...item, ...changes } : item)));
  };

  /**
   * Uploads the reviewed files. `successMessage(count)` describes a success.
   * @returns {Promise<number>} how many were saved
   */
  const upload = async ({ successMessage = (count) => `Uploaded ${count} file${count === 1 ? "" : "s"}.` } = {}) => {
    const items = review.filter((item) => item.ok);
    if (!items.length) {
      reset();
      return 0;
    }
    setStage("uploading");
    const formData = new FormData();
    items.forEach((item) => formData.append("files", item.file));
    formData.append(
      "options",
      JSON.stringify(items.map((item) => ({ useInChat: item.useInChat, acknowledgedRisks: item.acknowledgedRisks })))
    );
    try {
      // Raw fetch on purpose: a partial success comes back as an error status that still lists what
      // was uploaded, which adminRequest would turn into a plain error.
      const response = await fetch("/api/admin/documents", { method: "POST", body: formData });
      const data = await response.json().catch(() => ({}));
      const errors = [...(data.errors ?? []), ...(data.error ? [data.error] : [])];
      const uploadedCount = data.uploaded?.length ?? 0;
      if (uploadedCount) router.refresh();
      setMessages({
        tone: errors.length ? "error" : "success",
        items: uploadedCount
          ? [successMessage(uploadedCount), ...errors]
          : errors.length
            ? errors
            : ["Upload failed. Please try again."],
      });
      reset();
      return uploadedCount;
    } catch {
      setMessages({ tone: "error", items: ["Network error. Check your connection and try again."] });
      setStage("review");
      return 0;
    }
  };

  const blocked = review.some((item) => item.ok && item.useInChat && item.findings.length && !item.acknowledgedRisks);

  return { stage, review, messages, setMessages, checkFiles, updateItem, upload, reset, blocked };
}
