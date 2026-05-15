"use client";

import { useActionState } from "react";
import { Button, Input, Label } from "@cloud/ui";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="flex w-80 flex-col gap-4">
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
      {state.error ? (
        <p className="text-sm text-red-600" aria-live="polite">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "登录中..." : "登录"}
      </Button>
    </form>
  );
}
