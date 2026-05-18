"use client";
import "client-only";

import type { ErrorBody, SuccessBody } from "./index.ts";

export type { Pager, SuccessBody, ErrorBody } from "./index.ts";

export type RequestQueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  signal?: AbortSignal;
  headers?: HeadersInit;
  query?: Record<string, RequestQueryValue>;
};

export type RequestErrorCode = "http" | "network" | "parse" | "unknown";

export class RequestError extends Error {
  readonly status: number;
  readonly code: RequestErrorCode;
  readonly body?: ErrorBody;

  constructor(
    message: string,
    init: {
      status: number;
      code: RequestErrorCode;
      body?: ErrorBody;
      cause?: unknown;
    },
  ) {
    super(message, init.cause === undefined ? undefined : { cause: init.cause });
    this.name = "RequestError";
    this.status = init.status;
    this.code = init.code;
    this.body = init.body;
  }
}

function buildUrl(url: string, query: RequestOptions["query"]): string {
  if (!query) return url;
  // window may be undefined in non-browser test/SSR contexts; URL still needs a base for
  // relative inputs, so fall back to a sentinel origin and re-stringify accordingly.
  const fallbackOrigin = "http://_internal_";
  const origin =
    typeof window !== "undefined" ? window.location.origin : fallbackOrigin;
  const u = new URL(url, origin);

  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue;
    u.searchParams.append(k, String(v));
  }

  if (typeof window !== "undefined" && u.origin === window.location.origin) {
    return `${u.pathname}${u.search}${u.hash}`;
  }
  if (u.origin === fallbackOrigin) {
    return `${u.pathname}${u.search}${u.hash}`;
  }
  return u.toString();
}

function prepareBody(body: unknown): {
  body?: BodyInit;
  contentType?: string;
} {
  if (body == null) return {};
  if (typeof body === "string") return { body };
  if (
    body instanceof FormData ||
    body instanceof Blob ||
    body instanceof URLSearchParams ||
    body instanceof ArrayBuffer ||
    (typeof ReadableStream !== "undefined" && body instanceof ReadableStream)
  ) {
    return { body: body as BodyInit };
  }
  return { body: JSON.stringify(body), contentType: "application/json" };
}

function mergeHeaders(
  defaults: Record<string, string>,
  override: HeadersInit | undefined,
): Headers {
  const h = new Headers(defaults);
  if (override) {
    new Headers(override).forEach((value, key) => {
      h.set(key, value);
    });
  }
  return h;
}

async function executeRequest(
  method: string,
  url: string,
  body: unknown,
  opts: RequestOptions | undefined,
): Promise<Response> {
  const finalUrl = buildUrl(url, opts?.query);
  const { body: rawBody, contentType } = prepareBody(body);
  const defaults: Record<string, string> = {};
  if (contentType) defaults["Content-Type"] = contentType;
  const headers = mergeHeaders(defaults, opts?.headers);

  let res: Response;
  try {
    res = await fetch(finalUrl, {
      method,
      headers,
      body: rawBody,
      signal: opts?.signal,
    });
  } catch (cause) {
    throw new RequestError("network failure", {
      status: 0,
      code: "network",
      cause,
    });
  }

  if (res.status === 401) {
    // `replace` 不在 history 留下 logout 这一跳；与后端 DAL 同出口。
    if (typeof window !== "undefined") {
      window.location.replace("/api/auth/logout");
    }
    // 同步抛错，避免永挂 Promise；调用方约定静默处理 status === 401。
    throw new RequestError("unauthorized — redirecting to logout", {
      status: 401,
      code: "http",
    });
  }

  return res;
}

async function readSuccess<T>(res: Response): Promise<SuccessBody<T>> {
  try {
    return (await res.json()) as SuccessBody<T>;
  } catch (cause) {
    throw new RequestError(`HTTP ${res.status} (parse failed)`, {
      status: res.status,
      code: "parse",
      cause,
    });
  }
}

async function rejectError(res: Response): Promise<never> {
  let body: ErrorBody | undefined;
  let parseCause: unknown;
  try {
    body = (await res.json()) as ErrorBody;
  } catch (e) {
    parseCause = e;
  }
  throw new RequestError(body?.message ?? `HTTP ${res.status}`, {
    status: res.status,
    code: "http",
    body,
    cause: parseCause,
  });
}

async function get<T>(
  url: string,
  opts?: RequestOptions,
): Promise<SuccessBody<T>> {
  const res = await executeRequest("GET", url, undefined, opts);
  if (!res.ok) return rejectError(res);
  return readSuccess<T>(res);
}

async function withData<T>(
  method: string,
  url: string,
  body: unknown,
  opts?: RequestOptions,
): Promise<T> {
  const res = await executeRequest(method, url, body, opts);
  if (!res.ok) return rejectError(res);
  if (res.status === 204) return undefined as unknown as T;
  const sb = await readSuccess<T>(res);
  return sb.data;
}

export const request = {
  get,
  post: <T>(url: string, body?: unknown, opts?: RequestOptions) =>
    withData<T>("POST", url, body, opts),
  put: <T>(url: string, body?: unknown, opts?: RequestOptions) =>
    withData<T>("PUT", url, body, opts),
  patch: <T>(url: string, body?: unknown, opts?: RequestOptions) =>
    withData<T>("PATCH", url, body, opts),
  delete: <T = void>(url: string, opts?: RequestOptions) =>
    withData<T>("DELETE", url, undefined, opts),
};
