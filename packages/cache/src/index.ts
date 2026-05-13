import { getEnv } from "@cloud/config";
import { hashToken } from "@cloud/security";
import Redis from "ioredis";

export type SessionAccount = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
};

export type SessionSnapshot = {
  account: SessionAccount;
  roles: string[];
  permissions: string[];
  expiresAt: string;
  version: number;
};

let redis: Redis | null = null;

export function getRedis() {
  if (!redis) {
    redis = new Redis(getEnv().REDIS_URL, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
    });
  }

  return redis;
}

export function getSessionCacheKey(sessionToken: string) {
  const env = getEnv();
  return `${env.SESSION_CACHE_PREFIX}${hashToken(sessionToken)}`;
}

export async function getSessionSnapshot(sessionToken: string) {
  const cached = await getRedis().get(getSessionCacheKey(sessionToken));
  if (!cached) {
    return null;
  }

  return JSON.parse(cached) as SessionSnapshot;
}

export async function setSessionSnapshot(sessionToken: string, snapshot: SessionSnapshot) {
  await getRedis().set(
    getSessionCacheKey(sessionToken),
    JSON.stringify(snapshot),
    "EX",
    getEnv().SESSION_TTL_SECONDS,
  );
}

export async function deleteSessionSnapshot(sessionToken: string) {
  await getRedis().del(getSessionCacheKey(sessionToken));
}
