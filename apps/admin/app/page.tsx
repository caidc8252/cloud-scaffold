import { hasSessionRole, resolveSessionSnapshotFromHeaders } from "@cloud/auth";
import { AppShell } from "@cloud/ui";
import { headers } from "next/headers";
import { redirect, unauthorized } from "next/navigation";
import { LogoutButton } from "./_components/logout-button";

export default async function AdminHomePage() {
  const session = await resolveSessionSnapshotFromHeaders(await headers());
  if (!session) {
    redirect("/login");
  }

  if (!hasSessionRole(session, "admin")) {
    unauthorized();
  }

  return (
    <AppShell appName="Cloud Admin" headerTitle="Admin Console" headerActions={<LogoutButton />}>
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <div className="text-sm text-zinc-500">当前账号</div>
          <div className="mt-2 text-xl font-semibold">
            {session.account.name ?? session.account.email}
          </div>
        </section>
        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <div className="text-sm text-zinc-500">角色</div>
          <div className="mt-2 text-xl font-semibold">{session.roles.join(", ")}</div>
        </section>
        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <div className="text-sm text-zinc-500">权限数</div>
          <div className="mt-2 text-xl font-semibold">{session.permissions.length}</div>
        </section>
      </div>
    </AppShell>
  );
}
