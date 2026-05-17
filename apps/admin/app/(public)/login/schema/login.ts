import { z } from "zod";
import { trimmedNonEmpty } from "../../../../lib/schema";

/** Login 错误 message 与 messages/<locale>.json `auth.login.errors.*` 的 key 对齐。 */
export type LoginErrorKey =
  | "missing"
  | "invalidRequest"
  | "invalidCredentials"
  | "encryptFailed";

/** 客户端表单：账号 + 明文密码。加密前先过这一层。 */
export const loginFormSchema = z.object({
  account: trimmedNonEmpty("missing"),
  password: z.string().min(1, "missing"),
});
export type LoginFormInput = z.infer<typeof loginFormSchema>;

/** Server action 入参：账号 + RSA 加密后的密文。 */
export const loginActionInputSchema = z.object({
  account: trimmedNonEmpty("missing"),
  encrypted: trimmedNonEmpty("missing"),
});
export type LoginActionInput = z.infer<typeof loginActionInputSchema>;

/** RSA 解密后再校验：明文密码 + 时间戳。 */
export const loginPayloadSchema = z.object({
  password: z.string().min(1, "invalidRequest"),
  ts: z.number().int().positive("invalidRequest"),
});
export type LoginPayload = z.infer<typeof loginPayloadSchema>;
