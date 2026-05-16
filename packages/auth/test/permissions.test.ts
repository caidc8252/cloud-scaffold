import { describe, expect, it } from "vitest";
import { hasPermissions } from "../src/server/permissions.ts";

describe("hasPermissions", () => {
  it("empty check passes regardless of have", () => {
    expect(hasPermissions([], {})).toBe(true);
    expect(hasPermissions(["a"], {})).toBe(true);
  });

  it("all: every required must be present", () => {
    expect(hasPermissions(["a", "b"], { all: ["a", "b"] })).toBe(true);
    expect(hasPermissions(["a"], { all: ["a", "b"] })).toBe(false);
    expect(hasPermissions([], { all: ["a"] })).toBe(false);
  });

  it("any: at least one required must be present", () => {
    expect(hasPermissions(["b"], { any: ["a", "b"] })).toBe(true);
    expect(hasPermissions(["c"], { any: ["a", "b"] })).toBe(false);
  });

  it("any: empty array treated as not provided (passes)", () => {
    expect(hasPermissions([], { any: [] })).toBe(true);
  });

  it("combines all + any: both must hold", () => {
    expect(hasPermissions(["a", "b"], { all: ["a"], any: ["b", "c"] })).toBe(
      true,
    );
    expect(hasPermissions(["a"], { all: ["a"], any: ["b", "c"] })).toBe(false);
    expect(hasPermissions(["b"], { all: ["a"], any: ["b"] })).toBe(false);
  });
});
