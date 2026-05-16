import "server-only";
import { cookies } from "next/headers";
import {
  SID_COOKIE,
  SID_COOKIE_MAX_AGE_SECONDS,
  sessionStore,
  type Session,
} from "./session.ts";

export async function createSessionFor(
  snapshot: Omit<Session, "issuedAt">,
): Promise<void> {
  const { sid } = await sessionStore.create(snapshot);
  const store = await cookies();
  store.set(SID_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SID_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const sid = store.get(SID_COOKIE)?.value;
  if (sid) await sessionStore.destroy(sid);
  store.delete(SID_COOKIE);
}
