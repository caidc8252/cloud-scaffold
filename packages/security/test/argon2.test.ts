import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../src/server/index.ts";

describe("argon2id", () => {
  it("hash + verify round trip", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(hash, "correct horse battery staple")).toBe(true);
  });

  it("verify rejects wrong password", async () => {
    const hash = await hashPassword("right");
    expect(await verifyPassword(hash, "wrong")).toBe(false);
  });

  it("verify returns false (does not throw) for malformed hash", async () => {
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });
});
