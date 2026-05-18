"use client";

import {
  startTransition,
  useActionState,
  useState,
  type FormEvent,
} from "react";
import { useTranslations } from "next-intl";
import { RequestError, request } from "@cloud/request/client";
import { rsaEncrypt } from "@cloud/security/client";
import { Button, Input, Label } from "@cloud/ui";
import { parseAllErrors } from "../../../lib/schema";
import { loginAction, type LoginState } from "./actions";
import { loginFormSchema, type LoginErrorKey } from "./schema/login";

const initialState: LoginState = {};

let cachedPublicKey: string | null = null;

async function getPublicKey(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey;
  const { data } = await request.get<{ publicKey: string }>(
    "/api/auth/public-key",
  );
  cachedPublicKey = data.publicKey;
  return cachedPublicKey;
}

type ClientErrors = { fieldErrors: Record<string, string[]>; formErrors: string[] };
const emptyErrors: ClientErrors = { fieldErrors: {}, formErrors: [] };

export function LoginForm() {
  const t = useTranslations("auth.login");
  const tRoot = useTranslations();
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [clientErrors, setClientErrors] = useState<ClientErrors>(emptyErrors);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setClientErrors(emptyErrors);

    const fd = new FormData(event.currentTarget);
    const parsed = parseAllErrors(loginFormSchema, {
      account: fd.get("account"),
      password: fd.get("password"),
    });
    if (!parsed.ok) {
      const translatedFieldErrors: Record<string, string[]> = {};
      for (const [field, keys] of Object.entries(parsed.fieldErrors)) {
        translatedFieldErrors[field] = keys.map((k) =>
          t(`errors.${k as LoginErrorKey}`),
        );
      }
      setClientErrors({
        fieldErrors: translatedFieldErrors,
        formErrors: parsed.formErrors.map((k) =>
          t(`errors.${k as LoginErrorKey}`),
        ),
      });
      return;
    }

    try {
      const publicKey = await getPublicKey();
      const payload = JSON.stringify({
        password: parsed.data.password,
        ts: Date.now(),
      });
      const encrypted = await rsaEncrypt(payload, publicKey);
      const submission = new FormData();
      submission.set("account", parsed.data.account);
      submission.set("encrypted", encrypted);
      startTransition(() => {
        formAction(submission);
      });
    } catch (err) {
      // 401 由 wrapper 自动 replace 到 /api/auth/logout，UI 静默；
      // 登录页本身不会拿到 401（未登录访问 /login 是允许的），保留分支以防异常。
      if (err instanceof RequestError && err.status === 401) return;
      const msg =
        err instanceof RequestError
          ? (err.body?.message ?? tRoot(`request.errors.${err.code}`))
          : err instanceof Error
            ? err.message
            : t("errors.encryptFailed");
      setClientErrors({ fieldErrors: {}, formErrors: [msg] });
    }
  }

  // 服务端错误覆盖 client 错误（最后一次操作的错误才相关）
  const fieldErrors = state.fieldErrors ?? clientErrors.fieldErrors;
  const formErrors = state.formErrors ?? clientErrors.formErrors;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex w-80 flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account">{t("account")}</Label>
        <Input
          id="account"
          name="account"
          autoComplete="username"
          aria-invalid={(fieldErrors.account?.length ?? 0) > 0}
        />
        <FieldErrors messages={fieldErrors.account} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={(fieldErrors.password?.length ?? 0) > 0}
        />
        <FieldErrors messages={fieldErrors.password} />
      </div>
      {formErrors.length > 0 ? (
        <ul aria-live="polite" className="space-y-0.5 text-sm text-red-600">
          {formErrors.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}

function FieldErrors({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <ul aria-live="polite" className="space-y-0.5 text-xs text-red-600">
      {messages.map((m, i) => (
        <li key={i}>{m}</li>
      ))}
    </ul>
  );
}
