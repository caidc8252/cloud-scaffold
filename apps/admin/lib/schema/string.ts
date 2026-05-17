import { z } from "zod";

/**
 * Trim 后非空字符串。
 * message 推荐使用 i18n key，由调用方翻译。
 * 同一个 message 同时覆盖：类型错误（如 null / undefined / 非字符串）和 trim 后为空。
 */
export const trimmedNonEmpty = (message = "required") =>
  z.string({ error: message }).trim().min(1, message);
