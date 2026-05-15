import { describe, expect, it } from "vitest";
import { assertFreshTimestamp } from "../src/server/index.ts";

describe("assertFreshTimestamp", () => {
  it("passes for now()", () => {
    expect(() => assertFreshTimestamp(Date.now())).not.toThrow();
  });

  it("throws for stale ts (>60s past)", () => {
    expect(() => assertFreshTimestamp(Date.now() - 70_000)).toThrow();
  });

  it("throws for future ts (>60s ahead)", () => {
    expect(() => assertFreshTimestamp(Date.now() + 70_000)).toThrow();
  });

  it("respects custom window", () => {
    expect(() =>
      assertFreshTimestamp(Date.now() - 30_000, { maxAgeMs: 10_000 }),
    ).toThrow();
  });

  it("throws for non-finite ts", () => {
    expect(() => assertFreshTimestamp(Number.NaN)).toThrow();
  });
});
