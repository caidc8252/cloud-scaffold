"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@cloud/db";

export type LoginState = { error?: string };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const account = String(formData.get("account") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!account || !password) {
    return { error: "请输入账号和密码" };
  }

  const user = await prisma.user.findUnique({
    where: { account },
    select: { account: true, password: true },
  });

  if (!user || user.password !== password) {
    return { error: "账号或密码错误" };
  }

  const store = await cookies();
  store.set("admin_account", user.account, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/");
}
