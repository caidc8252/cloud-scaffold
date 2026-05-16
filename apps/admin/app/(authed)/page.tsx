import { requireSession } from "@cloud/auth";
import { DemoButtons } from "./demo-buttons";

export default async function AdminHomePage() {
  const session = await requireSession();

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-zinc-50 px-6 py-10">
      <header className="flex w-full max-w-3xl items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {session.account}</h1>
          <p className="text-xs text-zinc-500">
            permissions: {session.permissions.join(", ") || "(none)"}
          </p>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-100"
          >
            退出登录
          </button>
        </form>
      </header>

      <DemoButtons />
    </main>
  );
}
