import { strFromU8, unzipSync } from "fflate";

/*
 * Turns LinkedIn's "Download your data" export into a plain-text profile for the chat. It runs in
 * the browser, so the export never leaves the admin's device: only the whitelisted public-profile
 * sections and columns below make it into the text, and everything else (messages, connections,
 * contact details, invitations, ads data…) is dropped before anything is uploaded.
 */

const clean = (value) => (value ?? "").replace(/\s+/g, " ").trim();
const join = (separator, ...values) => values.map(clean).filter(Boolean).join(separator);
const period = (from, to) => join(" – ", from, to || (from ? "present" : ""));
const titled = (title, detail, description) =>
  [`- ${join(", ", title, detail)}`, clean(description) && `  ${clean(description)}`].filter(Boolean).join("\n");

/**
 * Section → its file in the export, the columns read from it (everything else is ignored), and
 * how one row is written. A row that formats to an empty string is left out.
 */
const SECTIONS = [
  {
    title: "Profile",
    file: "profile",
    columns: ["Headline", "Summary", "Industry", "Geo Location", "Websites"],
    format: (row) =>
      [
        ["Headline", row.Headline],
        ["Summary", row.Summary],
        ["Industry", row.Industry],
        ["Location", row["Geo Location"]],
        ["Websites", row.Websites],
      ]
        .filter(([, value]) => clean(value))
        .map(([label, value]) => `${label}: ${clean(value)}`)
        .join("\n"),
  },
  {
    title: "Experience",
    file: "positions",
    columns: ["Title", "Company Name", "Location", "Started On", "Finished On", "Description"],
    format: (row) =>
      titled(join(" at ", row.Title, row["Company Name"]), join(", ", row.Location, period(row["Started On"], row["Finished On"])), row.Description),
  },
  {
    title: "Education",
    file: "education",
    columns: ["Degree Name", "School Name", "Start Date", "End Date", "Notes", "Activities"],
    format: (row) =>
      titled(join(", ", row["Degree Name"], row["School Name"]), period(row["Start Date"], row["End Date"]), join(" ", row.Notes, row.Activities)),
  },
  { title: "Skills", file: "skills", columns: ["Name"], format: (row) => clean(row.Name), inline: true },
  {
    title: "Certifications",
    file: "certifications",
    columns: ["Name", "Authority", "Started On", "Finished On", "Url"],
    format: (row) => titled(row.Name, join(", ", row.Authority, row["Started On"], row.Url)),
  },
  {
    title: "Projects",
    file: "projects",
    columns: ["Title", "Started On", "Finished On", "Url", "Description"],
    format: (row) => titled(row.Title, join(", ", period(row["Started On"], row["Finished On"]), row.Url), row.Description),
  },
  {
    title: "Honors and awards",
    file: "honors",
    columns: ["Title", "Issued On", "Description"],
    format: (row) => titled(row.Title, row["Issued On"], row.Description),
  },
  {
    title: "Publications",
    file: "publications",
    columns: ["Name", "Publisher", "Published On", "Url", "Description"],
    format: (row) => titled(row.Name, join(", ", row.Publisher, row["Published On"], row.Url), row.Description),
  },
  {
    title: "Volunteering",
    file: "volunteering",
    columns: ["Role", "Company Name", "Cause", "Started On", "Finished On", "Description"],
    format: (row) =>
      titled(join(" at ", row.Role, row["Company Name"]), join(", ", row.Cause, period(row["Started On"], row["Finished On"])), row.Description),
  },
  { title: "Courses", file: "courses", columns: ["Name"], format: (row) => clean(row.Name), inline: true },
  {
    title: "Languages",
    file: "languages",
    columns: ["Name", "Proficiency"],
    format: (row) => join(" (", row.Name, row.Proficiency) + (clean(row.Proficiency) ? ")" : ""),
    inline: true,
  },
  {
    title: "Recommendations received",
    file: "recommendations_received",
    columns: ["First Name", "Last Name", "Job Title", "Company", "Text", "Status"],
    // Only recommendations shown publicly on the profile.
    format: (row) =>
      clean(row.Status) && clean(row.Status).toUpperCase() !== "VISIBLE"
        ? ""
        : `- ${join(" ", row["First Name"], row["Last Name"])} (${join(", ", row["Job Title"], row.Company)}): ${clean(row.Text)}`,
  },
];

/** RFC 4180 CSV: quoted fields, "" escapes and line breaks inside quotes. */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field || row.length) rows.push([...row, field]);
  return rows.filter((cells) => cells.some((cell) => cell.trim()));
}

/**
 * Rows as objects with only the wanted columns. The header is the first row naming one of them,
 * which skips the "Notes:" preamble some export files start with.
 */
function toRecords(text, columns) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  const headerIndex = rows.findIndex((cells) => cells.some((cell) => columns.includes(cell.trim())));
  if (headerIndex === -1) return [];
  const header = rows[headerIndex].map((cell) => cell.trim());
  return rows.slice(headerIndex + 1).map((cells) =>
    Object.fromEntries(columns.map((column) => [column, cells[header.indexOf(column)] ?? ""]))
  );
}

const baseName = (path) => path.split("/").pop().replace(/\.csv$/i, "").toLowerCase();

/**
 * Builds the profile text from export files.
 * @param {{name: string, text: string}[]} files CSV files from the export
 * @returns {{text: string, included: {title: string, count: number}[], skipped: string[]}}
 */
export function buildLinkedinProfile(files) {
  const byName = new Map(files.map((file) => [baseName(file.name), file]));
  const included = [];
  const parts = [`LinkedIn profile (imported ${new Date().toISOString().slice(0, 10)})`];
  for (const section of SECTIONS) {
    const file = byName.get(section.file);
    if (!file) continue;
    const entries = toRecords(file.text, section.columns).map(section.format).filter(Boolean);
    if (!entries.length) continue;
    included.push({ title: section.title, count: entries.length });
    parts.push(`\n${section.title}\n${section.inline ? entries.join(", ") : entries.join("\n")}`);
  }
  const used = new Set(SECTIONS.map((section) => section.file));
  const skipped = files.map((file) => file.name).filter((name) => !used.has(baseName(name)));
  return { text: parts.join("\n"), included, skipped };
}

/** Reads the export ZIP and/or individual CSV files the admin picked. */
export async function readExportFiles(fileList) {
  const files = [];
  for (const file of fileList) {
    if (/\.zip$/i.test(file.name)) {
      const entries = unzipSync(new Uint8Array(await file.arrayBuffer()), {
        // Only CSVs are needed; skip everything else without decompressing it.
        filter: (entry) => /\.csv$/i.test(entry.name),
      });
      for (const [name, data] of Object.entries(entries)) files.push({ name, text: strFromU8(data) });
    } else if (/\.csv$/i.test(file.name)) {
      files.push({ name: file.name, text: await file.text() });
    }
  }
  return files;
}
