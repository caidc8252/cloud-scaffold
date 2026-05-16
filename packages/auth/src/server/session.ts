import "server-only";
import { randomBytes } from "node:crypto";
import { kv } from "@cloud/cache";

export const SID_COOKIE = "sid";
export const SESSION_TTL_SECONDS = 1800;
export const SID_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

export type Session = {
  userId: string;
  account: string;
  email: string;
  permissions: string[];
  issuedAt: number;
};

const sessionKey = (sid: string) => `session:${sid}`;
const generateSid = () => randomBytes(32).toString("base64url");

export const sessionStore = {
  async create(snapshot: Omit<Session, "issuedAt">): Promise<{ sid: string }> {
    const sid = generateSid();
    const session: Session = { ...snapshot, issuedAt: Date.now() };
    await kv.set(sessionKey(sid), session, SESSION_TTL_SECONDS);
    return { sid };
  },
  read(sid: string): Promise<Session | null> {
    return kv.get<Session>(sessionKey(sid));
  },
  touch(sid: string): Promise<void> {
    return kv.expire(sessionKey(sid), SESSION_TTL_SECONDS);
  },
  destroy(sid: string): Promise<void> {
    return kv.del(sessionKey(sid));
  },
};
