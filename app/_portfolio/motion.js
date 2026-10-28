/*
 * Motion constants shared by server and client components. Kept out of "use client" modules so
 * Server Components can import real values. EASE matches the --ease-out token in globals.css.
 */
export const EASE = [0.22, 1, 0.36, 1];

/** Inline style for a CSS entrance animation delay, in seconds. */
export const delay = (seconds) => ({ animationDelay: `${seconds}s` });
