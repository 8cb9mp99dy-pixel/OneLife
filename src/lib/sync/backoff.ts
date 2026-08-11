const BACKOFF_STEPS_MS = [5_000, 30_000, 120_000];

// Delay before the next flush retry, given how many consecutive failures
// this outbox row has accumulated so far. Climbs 5s -> 30s -> 2min, then
// holds at the cap for any further failures.
export function nextBackoffDelay(attempts: number): number {
  const index = Math.min(Math.max(attempts - 1, 0), BACKOFF_STEPS_MS.length - 1);
  return BACKOFF_STEPS_MS[index];
}
