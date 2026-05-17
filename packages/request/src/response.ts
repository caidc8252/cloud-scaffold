/**
 * RESTful 响应外壳：
 *   - 成功体 = { data, pager? }
 *   - 失败体 = { message }
 * 不带业务 code，状态码用 HTTP status 表达语义。
 */

export type Pager = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SuccessBody<T> = {
  data: T;
  pager?: Pager;
};

export type ErrorBody = {
  message: string;
};

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
