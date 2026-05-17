import "server-only";

import { getTranslations } from "next-intl/server";
import { errorResponse } from "./response.ts";

type ErrorKey = "badRequest" | "unauthorized" | "forbidden" | "notFound";

async function defaultMessage(key: ErrorKey): Promise<string> {
  // 默认走 errors.* namespace；调用方应用未提供该 namespace 时回到 key 字符串
  // （由 @cloud/i18n 的 fallback 行为兜底）。
  const t = await getTranslations("errors");
  return t(key);
}

/** 400 Bad Request —— 不传 message 时自动取 errors.badRequest。 */
export async function badRequestResponse(message?: string): Promise<Response> {
  return errorResponse(message ?? (await defaultMessage("badRequest")), 400);
}

/** 401 Unauthorized —— 默认文案来自 errors.unauthorized。 */
export async function unauthorizedResponse(
  message?: string,
): Promise<Response> {
  return errorResponse(message ?? (await defaultMessage("unauthorized")), 401);
}

/** 403 Forbidden —— 默认文案来自 errors.forbidden。 */
export async function forbiddenResponse(message?: string): Promise<Response> {
  return errorResponse(message ?? (await defaultMessage("forbidden")), 403);
}

/** 404 Not Found —— 默认文案来自 errors.notFound。 */
export async function notFoundResponse(message?: string): Promise<Response> {
  return errorResponse(message ?? (await defaultMessage("notFound")), 404);
}
