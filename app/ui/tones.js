/*
 * Semantic tones shared by notices, badges and messages. Each maps to the design tokens in
 * app/globals.css, so the same component reads correctly in the dark site theme and .theme-light.
 */
export const TONE_TEXT = {
  neutral: "text-fg/70",
  muted: "text-fg/50",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
  info: "text-info",
};

export const TONE_SURFACE = {
  neutral: "border-fg/10 bg-fg/[0.03] text-fg/80",
  success: "border-success/20 bg-success/5 text-success",
  warning: "border-warning/20 bg-warning/5 text-warning",
  danger: "border-danger/20 bg-danger/5 text-danger",
  info: "border-info/20 bg-info/5 text-info",
};

export const TONE_PILL = {
  neutral: "bg-fg/5 text-fg/60",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
};
