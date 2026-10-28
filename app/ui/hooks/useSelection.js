"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * A set of selected ids with helpers for lists that can be filtered: `stateOf(ids)` tells whether
 * none, some or all of the visible items are selected, and `setAll(ids, on)` selects or clears
 * exactly those, leaving selections outside the current filter alone.
 * @param {Iterable<string>} initial
 */
export function useSelection(initial = []) {
  const [selected, setSelected] = useState(() => new Set(initial));

  const toggle = useCallback((id) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setAll = useCallback((ids, on) => {
    setSelected((current) => {
      const next = new Set(current);
      ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
      return next;
    });
  }, []);

  const stateOf = useCallback(
    (ids) => {
      const count = ids.filter((id) => selected.has(id)).length;
      return count === 0 ? "none" : count === ids.length ? "all" : "some";
    },
    [selected]
  );

  const list = useMemo(() => [...selected], [selected]);

  return { selected, list, toggle, setAll, stateOf };
}
