import "server-only";

/**
 * Pulls plain text out of an uploaded file so the chat can read it.
 * Returns null for files with no readable text (images, old .doc files).
 */
export async function extractText(buffer, contentType) {
  if (contentType === "application/pdf") {
    const { extractText: extractPdfText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractPdfText(pdf, { mergePages: true });
    return normalize(text);
  }
  if (contentType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return normalize(value);
  }
  if (contentType === "text/plain" || contentType === "text/markdown") {
    return normalize(buffer.toString("utf8"));
  }
  return null;
}

function normalize(text) {
  const cleaned = (text ?? "").replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return cleaned || null;
}
