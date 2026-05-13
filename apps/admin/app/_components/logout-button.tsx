"use client";

import { Button } from "@cloud/ui";
import { createAuthClient } from "better-auth/react";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const authClient = createAuthClient();

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const logout = async () => {
    setIsPending(true);
    const result = await authClient.signOut();
    setIsPending(false);

    if (result.error) {
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <Button disabled={isPending} type="button" variant="ghost" onClick={logout}>
      <LogOut className="h-4 w-4" />
      退出登录
    </Button>
  );
}
