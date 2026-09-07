/**
 * Monotonic counter bumped whenever a source port's value changes. Output ports
 * cache their pulled value against the epoch it was computed at, so a single
 * `setValue` invalidates every downstream cache exactly once.
 */
let epoch = 0;

export function currentEpoch(): number {
  return epoch;
}

export function bumpEpoch(): void {
  epoch++;
}
