"use client";

import {
  startTransition,
  useActionState,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { rsaEncrypt } from "@cloud/security/client";
import { Button, Input, Label } from "@cloud/ui";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

let cachedPublicKey: string | null = null;

async function getPublicKey(): Promise<string> {
  if (cachedPublicKey) return cachedPublicKey;
  const res = await fetch("/api/auth/public-key");
  if (!res.ok) {
    throw new Error("failed to fetch login public key");
  }
  const json = (await res.json()) as { publicKey: string };
  cachedPublicKey = json.publicKey;
  return cachedPublicKey;
}

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);
  const [encryptError, setEncryptError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEncryptError(null);
    const form = event.currentTarget;
    const fd = new FormData(form);
    const account = String(fd.get("account") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!account || !password) {
      setEncryptError("请输入账号和密码");
      return;
    }
    try {
      const publicKey = await getPublicKey();
      const payload = JSON.stringify({ password, ts: Date.now() });
      const encrypted = await rsaEncrypt(payload, publicKey);
      const submission = new FormData();
      submission.set("account", account);
      submission.set("encrypted", encrypted);
      startTransition(() => {
        formAction(submission);
      });
    } catch (err) {
      setEncryptError(err instanceof Error ? err.message : "加密失败，请重试");
    }
  }

  const message = encryptError ?? state.error;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="flex w-80 flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account">账号</Label>
        <Input id="account" name="account" autoComplete="username" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {message ? (
        <p className="text-sm text-red-600" aria-live="polite">
          {message}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
