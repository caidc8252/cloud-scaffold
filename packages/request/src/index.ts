/**
 * 共享类型：client / server 都可读，不依赖 server-only / next-intl。
 *
 * RESTful 响应外壳约定：
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
