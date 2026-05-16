import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();
const redirectMock = vi.fn((url: string): never => {
  throw new Error(`__REDIRECT__:${url}`);
});

vi.mock("../src/server/dal.ts", () => ({
  getSession: getSessionMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

beforeEach(() => {
  getSessionMock.mockReset();
  redirectMock.mockClear();
});

describe("requirePermissions", () => {
  it("redirects to /api/auth/logout when no session", async () => {
    getSessionMock.mockResolvedValueOnce(null);
    const { requirePermissions } = await import(
      "../src/server/permissions.ts"
    );
    await expect(requirePermissions({ all: ["x"] })).rejects.toThrow(
      "__REDIRECT__:/api/auth/logout",
    );
    expect(redirectMock).toHaveBeenCalledWith("/api/auth/logout");
  });

  it("redirects to /403 when session lacks permission", async () => {
    getSessionMock.mockResolvedValueOnce({
      userId: "u1",
      account: "a",
      email: "e",
      permissions: ["x.read"],
      issuedAt: 0,
    });
    const { requirePermissions } = await import(
      "../src/server/permissions.ts"
    );
    await expect(
      requirePermissions({ all: ["x.write"] }),
    ).rejects.toThrow("__REDIRECT__:/403");
    expect(redirectMock).toHaveBeenCalledWith("/403");
  });

  it("returns session when checks pass", async () => {
    const snap = {
      userId: "u1",
      account: "a",
      email: "e",
      permissions: ["x.read"],
      issuedAt: 0,
    };
    getSessionMock.mockResolvedValueOnce(snap);
    const { requirePermissions } = await import(
      "../src/server/permissions.ts"
    );
    expect(await requirePermissions({ all: ["x.read"] })).toEqual(snap);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
