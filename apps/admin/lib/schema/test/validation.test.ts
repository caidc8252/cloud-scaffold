import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  aggregateErrors,
  firstErrorMessage,
  parseAllErrors,
  parseOrFirstError,
} from "../validation.ts";
import { trimmedNonEmpty } from "../string.ts";

describe("firstErrorMessage", () => {
  it("returns the first issue message", () => {
    const schema = z.object({
      a: z.string().min(1, "a-required"),
      b: z.string().min(1, "b-required"),
    });
    const result = schema.safeParse({ a: "", b: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(firstErrorMessage(result.error)).toBe("a-required");
    }
  });

  it("falls back to a default when issues are empty (defensive)", () => {
    const fakeError = { issues: [] } as unknown as Parameters<
      typeof firstErrorMessage
    >[0];
    expect(firstErrorMessage(fakeError)).toBe("invalid input");
  });
});

describe("parseOrFirstError", () => {
  const schema = z.object({
    account: trimmedNonEmpty("missing"),
    age: z.number().int().positive("invalid"),
  });

  it("returns ok with parsed data on success", () => {
    const result = parseOrFirstError(schema, { account: "  alice  ", age: 1 });
    expect(result).toEqual({ ok: true, data: { account: "alice", age: 1 } });
  });

  it("returns ok:false with first error message on failure", () => {
    const result = parseOrFirstError(schema, { account: "  ", age: 1 });
    expect(result).toEqual({ ok: false, error: "missing" });
  });

  it("uses message from whichever field fails first", () => {
    const result = parseOrFirstError(schema, { account: "alice", age: -1 });
    expect(result).toEqual({ ok: false, error: "invalid" });
  });
});

describe("aggregateErrors", () => {
  it("buckets per-field issues into fieldErrors", () => {
    const schema = z.object({
      a: trimmedNonEmpty("a-missing"),
      b: trimmedNonEmpty("b-missing"),
    });
    const result = schema.safeParse({ a: "", b: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const agg = aggregateErrors(result.error);
      expect(agg.fieldErrors).toEqual({
        a: ["a-missing"],
        b: ["b-missing"],
      });
      expect(agg.formErrors).toEqual([]);
    }
  });

  it("routes path-less issues (e.g. refine) into formErrors", () => {
    const schema = z
      .object({
        a: z.string(),
        b: z.string(),
      })
      .refine((v) => v.a !== v.b, "ab-equal");
    const result = schema.safeParse({ a: "x", b: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const agg = aggregateErrors(result.error);
      expect(agg.fieldErrors).toEqual({});
      expect(agg.formErrors).toEqual(["ab-equal"]);
    }
  });

  it("collects multiple issues for the same field", () => {
    const schema = z.object({
      a: z.string().min(2, "too-short").regex(/^[a-z]+$/, "lowercase-only"),
    });
    const result = schema.safeParse({ a: "1" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const agg = aggregateErrors(result.error);
      expect(agg.fieldErrors.a).toEqual(
        expect.arrayContaining(["too-short", "lowercase-only"]),
      );
    }
  });
});

describe("parseAllErrors", () => {
  const schema = z.object({
    account: trimmedNonEmpty("missing"),
    password: trimmedNonEmpty("missing"),
  });

  it("returns ok with parsed data on success", () => {
    const result = parseAllErrors(schema, {
      account: " alice ",
      password: "p@ss",
    });
    expect(result).toEqual({
      ok: true,
      data: { account: "alice", password: "p@ss" },
    });
  });

  it("collects errors from every failing field", () => {
    const result = parseAllErrors(schema, { account: "", password: "" });
    expect(result).toEqual({
      ok: false,
      fieldErrors: { account: ["missing"], password: ["missing"] },
      formErrors: [],
    });
  });
});

describe("trimmedNonEmpty", () => {
  it("rejects empty / whitespace-only strings", () => {
    expect(trimmedNonEmpty("required").safeParse("").success).toBe(false);
    expect(trimmedNonEmpty("required").safeParse("   ").success).toBe(false);
  });

  it("returns trimmed string on success", () => {
    expect(trimmedNonEmpty().parse("  hello ")).toBe("hello");
  });
});
