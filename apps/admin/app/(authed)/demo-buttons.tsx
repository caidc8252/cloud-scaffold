"use client";

import { useState, useTransition } from "react";
import { Can } from "@cloud/auth/client";
import { RequestError, request } from "@cloud/request/client";
import { Button } from "@cloud/ui";
import { allowedAction, forbiddenAction } from "./demo-actions";

type ApiOutcome = {
  status: number;
  body: unknown;
};

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-700">{title}</h2>
      {children}
    </section>
  );
}

function Pre({ value }: { value: unknown }) {
  return (
    <pre className="overflow-auto rounded-md bg-zinc-50 p-3 text-xs text-zinc-700">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function DemoButtons() {
  const [apiAllowed, setApiAllowed] = useState<ApiOutcome | null>(null);
  const [apiForbidden, setApiForbidden] = useState<ApiOutcome | null>(null);
  const [actionResult, setActionResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function callApi(
    url: string,
    setter: (v: ApiOutcome) => void,
  ): Promise<void> {
    try {
      const sb = await request.get<unknown>(url);
      setter({ status: 200, body: sb });
    } catch (err) {
      if (err instanceof RequestError) {
        if (err.status === 401) return; // 浏览器跳 logout
        setter({
          status: err.status,
          body: err.body ?? { code: err.code },
        });
        return;
      }
      throw err;
    }
  }

  return (
    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-2">
      <Card title="① 前端组件 · 有权限 (user.manage)">
        <Can
          all={["user.manage"]}
          fallback={
            <p className="text-xs text-zinc-500">不应该看到这里</p>
          }
        >
          <Button variant="primary">看得见我（有 user.manage）</Button>
        </Can>
      </Card>

      <Card title="② 前端组件 · 无权限 (user.export)">
        <Can
          all={["user.export"]}
          fallback={
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              按钮被 &lt;Can&gt; 隐藏：缺少 user.export
            </p>
          }
        >
          <Button variant="primary">不应该看到我</Button>
        </Can>
      </Card>

      <Card title="③ API · 后端有权限 (user.manage)">
        <Button
          variant="secondary"
          onClick={() => {
            void callApi("/api/demo/allowed", setApiAllowed);
          }}
        >
          GET /api/demo/allowed
        </Button>
        {apiAllowed ? <Pre value={apiAllowed} /> : null}
      </Card>

      <Card title="④ API · 后端无权限 (user.export)">
        <Button
          variant="secondary"
          onClick={() => {
            void callApi("/api/demo/forbidden", setApiForbidden);
          }}
        >
          GET /api/demo/forbidden
        </Button>
        {apiForbidden ? <Pre value={apiForbidden} /> : null}
      </Card>

      <Card title="⑤ Server Action · 有权限 (user.manage)">
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const r = await allowedAction();
              setActionResult(r.message);
            });
          }}
        >
          调用 allowedAction
        </Button>
        {actionResult ? (
          <p className="rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            {actionResult}
          </p>
        ) : null}
      </Card>

      <Card title="⑥ Server Action · 无权限 (user.export)">
        <Button
          variant="secondary"
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              await forbiddenAction();
            });
          }}
        >
          调用 forbiddenAction（应跳 /403）
        </Button>
        <p className="text-xs text-zinc-500">
          requirePermissions 抛 redirect 到 /403。
        </p>
      </Card>
    </div>
  );
}
