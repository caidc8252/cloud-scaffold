import type { ZodError, ZodType, infer as zInfer } from "zod";

/** 从 ZodError 取第一条 issue 的 message。 */
export function firstErrorMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "invalid input";
}

/** 把 ZodError 按字段路径聚合，方便逐字段回显；无 path 的 issue 落到 formErrors。 */
export function aggregateErrors(error: ZodError): {
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
} {
  const fieldErrors: Record<string, string[]> = {};
  const formErrors: string[] = [];
  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      formErrors.push(issue.message);
      continue;
    }
    const key = issue.path.map(String).join(".");
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return { fieldErrors, formErrors };
}

/** API handler 用：成功返回 data，失败只回第一条 message。 */
export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function parseOrFirstError<S extends ZodType>(
  schema: S,
  input: unknown,
): ParseResult<zInfer<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, error: firstErrorMessage(result.error) };
}

/** 表单 / Server Action 用：成功返回 data，失败回所有 issue（按字段聚合）。 */
export type ParseAllResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      fieldErrors: Record<string, string[]>;
      formErrors: string[];
    };

export function parseAllErrors<S extends ZodType>(
  schema: S,
  input: unknown,
): ParseAllResult<zInfer<S>> {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  return { ok: false, ...aggregateErrors(result.error) };
}

