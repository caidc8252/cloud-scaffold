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
import { parseAllErrors } from "../../../lib/schema";
import {
  loginActionInputSchema,
  loginPayloadSchema,
  type LoginErrorKey,
} from "./schema/login";

export type LoginState = {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const t = await getTranslations("auth.login.errors");
  const translate = (keys: string[]) =>
    keys.map((k) => t(k as LoginErrorKey));

  // 1. 入参形状校验：account + encrypted 必填。失败回所有 issue。
  const input = parseAllErrors(loginActionInputSchema, {
    account: formData.get("account"),
    encrypted: formData.get("encrypted"),
  });
  if (!input.ok) {
    const fieldErrors: Record<string, string[]> = {};
    for (const [field, keys] of Object.entries(input.fieldErrors)) {
      fieldErrors[field] = translate(keys);
    }
    return {
      fieldErrors,
      formErrors: translate(input.formErrors),
    };
  }

  // 2. RSA 解密 + 解密后形状校验 + ts 新鲜度
  let payload: { password: string; ts: number };
  try {
    const plaintext = rsaDecrypt(
      input.data.encrypted,
      getEnv().LOGIN_PRIVATE_KEY_PEM,
    );
    const parsed = parseAllErrors(loginPayloadSchema, JSON.parse(plaintext));
    if (!parsed.ok) {
      return { formErrors: [t("invalidRequest")] };
    }
    assertFreshTimestamp(parsed.data.ts);
    payload = parsed.data;
  } catch {
    return { formErrors: [t("invalidRequest")] };
  }

  // 3. 鉴权
  const user = await prisma.user.findUnique({
    where: { account: input.data.account },
    select: {
      id: true,
      account: true,
      email: true,
      password: true,
      permissions: true,
    },
  });

  if (!user || !(await verifyPassword(user.password, payload.password))) {
    return { formErrors: [t("invalidCredentials")] };
  }

  await createSessionFor({
    userId: user.id,
    account: user.account,
    email: user.email,
    permissions: user.permissions,
  });

  redirect("/");
}
