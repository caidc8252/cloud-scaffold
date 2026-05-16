import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieStore = {
  get: vi.fn<(name: string) => { value: string } | undefined>(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

const sessionStoreMock = {
  create: vi.fn(),
  destroy: vi.fn(),
};

vi.mock("../src/server/session.ts", async () => {
  const actual = await vi.importActual<typeof import("../src/server/session.ts")>(
    "../src/server/session.ts",
  );
  return {
    ...actual,
    sessionStore: sessionStoreMock,
  };
});

beforeEach(() => {
  cookieStore.get.mockReset();
  cookieStore.set.mockReset();
  cookieStore.delete.mockReset();
  sessionStoreMock.create.mockReset();
  sessionStoreMock.destroy.mockReset();
});

describe("createSessionFor", () => {
  it("writes session in store and sets sid cookie with hardened attrs", async () => {
    sessionStoreMock.create.mockResolvedValueOnce({ sid: "fresh-sid" });
    const { createSessionFor, SID_COOKIE, SID_COOKIE_MAX_AGE_SECONDS } = await import(
      "../src/server/actions.ts"
    ).then(async (m) => ({
      ...m,
      ...(await import("../src/server/session.ts")),
    }));

    await createSessionFor({
      userId: "u1",
      account: "alice",
      email: "a@b.com",
      permissions: ["x.y"],
    });

    expect(sessionStoreMock.create).toHaveBeenCalledWith({
      userId: "u1",
      account: "alice",
      email: "a@b.com",
      permissions: ["x.y"],
    });
    expect(cookieStore.set).toHaveBeenCalledTimes(1);
    const [name, value, opts] = cookieStore.set.mock.calls[0]!;
    expect(name).toBe(SID_COOKIE);
    expect(value).toBe("fresh-sid");
    expect(opts).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: SID_COOKIE_MAX_AGE_SECONDS,
    });
  });
});

describe("destroyCurrentSession", () => {
  it("deletes redis entry and clears cookie when sid present", async () => {
    cookieStore.get.mockReturnValueOnce({ value: "abc" });
    sessionStoreMock.destroy.mockResolvedValueOnce(undefined);
    const { destroyCurrentSession } = await import("../src/server/actions.ts");
    const { SID_COOKIE } = await import("../src/server/session.ts");

    await destroyCurrentSession();

    expect(sessionStoreMock.destroy).toHaveBeenCalledWith("abc");
    expect(cookieStore.delete).toHaveBeenCalledWith(SID_COOKIE);
  });

  it("still clears cookie when no sid present (idempotent)", async () => {
    cookieStore.get.mockReturnValueOnce(undefined);
    const { destroyCurrentSession } = await import("../src/server/actions.ts");
    const { SID_COOKIE } = await import("../src/server/session.ts");

    await destroyCurrentSession();

    expect(sessionStoreMock.destroy).not.toHaveBeenCalled();
    expect(cookieStore.delete).toHaveBeenCalledWith(SID_COOKIE);
  });
});
