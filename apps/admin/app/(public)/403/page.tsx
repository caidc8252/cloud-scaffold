import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function ForbiddenPage() {
  const t = await getTranslations("auth.forbidden");
  const tc = await getTranslations("common");
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-semibold">{t("title")}</h1>
      <p className="text-sm text-zinc-600">{t("body")}</p>
      <Link
        href="/"
        className="rounded-md border px-4 py-2 text-sm hover:bg-zinc-50"
      >
        {tc("backHome")}
      </Link>
    </main>
  );
}
