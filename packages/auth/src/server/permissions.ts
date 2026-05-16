import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./dal.ts";
import { AuthzError } from "./errors.ts";
import type { Session } from "./session.ts";

export type PermCheck = { all?: string[]; any?: string[] };

export function hasPermissions(have: string[], check: PermCheck): boolean {
  const all = check.all ?? [];
  const any = check.any ?? [];
  const okAll = all.every((p) => have.includes(p));
  const okAny = any.length === 0 || any.some((p) => have.includes(p));
  return okAll && okAny;
}

function missingOf(have: string[], check: PermCheck): string[] {
  const all = (check.all ?? []).filter((p) => !have.includes(p));
  const any = check.any ?? [];
  const anyMiss = any.length > 0 && !any.some((p) => have.includes(p)) ? any : [];
  return Array.from(new Set([...all, ...anyMiss]));
}

export async function assertPermissions(check: PermCheck): Promise<Session> {
  const session = await getSession();
  if (!session) throw new AuthzError(401, "unauthenticated");
  if (!hasPermissions(session.permissions, check)) {
    throw new AuthzError(403, "forbidden", missingOf(session.permissions, check));
  }
  return session;
}

export async function requirePermissions(check: PermCheck): Promise<Session> {
  try {
    return await assertPermissions(check);
  } catch (e) {
    if (e instanceof AuthzError) {
      if (e.status === 401) redirect("/api/auth/logout");
      if (e.status === 403) redirect("/403");
    }
    throw e;
  }
}
