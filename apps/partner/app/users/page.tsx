import { auth, buildSessionSnapshot, getSessionTokenFromCookieHeader } from "@cloud/auth";
import { getSessionSnapshot } from "@cloud/cache";
import { AppShell } from "@cloud/ui";
import { prisma } from "@cloud/db";
import { PermissionChecker } from "@cloud/permissions";
import { headers } from "next/headers";
import { unauthorized } from "next/navigation";

export default async function UsersPage() {
  const headerList = await headers();
  const token = getSessionTokenFromCookieHeader(headerList.get("cookie"));
  if (!token) {
    unauthorized();
  }

  let session = await getSessionSnapshot(token);
  if (!session) {
    const betterAuthSession = await auth.api.getSession({ headers: headerList });
    if (!betterAuthSession) {
      unauthorized();
    }
    session = await buildSessionSnapshot(token, betterAuthSession);
  }

  const permissions = new PermissionChecker(session);
  if (!permissions.can("user", "read")) {
    unauthorized();
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <AppShell appName="Cloud Partner">
      <div className="rounded-md border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <h1 className="text-lg font-semibold">用户</h1>
        </div>
        <div className="divide-y divide-zinc-100">
          {users.map((user) => (
            <div key={user.id} className="grid gap-1 px-5 py-4 md:grid-cols-3">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-zinc-600">{user.email}</div>
              <div className="text-sm text-zinc-500">{user.createdAt.toLocaleString("zh-CN")}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
