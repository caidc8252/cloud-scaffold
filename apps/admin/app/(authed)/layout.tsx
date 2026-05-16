import { requireSession } from "@cloud/auth";
import { PermissionsProvider } from "@cloud/auth/client";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();
  return (
    <PermissionsProvider permissions={session.permissions}>
      {children}
    </PermissionsProvider>
  );
}
