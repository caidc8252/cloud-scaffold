import { LoginForm } from "../_components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <section className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-zinc-950">登录 Partner 后台</h1>
          <p className="mt-2 text-sm text-zinc-600">使用邮箱密码或 Google 账号进入控制台。</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
