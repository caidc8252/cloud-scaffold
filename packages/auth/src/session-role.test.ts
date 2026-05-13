import { describe, expect, it } from "vitest";
import { hasSessionRole } from "./session-role";

describe("hasSessionRole", () => {
  it("matches roles from a session snapshot", () => {
    expect(hasSessionRole({ roles: ["admin", "support"] }, "admin")).toBe(true);
    expect(hasSessionRole({ roles: ["partner_admin"] }, "admin")).toBe(false);
  });

  it("returns false for a missing session", () => {
    expect(hasSessionRole(null, "admin")).toBe(false);
  });
});
