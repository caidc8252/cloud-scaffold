import { describe, expect, it } from "vitest";
import { parseTrustedOrigins } from "./index";

describe("parseTrustedOrigins", () => {
  it("parses comma-separated origins with trimming and de-duplication", () => {
    expect(
      parseTrustedOrigins("http://localhost:3000, http://localhost:3002, http://localhost:3002"),
    ).toEqual(["http://localhost:3000", "http://localhost:3002"]);
  });

  it("ignores empty items", () => {
    expect(parseTrustedOrigins("http://localhost:3000,, ")).toEqual(["http://localhost:3000"]);
  });
});
