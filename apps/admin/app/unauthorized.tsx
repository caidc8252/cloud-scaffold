import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <section className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-zinc-950">无权访问 Admin 后台</h1>
        <p className="mt-3 text-sm text-zinc-600">
          当前账号没有 admin 角色，请切换平台管理员账号。
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-medium text-white hover:bg-zinc-800"
        >
          返回登录
        </Link>
      </section>
    </main>
  );
}
