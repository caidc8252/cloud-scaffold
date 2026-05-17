"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createSessionFor } from "@cloud/auth";
import { getEnv } from "@cloud/config";
import { prisma } from "@cloud/db";
import {
  assertFreshTimestamp,
  rsaDecrypt,
  verifyPassword,
} from "@cloud/security/server";

export type LoginState = { error?: string };

type LoginPayload = { password?: unknown; ts?: unknown };

function parsePayload(plaintext: string): { password: string; ts: number } {
  let parsed: LoginPayload;
  try {
    parsed = JSON.parse(plaintext) as LoginPayload;
  } catch {
    throw new Error("payload is not valid JSON");
  }
  if (typeof parsed.password !== "string" || typeof parsed.ts !== "number") {
    throw new Error("payload missing password or ts");
  }
  return { password: parsed.password, ts: parsed.ts };
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const t = await getTranslations("auth.login.errors");

  const account = String(formData.get("account") ?? "").trim();
  const encrypted = String(formData.get("encrypted") ?? "");

  if (!account || !encrypted) {
    return { error: t("missing") };
  }

  let password: string;
  try {
    const plaintext = rsaDecrypt(encrypted, getEnv().LOGIN_PRIVATE_KEY_PEM);
    const payload = parsePayload(plaintext);
    assertFreshTimestamp(payload.ts);
    password = payload.password;
  } catch {
    return { error: t("invalidRequest") };
  }

  const user = await prisma.user.findUnique({
    where: { account },
    select: {
      id: true,
      account: true,
      email: true,
      password: true,
      permissions: true,
    },
  });

  if (!user || !(await verifyPassword(user.password, password))) {
    return { error: t("invalidCredentials") };
  }

  await createSessionFor({
    userId: user.id,
    account: user.account,
    email: user.email,
    permissions: user.permissions,
  });

  redirect("/");
}
