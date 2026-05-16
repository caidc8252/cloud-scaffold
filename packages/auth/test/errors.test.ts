import { describe, expect, it } from "vitest";
import { AuthzError } from "../src/server/errors.ts";

describe("AuthzError", () => {
  it("captures status / code / missing", () => {
    const e = new AuthzError(403, "forbidden", ["a.b"]);
    expect(e).toBeInstanceOf(Error);
    expect(e.name).toBe("AuthzError");
    expect(e.status).toBe(403);
    expect(e.code).toBe("forbidden");
    expect(e.missing).toEqual(["a.b"]);
  });

  it("missing defaults to undefined", () => {
    const e = new AuthzError(401, "unauthenticated");
    expect(e.status).toBe(401);
    expect(e.code).toBe("unauthenticated");
    expect(e.missing).toBeUndefined();
  });
});
