import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-zinc-950">401</h1>
        <p className="mt-3 text-sm text-zinc-600">没有当前权限</p>
        <Link className="mt-6 inline-flex text-sm font-medium text-zinc-950" href="/">
          返回首页
        </Link>
      </div>
    </main>
  );
}
