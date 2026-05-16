import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SID_COOKIE, sessionStore, type Session } from "./session.ts";

export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const sid = store.get(SID_COOKIE)?.value;
  if (!sid) return null;
  const snapshot = await sessionStore.read(sid);
  if (!snapshot) return null;
  await sessionStore.touch(sid);
  return snapshot;
});

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/api/auth/logout");
  return s;
}
