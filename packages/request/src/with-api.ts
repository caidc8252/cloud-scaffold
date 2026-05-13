import { auth, buildSessionSnapshot, getSessionTokenFromCookieHeader } from "@cloud/auth";
import { getSessionSnapshot, type SessionSnapshot } from "@cloud/cache";
import { getEnv } from "@cloud/config";
import { prisma, type PrismaClient } from "@cloud/db";
import { PermissionChecker } from "@cloud/permissions";
import { z } from "zod";
import { ApiException, apiFailure, apiSuccess, formatZodError } from "./response";

type PermissionOption =
  | string
  | string[]
  | {
      obj: string;
      method: string | string[];
    };

type ApiOptions<
  TQuery extends z.ZodType | undefined,
  TBody extends z.ZodType | undefined,
  TParams extends z.ZodType | undefined,
> = {
  public?: boolean;
  permission?: PermissionOption;
  querySchema?: TQuery;
  bodySchema?: TBody;
  paramsSchema?: TParams;
};

type InferSchema<T extends z.ZodType | undefined> = T extends z.ZodType ? z.infer<T> : undefined;

export type ApiContext<
  TQuery extends z.ZodType | undefined = undefined,
  TBody extends z.ZodType | undefined = undefined,
  TParams extends z.ZodType | undefined = undefined,
> = {
  request: Request;
  requestId: string;
  session: SessionSnapshot | null;
  permissions: PermissionChecker | null;
  query: InferSchema<TQuery>;
  body: InferSchema<TBody>;
  params: InferSchema<TParams>;
  prisma: PrismaClient;
};

export type RouteContextLike = {
  params?: unknown | Promise<unknown>;
};

const BODY_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function withApi<
  TQuery extends z.ZodType | undefined = undefined,
  TBody extends z.ZodType | undefined = undefined,
  TParams extends z.ZodType | undefined = undefined,
>(
  options: ApiOptions<TQuery, TBody, TParams>,
  handler: (ctx: ApiContext<TQuery, TBody, TParams>) => Promise<unknown> | unknown,
) {
  return async (request: Request, routeContext?: RouteContextLike) => {
    const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
    const url = new URL(request.url);
    let clearSessionCookie = false;

    try {
      assertBodySize(request);

      const session = options.public ? null : await resolveSession(request);
      if (!options.public && !session) {
        clearSessionCookie = true;
        throw new ApiException(401, "SESSION_EXPIRED", "登录已过期，请重新登录");
      }

      const permissions = session ? new PermissionChecker(session) : null;
      if (
        options.permission &&
        permissions &&
        !matchesPermission(permissions, options.permission)
      ) {
        throw new ApiException(401, "PERMISSION_DENIED", "没有当前权限");
      }

      const query = parseSchema(
        options.querySchema,
        Object.fromEntries(url.searchParams.entries()),
        "query",
      );
      const body = parseSchema(options.bodySchema, await parseBody(request), "body");
      const rawParams = routeContext?.params ? await routeContext.params : undefined;
      const params = parseSchema(options.paramsSchema, rawParams, "params");

      const data = await handler({
        request,
        requestId,
        session,
        permissions,
        query: query as InferSchema<TQuery>,
        body: body as InferSchema<TBody>,
        params: params as InferSchema<TParams>,
        prisma,
      });

      return apiSuccess(data, { requestId });
    } catch (error) {
      logApiError(error, requestId, url.pathname, request.method);
      return apiFailure(normalizeError(error), {
        requestId,
        clearSessionCookie: clearSessionCookie ? getEnv().SESSION_COOKIE_NAME : undefined,
      });
    }
  };
}

function matchesPermission(checker: PermissionChecker, permission: PermissionOption) {
  if (typeof permission === "string" || Array.isArray(permission)) {
    return checker.has(permission);
  }

  return checker.can(permission.obj, permission.method);
}

async function resolveSession(request: Request) {
  const token = getSessionTokenFromCookieHeader(request.headers.get("cookie"));
  if (!token) {
    return null;
  }

  const cached = await getSessionSnapshot(token);
  if (cached) {
    return cached;
  }

  const betterAuthSession = await auth.api.getSession({
    headers: request.headers,
  });

  if (!betterAuthSession) {
    return null;
  }

  return buildSessionSnapshot(token, betterAuthSession);
}

function assertBodySize(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return;
  }

  const size = Number(contentLength);
  if (Number.isFinite(size) && size > getEnv().REQUEST_BODY_LIMIT_BYTES) {
    throw new ApiException(413, "PAYLOAD_TOO_LARGE", "请求体不能超过 10MB");
  }
}

async function parseBody(request: Request) {
  if (!BODY_METHODS.has(request.method)) {
    return undefined;
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > getEnv().REQUEST_BODY_LIMIT_BYTES) {
      throw new ApiException(413, "PAYLOAD_TOO_LARGE", "请求体不能超过 10MB");
    }

    return text ? JSON.parse(text) : {};
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await request.text();
    return formatRecord(Object.fromEntries(new URLSearchParams(text).entries()));
  }

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return formatRecord(Object.fromEntries(formData.entries()));
  }

  return undefined;
}

function parseSchema<T extends z.ZodType | undefined>(
  schema: T,
  value: unknown,
  source: "query" | "body" | "params",
): InferSchema<T> {
  if (!schema) {
    return value as InferSchema<T>;
  }

  const result = schema.safeParse(formatValue(value));
  if (!result.success) {
    throw new ApiException(400, "VALIDATION_ERROR", "请求参数错误", {
      source,
      issues: formatZodError(result.error),
    });
  }

  return result.data as InferSchema<T>;
}

function formatRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, formatValue(value)]),
  );
}

function formatValue(value: unknown): unknown {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return undefined;
    }
    if (trimmed === "true") {
      return true;
    }
    if (trimmed === "false") {
      return false;
    }
    return trimmed;
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item));
  }

  if (value && typeof value === "object" && !(value instanceof File)) {
    return formatRecord(value as Record<string, unknown>);
  }

  return value;
}

function normalizeError(error: unknown) {
  if (error instanceof ApiException) {
    return error;
  }

  if (error instanceof SyntaxError) {
    return new ApiException(400, "INVALID_JSON", "JSON 格式错误");
  }

  return error instanceof Error ? error : new Error(String(error));
}

function logApiError(error: unknown, requestId: string, path: string, method: string) {
  const stack = error instanceof Error ? error.stack : undefined;
  console.error("[api]", {
    requestId,
    path,
    method,
    error,
    stack,
  });
}
