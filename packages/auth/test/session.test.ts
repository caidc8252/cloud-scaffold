import { beforeEach, describe, expect, it, vi } from "vitest";

const kvMock = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  expire: vi.fn(),
};

vi.mock("@cloud/cache", () => ({ kv: kvMock }));

beforeEach(() => {
  vi.resetAllMocks();
});

describe("sessionStore", () => {
  it("create writes session:<sid> with TTL and returns sid", async () => {
    kvMock.set.mockResolvedValueOnce(undefined);
    const { sessionStore, SESSION_TTL_SECONDS } = await import("../src/server/session.ts");
    const { sid } = await sessionStore.create({
      userId: "u1",
      account: "alice",
      email: "alice@example.com",
      permissions: ["x.read"],
    });
    expect(sid).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(sid.length).toBeGreaterThan(20);
    expect(kvMock.set).toHaveBeenCalledTimes(1);
    const [key, value, ttl] = kvMock.set.mock.calls[0]!;
    expect(key).toBe(`session:${sid}`);
    expect(value).toMatchObject({
      userId: "u1",
      account: "alice",
      email: "alice@example.com",
      permissions: ["x.read"],
    });
    expect((value as { issuedAt: number }).issuedAt).toBeGreaterThan(0);
    expect(ttl).toBe(SESSION_TTL_SECONDS);
  });

  it("read returns null when redis returns null", async () => {
    kvMock.get.mockResolvedValueOnce(null);
    const { sessionStore } = await import("../src/server/session.ts");
    expect(await sessionStore.read("nope")).toBeNull();
    expect(kvMock.get).toHaveBeenCalledWith("session:nope");
  });

  it("read returns session payload", async () => {
    const snapshot = {
      userId: "u1",
      account: "alice",
      email: "a@b.com",
      permissions: [],
      issuedAt: 123,
    };
    kvMock.get.mockResolvedValueOnce(snapshot);
    const { sessionStore } = await import("../src/server/session.ts");
    expect(await sessionStore.read("abc")).toEqual(snapshot);
  });

  it("touch calls expire with SESSION_TTL_SECONDS", async () => {
    const { sessionStore, SESSION_TTL_SECONDS } = await import("../src/server/session.ts");
    await sessionStore.touch("abc");
    expect(kvMock.expire).toHaveBeenCalledWith("session:abc", SESSION_TTL_SECONDS);
  });

  it("destroy calls del", async () => {
    const { sessionStore } = await import("../src/server/session.ts");
    await sessionStore.destroy("abc");
    expect(kvMock.del).toHaveBeenCalledWith("session:abc");
  });
});
