import { LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

const navConfig = [
  { href: "/", icon: LayoutDashboard, labelKey: "dashboard" as const },
  { href: "/users", icon: Users, labelKey: "users" as const },
  { href: "/permissions", icon: ShieldCheck, labelKey: "permissions" as const },
];

export async function AppShell({
  children,
  appName,
  headerTitle,
  headerActions,
}: {
  children: ReactNode;
  appName: string;
  headerTitle?: string;
  headerActions?: ReactNode;
}) {
  const t = await getTranslations("ui.appShell.nav");

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white px-4 py-5 md:block">
        <div className="mb-8 text-lg font-semibold">{appName}</div>
        <nav className="space-y-1">
          {navConfig.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey)}
              </a>
            );
          })}
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-zinc-600">{headerTitle ?? appName}</div>
            {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}
          </div>
        </header>
        <main className="p-5">{children}</main>
      </div>
    </div>
  );
}
