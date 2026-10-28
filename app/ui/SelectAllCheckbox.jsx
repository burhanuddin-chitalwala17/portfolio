"use client";

import { useEffect, useRef } from "react";
import { Checkbox } from "./fields";

/**
 * A "select all" checkbox that shows the mixed state when only some items are selected.
 * @param {{ state: "none" | "some" | "all", onChange: (selectAll: boolean) => void, label: string }} props
 */
export default function SelectAllCheckbox({ state, onChange, label, disabled }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "some";
  }, [state]);
  return (
    <Checkbox
      ref={ref}
      label={label}
      checked={state === "all"}
      onChange={() => onChange(state !== "all")}
      disabled={disabled}
      aria-checked={state === "some" ? "mixed" : state === "all"}
    />
  );
}
