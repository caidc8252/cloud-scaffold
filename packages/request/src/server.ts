import "server-only";

import { getTranslations } from "next-intl/server";
import type { ErrorBody, Pager, SuccessBody } from "./index.ts";

/** 200 OK：单资源 / 列表 + 可选分页 meta。 */
export function successResponse<T>(data: T, pager?: Pager): Response {
  const body: SuccessBody<T> = pager ? { data, pager } : { data };
  return Response.json(body);
}

/** 201 Created。 */
export function createdResponse<T>(data: T): Response {
  return Response.json({ data } satisfies SuccessBody<T>, { status: 201 });
}

/** 204 No Content。 */
export function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}

/**
 * 通用错误响应。
 * @param message 文案（调用方负责本地化）
 * @param status  默认 400，外部可覆盖任意 HTTP 状态码
 */
export function errorResponse(message: string, status = 400): Response {
  return Response.json({ message } satisfies ErrorBody, { status });
}

type ErrorKey = "badRequest" | "unauthorized" | "forbidden" | "notFound";

async function defaultMessage(key: ErrorKey): Promise<string> {
  // namespace 由 @cloud/request 自带 messages 提供；app 未引入也能 fallback 到 key 字符串
  // （由 @cloud/i18n 的 getMessageFallback 兜底）。
  const t = await getTranslations("request.errors");
  return t(key);
}

/** 400 Bad Request —— 不传 message 时自动取 request.errors.badRequest。 */
export async function badRequestResponse(message?: string): Promise<Response> {
  return errorResponse(message ?? (await defaultMessage("badRequest")), 400);
}

/** 401 Unauthorized —— 默认文案来自 request.errors.unauthorized。 */
export async function unauthorizedResponse(
  message?: string,
): Promise<Response> {
  return errorResponse(message ?? (await defaultMessage("unauthorized")), 401);
}

/** 403 Forbidden —— 默认文案来自 request.errors.forbidden。 */
export async function forbiddenResponse(message?: string): Promise<Response> {
  return errorResponse(message ?? (await defaultMessage("forbidden")), 403);
}

/** 404 Not Found —— 默认文案来自 request.errors.notFound。 */
export async function notFoundResponse(message?: string): Promise<Response> {
  return errorResponse(message ?? (await defaultMessage("notFound")), 404);
}

export type { Pager, SuccessBody, ErrorBody } from "./index.ts";
