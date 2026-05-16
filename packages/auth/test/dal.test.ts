import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  get: vi.fn<(name: string) => { value: string } | undefined>(),
};

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

const redirectMock = vi.fn((url: string): never => {
  throw new Error(`__REDIRECT__:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

const sessionStoreMock = {
  read: vi.fn(),
  touch: vi.fn(),
};

vi.mock("../src/session.ts", async () => {
  const actual = await vi.importActual<typeof import("../src/session.ts")>(
    "../src/session.ts",
  );
  return {
    ...actual,
    sessionStore: sessionStoreMock,
  };
});

beforeEach(() => {
  cookieStore.get.mockReset();
  redirectMock.mockClear();
  sessionStoreMock.read.mockReset();
  sessionStoreMock.touch.mockReset();
});

describe("getSession", () => {
  it("returns null when no sid cookie present", async () => {
    cookieStore.get.mockReturnValueOnce(undefined);
    const { getSession } = await import("../src/dal.ts");
    expect(await getSession()).toBeNull();
    expect(sessionStoreMock.read).not.toHaveBeenCalled();
  });

  it("returns null when sid present but redis returns null", async () => {
    cookieStore.get.mockReturnValueOnce({ value: "stale" });
    sessionStoreMock.read.mockResolvedValueOnce(null);
    const { getSession } = await import("../src/dal.ts");
    expect(await getSession()).toBeNull();
    expect(sessionStoreMock.touch).not.toHaveBeenCalled();
  });

  it("returns snapshot and touches TTL when sid resolves", async () => {
    const snapshot = {
      userId: "u1",
      account: "alice",
      email: "a@b.com",
      permissions: ["x.y"],
      issuedAt: 1,
    };
    cookieStore.get.mockReturnValueOnce({ value: "valid" });
    sessionStoreMock.read.mockResolvedValueOnce(snapshot);
    sessionStoreMock.touch.mockResolvedValueOnce(undefined);
    const { getSession } = await import("../src/dal.ts");
    expect(await getSession()).toEqual(snapshot);
    expect(sessionStoreMock.touch).toHaveBeenCalledWith("valid");
  });
});

describe("requireSession", () => {
  it("redirects to /api/auth/logout when no session", async () => {
    cookieStore.get.mockReturnValueOnce(undefined);
    const { requireSession } = await import("../src/dal.ts");
    await expect(requireSession()).rejects.toThrow("__REDIRECT__:/api/auth/logout");
    expect(redirectMock).toHaveBeenCalledWith("/api/auth/logout");
  });

  it("returns session when present", async () => {
    const snapshot = {
      userId: "u1",
      account: "alice",
      email: "a@b.com",
      permissions: [],
      issuedAt: 1,
    };
    cookieStore.get.mockReturnValueOnce({ value: "valid" });
    sessionStoreMock.read.mockResolvedValueOnce(snapshot);
    sessionStoreMock.touch.mockResolvedValueOnce(undefined);
    const { requireSession } = await import("../src/dal.ts");
    expect(await requireSession()).toEqual(snapshot);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
