import { LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/permissions", label: "Permissions", icon: ShieldCheck },
];

export function AppShell({
  children,
  appName,
  headerTitle = "Partner Console",
  headerActions,
}: {
  children: ReactNode;
  appName: string;
  headerTitle?: string;
  headerActions?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-zinc-200 bg-white px-4 py-5 md:block">
        <div className="mb-8 text-lg font-semibold">{appName}</div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.href}
                href={item.href}
                className="flex h-10 items-center gap-3 rounded-md px-3 text-sm text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </a>
            );
          })}
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 px-5 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-zinc-600">{headerTitle}</div>
            {headerActions ? <div className="flex items-center gap-2">{headerActions}</div> : null}
          </div>
        </header>
        <main className="p-5">{children}</main>
      </div>
    </div>
  );
}
