/**
 * Pure Fibonacci-backoff logic for the static error pages
 * (app/public/errors/{500,502}.html, driven by app/public/errors/countdown.js).
 *
 * Kept here, as a tested TS module, because app/public/**Iles are static
 * assets copied verbatim into the nginx image — they're never run through
 * Vite/tsc, so nothing under public/ can be unit-tested directly. countdown.js
 * duplicates this exact function inline (it's ~5 lines) since a public/ file
 * can't import from src/. If this logic ever changes, update both places.
 *
 * Sequence: 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, ... seconds, indexed from 0.
 * Capped once the delay would exceed ~60s, so a persistently-down backend
 * doesn't make the wait between retries grow unboundedly.
 */

const FIB_SEQUENCE = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

// Highest index whose Fibonacci value is still <= ~60s (89 > 60, so cap at 55/index 8).
const MAX_INDEX = FIB_SEQUENCE.findIndex((n) => n > 60) - 1;

export function fibonacci(index: number): number {
  const clamped = Math.max(0, Math.min(index, MAX_INDEX));
  // Safe: clamped is always within [0, MAX_INDEX], a valid FIB_SEQUENCE index.
  return FIB_SEQUENCE[clamped]!;
}

export interface NextFibDelay {
  /** Countdown duration, in seconds, for this page load. */
  delay: number;
  /** Index to persist (in sessionStorage) for the *next* load. */
  nextIndex: number;
}

/**
 * Given the retry index read from sessionStorage (0 if absent/invalid),
 * returns this load's countdown duration and the index to persist for the
 * next reload. The index is capped at MAX_INDEX so repeated failures settle
 * at the ~60s ceiling instead of growing forever.
 */
export function nextFibDelay(index: number): NextFibDelay {
  const safeIndex = Number.isInteger(index) && index >= 0 ? index : 0;
  const delay = fibonacci(safeIndex);
  const nextIndex = Math.min(safeIndex + 1, MAX_INDEX);
  return { delay, nextIndex };
}
