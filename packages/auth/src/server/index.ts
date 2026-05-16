import "server-only";

export type { Session } from "./session.ts";
export {
  SID_COOKIE,
  SESSION_TTL_SECONDS,
  SID_COOKIE_MAX_AGE_SECONDS,
  sessionStore,
} from "./session.ts";
export { getSession, requireSession } from "./dal.ts";
export { createSessionFor, destroyCurrentSession } from "./actions.ts";
export { AuthzError, type AuthzCode } from "./errors.ts";
export {
  hasPermissions,
  assertPermissions,
  requirePermissions,
  type PermCheck,
} from "./permissions.ts";
