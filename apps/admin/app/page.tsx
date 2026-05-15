import { cookies } from "next/headers";

export default async function AdminHomePage() {
  const store = await cookies();
  const account = store.get("admin_account")?.value;

  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">
        {account ? `Welcome, ${account}` : "Welcome"}
      </h1>
    </main>
  );
}
