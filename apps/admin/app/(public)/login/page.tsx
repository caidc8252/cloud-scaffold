import { getTranslations } from "next-intl/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const t = await getTranslations("auth.login");
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-6 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold">{t("title")}</h1>
        <LoginForm />
      </div>
    </main>
  );
}
