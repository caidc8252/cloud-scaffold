import { resolveSessionSnapshotFromHeaders } from "@cloud/auth";
import { getEnv } from "@cloud/config";
import { AppShell } from "@cloud/ui";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function PartnerDashboardPage() {
  const headerList = await headers();
  const session = await resolveSessionSnapshotFromHeaders(headerList);
  if (!session) {
    redirect("/login");
  }

  return (
    <AppShell appName={getEnv().NEXT_PUBLIC_APP_NAME}>
      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <div className="text-sm text-zinc-500">当前账号</div>
          <div className="mt-2 text-xl font-semibold">
            {session.account.name ?? session.account.email}
          </div>
        </section>
        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <div className="text-sm text-zinc-500">角色</div>
          <div className="mt-2 text-xl font-semibold">{session.roles.join(", ") || "未分配"}</div>
        </section>
        <section className="rounded-md border border-zinc-200 bg-white p-5">
          <div className="text-sm text-zinc-500">权限数</div>
          <div className="mt-2 text-xl font-semibold">{session.permissions.length}</div>
        </section>
      </div>
    </AppShell>
  );
}
