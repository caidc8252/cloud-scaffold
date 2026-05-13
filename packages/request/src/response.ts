import { z } from "zod";

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  requestId: string;
};

export type ApiFailure = {
  success: false;
  error: ApiErrorBody;
  requestId: string;
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export class ApiException extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiException";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function apiSuccess<T>(
  data: T,
  options: { requestId?: string; message?: string; status?: number } = {},
) {
  const body: ApiSuccess<T> = {
    success: true,
    data,
    requestId: options.requestId ?? crypto.randomUUID(),
  };

  if (options.message) {
    body.message = options.message;
  }

  return Response.json(body, { status: options.status ?? 200 });
}

export function apiFailure(
  error: ApiException | Error | ApiErrorBody,
  options: { requestId?: string; status?: number; clearSessionCookie?: string } = {},
) {
  const requestId = options.requestId ?? crypto.randomUUID();
  const apiError =
    error instanceof ApiException
      ? { code: error.code, message: error.message, details: error.details }
      : error instanceof Error
        ? { code: "INTERNAL_SERVER_ERROR", message: "服务器异常" }
        : error;

  const status = options.status ?? (error instanceof ApiException ? error.status : 500);

  const response = Response.json(
    {
      success: false,
      error: apiError,
      requestId,
    } satisfies ApiFailure,
    { status },
  );

  if (options.clearSessionCookie) {
    response.headers.append(
      "Set-Cookie",
      `${options.clearSessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
    );
  }

  return response;
}

export function formatZodError(error: z.ZodError) {
  return error.flatten();
}
