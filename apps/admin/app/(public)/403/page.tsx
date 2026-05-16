import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold">403 无权限</h1>
      <p className="text-sm text-zinc-600">
        你的账号没有访问该资源的权限。如需开通，请联系管理员。
      </p>
      <Link
        href="/"
        className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-50"
      >
        返回首页
      </Link>
    </main>
  );
}
