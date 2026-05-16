import { requireSession } from "@cloud/auth";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSession();
  return <>{children}</>;
}
