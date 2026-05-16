# 设计：`@cloud/auth` 细粒度权限控制

- 日期：2026-05-16
- 范围：在现有 session 鉴权基础上，给 `packages/auth` 加细粒度权限（permission）守卫，覆盖后端（page / Server Action / Route Handler）与前端（条件渲染 / hook）。
- 状态：草案，待实施。

---

## 1. 背景与约束

### 现状
- `Session.permissions: string[]` 已在登录瞬间从 `User.permissions String[]` 快照进 Redis。
- DAL 单点 `getSession()`（React `cache()` 包裹）和 `requireSession()` 已就位；后者无 session 时 `redirect("/api/auth/logout")`。
- `(authed)/layout.tsx` 已经在每个 app 兜底 session。
- 中间件 `proxy.ts` 不做鉴权（DEV_NOTE 既定约定）。

### 约束
- **不动 DB schema**：复用 `User.permissions: string[]` 与 `Session.permissions: string[]`。
- **不动 session 生命周期**：30 分钟 Redis 滚动 TTL + 12h cookie 不变；权限变更在 TTL 内不立即生效，与"改密码不踢 session"一致。
- **不动 `proxy.ts`**：所有权限判断贴近数据，在 layout / page / Server Action / Route Handler 自身代码里。
- **向后兼容**：现有 `@cloud/auth` import 路径不破坏。

---

## 2. 决策摘要

| 维度 | 决策 |
|---|---|
| 匹配语义 | 纯精确字符串匹配，不引入通配 / 不引入 resource+action 结构 |
| 组合语义 | 同时提供 `all`（全部命中）和 `any`（任一命中），传入对象 `{ all?, any? }` |
| HTTP 状态码 | 无 session → 401；有 session 缺权限 → 403 |
| Route Handler 入口 | 仅低阶 `assertPermissions(...)` 抛 `AuthzError`；业务自己 try/catch 转 Response。不内置 `withApiAuth` 包装器（YAGNI） |
| Page / Server Action 入口 | `requirePermissions(...)`，失败 `redirect("/403")`；无 session 时沿用 `redirect("/api/auth/logout")` |
| 错误页路由 | 每个 app 自带 `/403` 页面，不保留 `/401`（未认证统一走 logout → /login） |
| 前端组件 | 同时提供 server 侧条件函数 + client 侧 `<Can>` / `useCan` / `usePermissions` |
| 包结构 | `@cloud/auth` 拆 subpath：默认 = server、`./server` = 显式 server、`./client` = client 入口 |

---

## 3. 架构

### 包结构

```
packages/auth/
  src/
    index.ts                 # = server 入口，向后兼容
    server/
      index.ts               # re-export
      session.ts             # 现有，不动
      dal.ts                 # 现有
      actions.ts             # 现有
      permissions.ts         # 新：hasPermissions / assertPermissions / requirePermissions
      errors.ts              # 新：AuthzError
    client/
      index.ts               # "use client" 边界
      provider.tsx           # <PermissionsProvider>
      use-permission.ts      # usePermissions / useCan
      can.tsx                # 客户端 <Can>
  package.json exports:
    "."         → ./src/index.ts            # = server，保持现有
    "./server"  → ./src/server/index.ts
    "./client"  → ./src/client/index.ts
```

- `src/index.ts` 直接 `export * from "./server/index.ts"`，**现有调用方零改动**（`requireSession`、`createSessionFor` 等仍从 `@cloud/auth` 默认导出可取）。
- `src/server/` 顶部统一 `import "server-only"`；`src/client/` 顶部统一 `"use client"`。
- exact-match 判断逻辑在 server 与 client 各自内联（每端两行 `every` / `some`），不抽公共模块。
- 应用层只走 `@cloud/auth` / `@cloud/auth/client`，不深入子路径。

---

## 4. 公开 API

### 4.1 Server 侧（`@cloud/auth` 默认入口）

```ts
// errors.ts
export class AuthzError extends Error {
  constructor(
    readonly status: 401 | 403,
    readonly code: "unauthenticated" | "forbidden",
    readonly missing?: string[],
  );
}

// permissions.ts
type PermCheck = { all?: string[]; any?: string[] };

// 纯判断，不读 session、不跳转、不抛错
export function hasPermissions(have: string[], check: PermCheck): boolean;

// 读 session + 判断。无 session → AuthzError(401); 有 session 缺权限 → AuthzError(403)
export async function assertPermissions(check: PermCheck): Promise<Session>;

// 读 session + 判断。失败：无 session → redirect('/api/auth/logout')；缺权限 → redirect('/403')
export async function requirePermissions(check: PermCheck): Promise<Session>;
```

匹配规则（内联在 `permissions.ts`）：

```ts
function hasPermissions(have, check) {
  const all = check.all ?? [];
  const any = check.any ?? [];
  const okAll = all.every(p => have.includes(p));
  const okAny = any.length === 0 || any.some(p => have.includes(p));
  return okAll && okAny;
}
```

边界：

- `check = {}` → 视作"任意已登录即可通过"；
- `check.all = []` 视作未提供；
- `check.any = []` 视作未提供（不是"全部拒绝"）。

### 4.2 Client 侧（`@cloud/auth/client`）

```ts
// provider.tsx
export function PermissionsProvider(props: {
  permissions: string[];
  children: React.ReactNode;
}): JSX.Element;

// use-permission.ts
export function usePermissions(): string[]; // 在 Provider 外调用 → throw
export function useCan(check: PermCheck): boolean;

// can.tsx
export function Can(props: {
  all?: string[];
  any?: string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}): JSX.Element;
```

- `<Can>` 不满足条件：有 `fallback` 渲染 fallback，否则渲染 `null`。
- `useCan` 永远返 `boolean`，不抛错。
- `usePermissions` 在 Provider 外调用抛错（让误用早暴露）。

---

## 5. 集成路径

### 5.1 每个 app 在 `(authed)/layout.tsx` 注入 Provider

```tsx
import { requireSession } from "@cloud/auth";
import { PermissionsProvider } from "@cloud/auth/client";

export default async function AuthedLayout({ children }) {
  const session = await requireSession();
  return (
    <PermissionsProvider permissions={session.permissions}>
      {children}
    </PermissionsProvider>
  );
}
```

`session.permissions` 序列化进 client bundle 是字符串数组，几十字节级。

### 5.2 Page / Layout / Server Action

```ts
// page.tsx
await requirePermissions({ all: ["user.read"] });

// Server Action
"use server";
export async function deleteUser(id: string) {
  await requirePermissions({ any: ["user.write", "user.admin"] });
  ...
}
```

### 5.3 Route Handler

```ts
import { assertPermissions, AuthzError } from "@cloud/auth";

export async function GET() {
  try {
    await assertPermissions({ all: ["user.read"] });
  } catch (e) {
    if (e instanceof AuthzError) {
      return Response.json(
        { code: e.code, missing: e.missing },
        { status: e.status },
      );
    }
    throw e;
  }
  return Response.json({ data: ... });
}
```

### 5.4 客户端按钮 / 菜单显隐

```tsx
"use client";
import { Can, useCan } from "@cloud/auth/client";

<Can all={["user.write"]} fallback={<span>无权限</span>}>
  <Button>编辑用户</Button>
</Can>

const canExport = useCan({ any: ["user.export", "user.admin"] });
```

### 5.5 每个 app 加 `/403` 页面

```
apps/<app>/app/(public)/403/page.tsx
```

UI 自定义（每个 app 可独立设计），但都属于 `(public)` 组——不需要 session 即可访问，避免循环跳。

---

## 6. 数据流

### 单次请求链路

```
浏览器请求 (含 sid cookie)
  │
  ▼
Next.js RSC / Route Handler
  │
  ▼
requirePermissions / assertPermissions
  │
  ├─► getSession()  ← React cache()
  │     ├─► cookies().get("sid")
  │     ├─► sessionStore.read(sid)  → Redis
  │     └─► sessionStore.touch(sid) → Redis
  │
  └─► hasPermissions(session.permissions, check)
        │
   ─────┴─────
   ✓ 通过                 ✗ 失败
   │                      │
   │                      ├── 无 session → AuthzError(401)
   │                      │     requirePermissions → redirect("/api/auth/logout")
   │                      │     assertPermissions  → throw
   │                      │
   │                      └── 缺权限 → AuthzError(403, missing=[...])
   │                            requirePermissions → redirect("/403")
   │                            assertPermissions  → throw
   ▼
RSC 渲染 → <PermissionsProvider permissions=session.permissions>
  │
  ▼
客户端组件树：<Can> / useCan → 纯前端判断，不再触 Redis
```

### 边界约定

1. **不重新查 DB**：权限读 session 快照，TTL 内权限变更不立即生效（一致性窗口 ≤ 30 分钟）。
2. **`getSession()` 在守卫链中复用**：`requirePermissions` / `assertPermissions` 内部走 `getSession()`，依赖 React `cache()` 去重 Redis。
3. **`proxy.ts` 不参与**：判断只发生在 layout/page/Server Action/Route Handler。
4. **客户端 permissions 是只读快照**：Provider 不提供 setter / 不轮询 / 不订阅。要刷新 = 重登。

---

## 7. 错误处理

### `AuthzError` 形状

只承载：HTTP 状态、code 字符串（机器可识别）、缺失权限列表（运维定位）。**不含**文案——UI 责任。

### Route Handler 模板

样板五行 try/catch 在 §5.3 已示例。N 个 handler 内重复 → 后续再补 `withApiAuth`。本期不预先抽象。

### Server Action

- 默认形态：走 `requirePermissions` → redirect。Next.js 通过抛 `NEXT_REDIRECT` 跳转，调用方无需 try/catch；`useActionState` 不会收到错误，浏览器被路由跳走。
- 少数派"留在原页显示无权限"：调用方手写 `assertPermissions` + catch → `{ error: "..." }`，不内置 helper。

### 误用快速暴露

- 在 page / Server Action 用 `assertPermissions` 又不 catch → 500 / 控制台暴露。
- 客户端不暴露 `AuthzError`，仅暴露 hook / `<Can>`，无法误抛。
- `usePermissions` 在 Provider 外调用直接 throw，开发期硬错。

---

## 8. 测试

### 8.1 单元测试（vitest，`packages/auth/test/`）

| 文件 | 覆盖 |
|---|---|
| `test/permissions.test.ts` | `hasPermissions`：all 全命中 / all 缺一 / any 命中一个 / any 全缺 / `{}` 空 check / 空 have |
| `test/assert.test.ts` | `assertPermissions`：无 session 抛 401 / 缺权限抛 403（含 missing 字段）/ 通过返 session（mock `getSession`） |
| `test/require.test.ts` | `requirePermissions`：无 session 跳 `/api/auth/logout` / 缺权限跳 `/403` / 通过返 session（mock `redirect`） |
| `test/errors.test.ts` | `AuthzError` 三个字段、`name` |

### 8.2 客户端单元测试（vitest + @testing-library/react）

| 文件 | 覆盖 |
|---|---|
| `test/can.test.tsx` | `<Can>`：all 命中渲染 children / 缺权限渲染 fallback / 缺权限无 fallback 渲染 null / `any` 命中 / 嵌套 |
| `test/use-permission.test.tsx` | `useCan` 返 true/false / `usePermissions` 在 Provider 外 throw |

> 现有 `vitest.config.mts` 已把 `server-only` alias 成 noop。client 入口里不加 `"use server"`，测试环境直接 import 即可。

### 8.3 E2E（admin，`apps/admin/e2e/`）

新增 `e2e/permissions.spec.ts`：

1. 普通用户访问需要 `user.admin` 的页面 → 落到 `/403`。
2. 管理员访问同页面 → 正常渲染。
3. 普通用户调需要 `user.admin` 的 Route Handler → 收到 403 JSON `{ code: "forbidden", missing: ["user.admin"] }`。
4. `<Can>` 在导航栏显隐：普通用户登录后不可见管理员入口。

种子数据：复用现有 admin seed（已有 `permissions`），追加一个低权限测试账号。

### 8.4 Smoke

现有 `pnpm smoke:auth` 不动；permissions 与 RSA/argon2 通路正交。

---

## 9. 实施清单（粗）

实施 plan 在 writing-plans 阶段细化。预期顺序：

1. `packages/auth/src/server/errors.ts`、`permissions.ts`
2. `packages/auth` 改 `package.json` exports + 把现有 `session.ts/dal.ts/actions.ts` 移到 `src/server/`
3. 单测 §8.1
4. `packages/auth/src/client/*`
5. 客户端单测 §8.2
6. admin 的 `(authed)/layout.tsx` 接 Provider
7. admin 的 `(public)/403/page.tsx`
8. E2E §8.3
9. 应用层选一个真实功能（例如用户管理）作为首批 permission 落地点验证

---

## 10. 显式不做的（YAGNI）

- 通配 / hierarchical 权限（`user.*`）。
- 资源 + 动作结构化（`{ resource, action }`）。
- `withApiAuth` 包装器。
- session 主动作废 / "改权限立即踢" / `user:<id>:sids` 反查。
- 客户端权限轮询 / setter / 订阅。
- `proxy.ts` 参与鉴权。
- `<Can>` 的 server 版（直接用 `hasPermissions` + 三元渲染足够）。
- 共享 `match` 工具模块（每端两行内联）。
- 共享 `UnauthorizedPage` UI 组件（每个 app 自带 `/403`）。
