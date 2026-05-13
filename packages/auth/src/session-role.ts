import type { SessionSnapshot } from "@cloud/cache";

export function hasSessionRole(session: Pick<SessionSnapshot, "roles"> | null, role: string) {
  return Boolean(session?.roles.includes(role));
}
