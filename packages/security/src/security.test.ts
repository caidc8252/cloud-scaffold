import { describe, expect, it } from "vitest";
import { hashPassword, hashToken, maskSensitive, verifyPassword } from "./index";

describe("security helpers", () => {
  it("hashes and verifies passwords with bcryptjs", async () => {
    const hash = await hashPassword("CorrectHorseBatteryStaple1!");
    expect(hash).not.toBe("CorrectHorseBatteryStaple1!");
    await expect(verifyPassword("CorrectHorseBatteryStaple1!", hash)).resolves.toBe(true);
    await expect(verifyPassword("bad-password", hash)).resolves.toBe(false);
  });

  it("hashes tokens and masks sensitive objects", () => {
    expect(hashToken("token")).toHaveLength(64);
    expect(maskSensitive({ email: "a@example.com", password: "secret" })).toEqual({
      email: "a@example.com",
      password: "***",
    });
  });
});
