const DEFAULT_MAX_AGE_MS = 60_000;

export function assertFreshTimestamp(
  ts: number,
  options?: { maxAgeMs?: number },
): void {
  if (typeof ts !== "number" || !Number.isFinite(ts)) {
    throw new Error("timestamp must be a finite number");
  }
  const maxAge = options?.maxAgeMs ?? DEFAULT_MAX_AGE_MS;
  const delta = Math.abs(Date.now() - ts);
  if (delta > maxAge) {
    throw new Error("timestamp out of window");
  }
}
