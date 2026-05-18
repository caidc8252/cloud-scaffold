import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RequestError, request } from "../src/client.ts";

// jsdom 默认 origin 取自 window.location（vitest 环境下通常是 http://localhost:3000）。
// 测试用动态值避免 hardcode 跑挂。
const ORIGIN = window.location.origin;

type FetchMock = ReturnType<typeof vi.fn>;

function setupFetch(): FetchMock {
  const fetchMock = vi.fn();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

function stubLocation(): {
  replace: ReturnType<typeof vi.fn>;
  restore: () => void;
} {
  // jsdom 上 Location.replace 不在原型上以普通方法形式暴露，spyOn / defineProperty(instance) 都失败；
  // 直接覆盖整个 window.location（它是 configurable accessor）。
  const replace = vi.fn();
  const original = window.location;
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      origin: original.origin,
      href: original.href,
      replace,
    } as unknown as Location,
  });
  return {
    replace,
    restore: () => {
      Object.defineProperty(window, "location", {
        configurable: true,
        value: original,
      });
    },
  };
}

function jsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

function textResponse(text: string, init?: ResponseInit): Response {
  return new Response(text, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
    ...init,
  });
}

describe("@cloud/request/client — success path", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = setupFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("get<T> resolves SuccessBody with data only", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: 1 } }));
    const sb = await request.get<{ id: number }>("/api/x");
    expect(sb).toEqual({ data: { id: 1 } });
    expect(sb).not.toHaveProperty("pager");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/x",
      expect.objectContaining({ method: "GET" }),
    );
  });

  it("get<T> resolves SuccessBody with pager when present", async () => {
    const pager = { page: 1, limit: 20, total: 5, totalPages: 1 };
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: [], pager }));
    const sb = await request.get<unknown[]>("/api/list");
    expect(sb).toEqual({ data: [], pager });
  });

  it("post auto-serializes object body + sets application/json", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { id: 9 } }));
    const out = await request.post<{ id: number }>("/api/x", { name: "x" });
    expect(out).toEqual({ id: 9 });
    const [, init] = fetchMock.mock.calls[0]!;
    expect((init as RequestInit).body).toBe(JSON.stringify({ name: "x" }));
    const headers = new Headers((init as RequestInit).headers);
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("post passes through FormData / Blob / string without forcing Content-Type", async () => {
    // mockImplementation 每次返回**新的** Response，否则 body 已被读会抛
    // "Body is unusable" —— Response 是 one-shot stream。
    fetchMock.mockImplementation(() =>
      Promise.resolve(jsonResponse({ data: null })),
    );

    const fd = new FormData();
    fd.append("a", "1");
    await request.post("/api/x", fd);
    const fdInit = fetchMock.mock.calls.at(-1)![1] as RequestInit;
    expect(fdInit.body).toBe(fd);
    expect(new Headers(fdInit.headers).has("Content-Type")).toBe(false);

    const blob = new Blob(["hello"], { type: "text/plain" });
    await request.post("/api/x", blob);
    const blobInit = fetchMock.mock.calls.at(-1)![1] as RequestInit;
    expect(blobInit.body).toBe(blob);
    expect(new Headers(blobInit.headers).has("Content-Type")).toBe(false);

    await request.post("/api/x", "raw text");
    const strInit = fetchMock.mock.calls.at(-1)![1] as RequestInit;
    expect(strInit.body).toBe("raw text");
    expect(new Headers(strInit.headers).has("Content-Type")).toBe(false);
  });

  it("query serializes primitives and skips null/undefined", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: null }));
    await request.get("/api/x", {
      query: { a: 1, b: true, c: null, d: undefined, e: "hi" },
    });
    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("/api/x?a=1&b=true&e=hi");
  });

  it("query merges with existing url ?... and preserves hash", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: null }));
    await request.get("/api/x?keep=1#frag", { query: { add: "y" } });
    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("/api/x?keep=1&add=y#frag");
  });

  it("delete on 204 resolves undefined and skips json parse", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const out = await request.delete("/api/x");
    expect(out).toBeUndefined();
  });

  it("delete on 200 unwraps data like post", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: { ok: true } }));
    const out = await request.delete<{ ok: boolean }>("/api/x");
    expect(out).toEqual({ ok: true });
  });

  it("passes opts.signal through to fetch", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: null }));
    const ac = new AbortController();
    await request.get("/api/x", { signal: ac.signal });
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.signal).toBe(ac.signal);
  });
});

describe("@cloud/request/client — error path", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = setupFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("non-401 4xx + JSON body → code:http with body.message", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "missing field" }, { status: 400 }),
    );
    await expect(request.post("/api/x", { a: 1 })).rejects.toMatchObject({
      name: "RequestError",
      status: 400,
      code: "http",
      body: { message: "missing field" },
    });
  });

  it("5xx + non-JSON body → code:http, body undefined, cause is parse error", async () => {
    fetchMock.mockResolvedValueOnce(textResponse("oops", { status: 500 }));
    let caught: unknown;
    try {
      await request.get("/api/x");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RequestError);
    const err = caught as RequestError;
    expect(err.status).toBe(500);
    expect(err.code).toBe("http");
    expect(err.body).toBeUndefined();
    expect(err.cause).toBeInstanceOf(Error);
  });

  it("2xx with non-JSON body → code:parse", async () => {
    fetchMock.mockResolvedValueOnce(textResponse("definitely not json"));
    let caught: unknown;
    try {
      await request.get("/api/x");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RequestError);
    expect((caught as RequestError).code).toBe("parse");
    expect((caught as RequestError).status).toBe(200);
    expect((caught as RequestError).cause).toBeInstanceOf(Error);
  });

  it("fetch throws → code:network, status 0, cause forwarded", async () => {
    const boom = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValueOnce(boom);
    let caught: unknown;
    try {
      await request.get("/api/x");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(RequestError);
    const err = caught as RequestError;
    expect(err.status).toBe(0);
    expect(err.code).toBe("network");
    expect(err.cause).toBe(boom);
  });
});

describe("@cloud/request/client — 401 redirect", () => {
  let fetchMock: FetchMock;
  let loc: ReturnType<typeof stubLocation>;

  beforeEach(() => {
    fetchMock = setupFetch();
    loc = stubLocation();
  });

  afterEach(() => {
    loc.restore();
    vi.restoreAllMocks();
  });

  it(
    "401 calls window.location.replace('/api/auth/logout') and rejects RequestError(status:401)",
    async () => {
      fetchMock.mockResolvedValueOnce(
        jsonResponse({ message: "go away" }, { status: 401 }),
      );
      await expect(request.get("/api/x")).rejects.toMatchObject({
        name: "RequestError",
        status: 401,
        code: "http",
      });
      expect(loc.replace).toHaveBeenCalledTimes(1);
      expect(loc.replace).toHaveBeenCalledWith("/api/auth/logout");
    },
  );
});

describe("@cloud/request/client — buildUrl edge", () => {
  let fetchMock: FetchMock;

  beforeEach(() => {
    fetchMock = setupFetch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns absolute when url is cross-origin", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: null }));
    await request.get("https://api.other.test/x", { query: { a: 1 } });
    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("https://api.other.test/x?a=1");
  });

  it("returns relative when url is same-origin absolute", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ data: null }));
    await request.get(`${ORIGIN}/api/x`, { query: { a: 1 } });
    const [calledUrl] = fetchMock.mock.calls[0]!;
    expect(calledUrl).toBe("/api/x?a=1");
  });
});
