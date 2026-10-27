/**
 * A readable list of differences between two versions of the site content, for review
 * before publishing. Array items are matched by a natural key (id, company, name…) so a
 * reordered or inserted item shows as one change instead of shifting everything after it.
 */

const SECTION_LABELS = {
  profile: "Profile",
  education: "Education",
  experience: "Experience",
  projects: "Projects",
  impactNumbers: "Impact numbers",
  skillGroups: "Skills",
  introSlides: "Quick intro",
};

const IGNORED_KEYS = new Set(["art", "portrait"]);

function itemKey(item, index) {
  if (item && typeof item === "object") {
    const key = item.id ?? item.company ?? item.name ?? item.title ?? item.label ?? item.eyebrow;
    if (key !== undefined) return String(key);
  }
  return `#${index + 1}`;
}

function flatten(value, path, out) {
  if (Array.isArray(value)) {
    if (value.every((item) => typeof item !== "object")) {
      out.set(path.join(" › "), value.join(", "));
      return out;
    }
    value.forEach((item, index) => flatten(item, [...path, itemKey(item, index)], out));
    return out;
  }
  if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (!IGNORED_KEYS.has(key)) flatten(child, [...path, key], out);
    }
    return out;
  }
  out.set(path.join(" › "), value === undefined || value === null ? "" : String(value));
  return out;
}

function describeItem(item) {
  return item.title ?? item.role ?? item.name ?? item.label ?? item.value ?? itemKey(item, 0);
}

function compareFields(section, old, next, prefix, changes) {
  for (const path of new Set([...old.keys(), ...next.keys()])) {
    const was = old.get(path);
    const now = next.get(path);
    if (was === now) continue;
    changes.push({
      section,
      path: [prefix, path].filter(Boolean).join(" › "),
      before: was ?? null,
      after: now ?? null,
      kind: was === undefined ? "added" : now === undefined ? "removed" : "changed",
    });
  }
}

export function diffContent(before, after) {
  const changes = [];
  for (const [section, label] of Object.entries(SECTION_LABELS)) {
    const old = before?.[section];
    const next = after?.[section];
    if (!Array.isArray(old) || !Array.isArray(next)) {
      compareFields(label, flatten(old, [], new Map()), flatten(next, [], new Map()), "", changes);
      continue;
    }
    // Whole items added or removed are reported once; items on both sides are compared field by field.
    const oldItems = new Map(old.map((item, index) => [itemKey(item, index), item]));
    const nextItems = new Map(next.map((item, index) => [itemKey(item, index), item]));
    for (const [key, item] of oldItems) {
      if (!nextItems.has(key)) changes.push({ section: label, path: key, before: describeItem(item), after: null, kind: "removed" });
    }
    for (const [key, item] of nextItems) {
      if (!oldItems.has(key)) {
        changes.push({ section: label, path: key, before: null, after: describeItem(item), kind: "added" });
      } else {
        compareFields(label, flatten(oldItems.get(key), [], new Map()), flatten(item, [], new Map()), key, changes);
      }
    }
  }
  return changes;
}
