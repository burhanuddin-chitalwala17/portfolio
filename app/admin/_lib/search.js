/**
 * Filters items by a free-text query: every word must appear in at least one of the item's fields.
 * @template T
 * @param {T[]} items
 * @param {string} query
 * @param {(item: T) => Array<string | null | undefined>} fields what to search in each item
 * @returns {T[]}
 */
export function filterByQuery(items, query, fields) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return items;
  return items.filter((item) => {
    const haystack = fields(item).filter(Boolean).join(" ").toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
