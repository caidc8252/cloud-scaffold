import { describe, expect, it } from "vitest";
import {
  loginActionInputSchema,
  loginFormSchema,
  loginPayloadSchema,
} from "../schema/login";
import { parseOrFirstError } from "../../../../lib/schema";

describe("loginFormSchema", () => {
  it("accepts a trimmed account and any non-empty password", () => {
    const result = parseOrFirstError(loginFormSchema, {
      account: " alice ",
      password: "p@ss",
    });
    expect(result).toEqual({
      ok: true,
      data: { account: "alice", password: "p@ss" },
    });
  });

  it("rejects empty account with key 'missing'", () => {
    const result = parseOrFirstError(loginFormSchema, {
      account: "  ",
      password: "p@ss",
    });
    expect(result).toEqual({ ok: false, error: "missing" });
  });

  it("rejects empty password with key 'missing'", () => {
    const result = parseOrFirstError(loginFormSchema, {
      account: "alice",
      password: "",
    });
    expect(result).toEqual({ ok: false, error: "missing" });
  });
});

describe("loginActionInputSchema", () => {
  it("requires account and encrypted; treats null as missing", () => {
    const result = parseOrFirstError(loginActionInputSchema, {
      account: null,
      encrypted: "abc",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("missing");
  });
});

describe("loginPayloadSchema", () => {
  it("accepts a valid payload", () => {
    const result = parseOrFirstError(loginPayloadSchema, {
      password: "p@ss",
      ts: Date.now(),
    });
    expect(result.ok).toBe(true);
  });

  it("rejects negative timestamps with 'invalidRequest'", () => {
    const result = parseOrFirstError(loginPayloadSchema, {
      password: "p@ss",
      ts: -1,
    });
    expect(result).toEqual({ ok: false, error: "invalidRequest" });
  });

  it("rejects non-numeric ts", () => {
    const result = parseOrFirstError(loginPayloadSchema, {
      password: "p@ss",
      ts: "now",
    });
    expect(result.ok).toBe(false);
  });
});
