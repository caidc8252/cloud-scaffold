import { AppShell } from "@cloud/ui";

export default function MerchantHomePage() {
  return (
    <AppShell appName="Cloud Merchant">
      <section className="rounded-md border border-zinc-200 bg-white p-5">
        <h1 className="text-lg font-semibold">Merchant Console</h1>
        <p className="mt-2 text-sm text-zinc-600">商户后台骨架已接入 monorepo 公共 UI。</p>
      </section>
    </AppShell>
  );
}
