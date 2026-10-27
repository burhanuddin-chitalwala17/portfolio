const DOCUMENT_TYPES = Object.freeze({
  PDF: "pdf",
  WORD: "word",
  IMAGE: "image",
  TEXT: "text",
});

// Files that ship with the site in /public. Uploads will join this list once storage is connected.
const bundledDocuments = [
  {
    id: "resume",
    name: "Resume",
    type: DOCUMENT_TYPES.PDF,
    sizeInBytes: 6_912,
    updatedAt: "2026-10-27T00:00:00.000Z",
    url: "/docs/resume.pdf",
  },
];

/**
 * Fetches the latest document metadata for the admin dashboard.
 * Replace with a real data source (database, S3, etc.) once the backend is wired.
 */
export async function getDocuments() {
  return bundledDocuments;
}

export { DOCUMENT_TYPES };

