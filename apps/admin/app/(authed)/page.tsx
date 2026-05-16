import { getSession } from "@cloud/auth";

export default async function AdminHomePage() {
  const session = await getSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Welcome, {session?.account}</h1>
      <form action="/api/auth/logout" method="POST">
        <button
          type="submit"
          className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
        >
          退出登录
        </button>
      </form>
    </main>
  );
}
