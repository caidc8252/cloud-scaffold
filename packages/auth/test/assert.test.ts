import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();

vi.mock("../src/server/dal.ts", () => ({
  getSession: getSessionMock,
}));

beforeEach(() => {
  getSessionMock.mockReset();
});

describe("assertPermissions", () => {
  it("throws 401 unauthenticated when no session", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { assertPermissions, AuthzError } = await import(
      "../src/server/permissions.ts"
    ).then(async (m) => ({
      ...m,
      ...(await import("../src/server/errors.ts")),
    }));
    await expect(assertPermissions({ all: ["x"] })).rejects.toMatchObject({
      status: 401,
      code: "unauthenticated",
    });
    try {
      await assertPermissions({ all: ["x"] });
    } catch (e) {
      expect(e).toBeInstanceOf(AuthzError);
    }
  });

  it("throws 403 forbidden with missing list when permissions insufficient", async () => {
    getSessionMock.mockResolvedValue({
      userId: "u1",
      account: "a",
      email: "e",
      permissions: ["x.read"],
      issuedAt: 0,
    });
    const { assertPermissions } = await import("../src/server/permissions.ts");
    await expect(
      assertPermissions({ all: ["x.read", "x.write"] }),
    ).rejects.toMatchObject({
      status: 403,
      code: "forbidden",
      missing: ["x.write"],
    });
  });

  it("returns session when checks pass", async () => {
    const snap = {
      userId: "u1",
      account: "a",
      email: "e",
      permissions: ["x.read", "x.write"],
      issuedAt: 0,
    };
    getSessionMock.mockResolvedValueOnce(snap);
    const { assertPermissions } = await import("../src/server/permissions.ts");
    expect(await assertPermissions({ all: ["x.read"] })).toEqual(snap);
  });
});
