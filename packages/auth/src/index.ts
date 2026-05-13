import { getSessionSnapshot, setSessionSnapshot, type SessionSnapshot } from "@cloud/cache";
import { getEnv, resolveTrustedOrigins } from "@cloud/config";
import { prisma } from "@cloud/db";
import { hashPassword, verifyPassword } from "@cloud/security";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

const env = getEnv();

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: resolveTrustedOrigins(),
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    password: {
      hash: hashPassword,
      verify: async ({ hash, password }) => verifyPassword(password, hash),
    },
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  advanced: {
    cookies: {
      session_token: {
        name: env.SESSION_COOKIE_NAME,
        attributes: {
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;

export { hasSessionRole } from "./session-role";

export function getSessionTokenFromCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) {
    return null;
  }

  const cookieName = `${env.SESSION_COOKIE_NAME}=`;
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(cookieName));

  return cookie ? decodeURIComponent(cookie.slice(cookieName.length)) : null;
}

export async function buildSessionSnapshot(
  sessionToken: string,
  session: NonNullable<AuthSession>,
) {
  const roles = await prisma.userRole.findMany({
    where: { userId: session.user.id },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const snapshot: SessionSnapshot = {
    account: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
    },
    roles: roles.map((item) => item.role.name),
    permissions: roles.flatMap((item) =>
      item.role.permissions.map((rolePermission) => rolePermission.permission.key),
    ),
    expiresAt: session.session.expiresAt.toISOString(),
    version: 1,
  };

  await setSessionSnapshot(sessionToken, snapshot);
  return snapshot;
}

export async function resolveSessionSnapshotFromHeaders(headerList: Headers) {
  const token = getSessionTokenFromCookieHeader(headerList.get("cookie"));
  if (!token) {
    return null;
  }

  const cached = await getSessionSnapshot(token);
  if (cached) {
    return cached;
  }

  const betterAuthSession = await auth.api.getSession({ headers: headerList });
  if (!betterAuthSession) {
    return null;
  }

  return buildSessionSnapshot(token, betterAuthSession);
}
