import "server-only";

export type AuthzCode = "unauthenticated" | "forbidden";

export class AuthzError extends Error {
  readonly status: 401 | 403;
  readonly code: AuthzCode;
  readonly missing?: string[];

  constructor(status: 401 | 403, code: AuthzCode, missing?: string[]) {
    super(code);
    this.name = "AuthzError";
    this.status = status;
    this.code = code;
    this.missing = missing;
  }
}
