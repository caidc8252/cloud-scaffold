# Session Auth (DAL) — Design Spec

> 2026-05-16 创建。落地 Next.js [DAL 鉴权模式](https://nextjs.org/docs/app/guides/authentication) 在 `apps/admin` 上的 session 闭环：随机 sid + httpOnly cookie，session snapshot（user + permissions）直接存 Redis，TTL 1800s 滚动刷新；页面 / Route Handler / Server Action 共用 `getSession()` / `requireSession()`，请求内用 React `cache()` 去重。

---

## 0. 范围与原则

- **目标 app**：仅 `apps/admin`。partner / merchant 后续按相同模式接入，本 spec 不展开
- **数据模型**：沿用当前简化 `User`（`packages/db/prisma/schema.prisma` 中 `User.permissions String[]`），不引入 Org/Character/Permission（那是另一份 spec 的范畴）
- **不做**：跨 app SSO、refresh token、单 session 限制、批量踢 session（改密码/禁用不主动作废 session）、middleware 内鉴权、JWT、Redis 兜底降级
- **原则**：约定大于配置；session 真值落 Redis；middleware 不读 Redis；鉴权贴近数据（DAL / layout）

---

## 1. 整体架构

```
apps/admin/
├ proxy.ts                          # 现状不动：request-id + matcher，不做鉴权
├ app/
│  ├ layout.tsx                     # 根布局
│  ├ (public)/                      # 不需要 session 的路由组
│  │  ├ login/
│  │  │  ├ page.tsx                 # 登录页（从现 app/login 迁移）
│  │  │  ├ login-form.tsx
│  │  │  └ actions.ts               # loginAction
│  │  └ api/auth/
│  │     ├ public-key/route.ts      # 公钥下发（搬迁）
│  │     └ logout/route.ts          # GET/POST：清 cookie + 删 Redis + redirect /login
│  └ (authed)/                      # 需要 session 的路由组
│     ├ layout.tsx                  # 调 requireSession()（兜底防御）
│     └ page.tsx                    # 原首页迁移
└ e2e/
   └ session.spec.ts                # Playwright

packages/cache/                     # ★ 新建：纯 Redis
└ src/
   ├ index.ts                       # 导出 getRedis / closeRedis / kv
   ├ client.ts                      # ioredis 单例 + closeRedis
   └ kv.ts                          # get<T>/set/del/expire 薄封装

packages/auth/                      # ★ 新建：session 业务
└ src/
   ├ index.ts                       # 公共导出
   ├ session.ts                     # Session 类型、SID_COOKIE、TTL 常量、sessionStore
   ├ dal.ts                         # getSession (cache())、requireSession
   └ actions.ts                     # createSessionFor、destroyCurrentSession
```

**关键不变量：**

- `proxy.ts` 不读 Redis、不做鉴权
- `(authed)/layout.tsx` 中调一次 `requireSession()` 兜底，**但**任何受保护的页面、Route Handler、Server Action 在自身代码里仍独立调 `requireSession()`（layout 不在 Server Action 调用链上）
- `packages/auth` 中带服务端语义的文件顶部 `import "server-only"`（参照 `@cloud/security/server` 的做法），私钥/Redis 客户端永远不会进 client bundle
- 登录页与受保护页通过路由组隔离：未登录默认落 `(public)/login`，登录后落 `(authed)/`
- 现存 `app/login/` 与 `app/page.tsx` 是**迁移**到对应路由组，不留双入口

### 包依赖图（无环）

```
@cloud/config ──► @cloud/cache ──┐
                                  ├──► @cloud/auth ──► apps/admin
@cloud/security ─────────────────────────────────────► apps/admin
@cloud/db ───────────────────────────────────────────► apps/admin
```

`@cloud/auth` **不**依赖 `@cloud/db`：login 入口在 app 里查 User，把字段塞进 `createSessionFor(snapshot)`，auth 包不感知 DB。

---

## 2. `packages/cache` — 纯 Redis

`package.json`：name `@cloud/cache`，`exports` 只暴露 `.`；依赖 `ioredis`、`@cloud/config`。

### 2.1 client.ts

```ts
import Redis from "ioredis";
import { getEnv } from "@cloud/config";

let client: Redis | null = null;

export function getRedis(): Redis {
  if (!client) {
    client = new Redis(getEnv().REDIS_URL, {
      lazyConnect: false,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
    });
  }
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit();
    client = null;
  }
}
```

### 2.2 kv.ts

```ts
import { getRedis } from "./client";

export const kv = {
  async get<T>(key: string): Promise<T | null> {
    const raw = await getRedis().get(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  },
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await getRedis().set(key, payload, "EX", ttlSeconds);
    } else {
      await getRedis().set(key, payload);
    }
  },
  async del(key: string): Promise<void> {
    await getRedis().del(key);
  },
  async expire(key: string, ttlSeconds: number): Promise<void> {
    await getRedis().expire(key, ttlSeconds);
  },
};
```

### 2.3 index.ts

```ts
export { getRedis, closeRedis } from "./client";
export { kv } from "./kv";
```

不带任何 session 语义。任何 key 前缀、TTL、序列化形状都在 `@cloud/auth` 决定。

---

## 3. `packages/auth` — Session 业务

`package.json`：name `@cloud/auth`，`exports` 只暴露 `.`；依赖 `@cloud/cache`、`@cloud/config`、`server-only`、`react`、`next`（peer）。

### 3.1 session.ts

```ts
import "server-only";
import { randomBytes } from "node:crypto";
import { kv } from "@cloud/cache";

export const SID_COOKIE = "sid";
export const SESSION_TTL_SECONDS = 1800;        // Redis 滚动 TTL
export const SID_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12; // cookie 固定 12h

export type Session = {
  userId: string;
  account: string;
  email: string;
  permissions: string[];
  issuedAt: number; // epoch ms，诊断用
};

const sessionKey = (sid: string) => `session:${sid}`;
const generateSid = () => randomBytes(32).toString("base64url");

export const sessionStore = {
  async create(snapshot: Omit<Session, "issuedAt">): Promise<{ sid: string }> {
    const sid = generateSid();
    const session: Session = { ...snapshot, issuedAt: Date.now() };
    await kv.set(sessionKey(sid), session, SESSION_TTL_SECONDS);
    return { sid };
  },
  read(sid: string): Promise<Session | null> {
    return kv.get<Session>(sessionKey(sid));
  },
  touch(sid: string): Promise<void> {
    return kv.expire(sessionKey(sid), SESSION_TTL_SECONDS);
  },
  destroy(sid: string): Promise<void> {
    return kv.del(sessionKey(sid));
  },
};
```

### 3.2 dal.ts

```ts
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SID_COOKIE, sessionStore, type Session } from "./session";

export const getSession = cache(async (): Promise<Session | null> => {
  const store = await cookies();
  const sid = store.get(SID_COOKIE)?.value;
  if (!sid) return null;
  const snapshot = await sessionStore.read(sid);
  if (!snapshot) return null; // sid 不合法 → 让 requireSession 通过 logout route 清 cookie
  await sessionStore.touch(sid); // rolling refresh；cache() 保证每请求一次
  return snapshot;
});

export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/api/auth/logout"); // 走 Route Handler 才能清 cookie
  return s;
}
```

**为何 redirect 到 `/api/auth/logout` 而非 `/login`**：Server Component 渲染时 `cookies()` 是只读的，无法在 DAL 内清失效 sid。统一让 `requireSession` 走 logout Route Handler（Route Handler 可写 cookie），由它清 cookie 再 redirect 到 `/login`。代价：一次额外 302；收益：全路径保证清掉失效 cookie。

`/api/auth/logout` 是约定路径，由 app 自己实现（见 §4.3）。

### 3.3 actions.ts

```ts
import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_TTL_SECONDS,
  SID_COOKIE,
  SID_COOKIE_MAX_AGE_SECONDS,
  sessionStore,
  type Session,
} from "./session";

export async function createSessionFor(
  snapshot: Omit<Session, "issuedAt">,
): Promise<void> {
  const { sid } = await sessionStore.create(snapshot);
  const store = await cookies();
  store.set(SID_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SID_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function destroyCurrentSession(): Promise<void> {
  const store = await cookies();
  const sid = store.get(SID_COOKIE)?.value;
  if (sid) await sessionStore.destroy(sid);
  store.delete(SID_COOKIE);
}
```

**Cookie maxAge 与 Redis TTL 的关系：**
- Redis TTL = 1800s 滚动，是会话真值
- Cookie maxAge = 12h 固定，是运输层
- 活跃用户：Redis 持续续命，12h 内不掉
- 闲置 30 分钟以上：Redis 过期，下一次 `getSession` 拿到 null → `requireSession` 走 logout route 清 cookie → /login
- Cookie 在 12h 后自然失效，作为终极兜底

### 3.4 index.ts

```ts
// 公共导出（包括类型与常量）；服务端实现通过子文件加 server-only 阻断 client 引用
export type { Session } from "./session";
export {
  SID_COOKIE,
  SESSION_TTL_SECONDS,
  SID_COOKIE_MAX_AGE_SECONDS,
  sessionStore,
} from "./session";
export { getSession, requireSession } from "./dal";
export { createSessionFor, destroyCurrentSession } from "./actions";
```

---

## 4. `apps/admin` 改造

### 4.1 路由组迁移（不是新增）

| 原路径 | 新路径 |
|---|---|
| `app/login/page.tsx` | `app/(public)/login/page.tsx` |
| `app/login/login-form.tsx` | `app/(public)/login/login-form.tsx` |
| `app/login/actions.ts` | `app/(public)/login/actions.ts` |
| `app/api/auth/public-key/route.ts` | `app/(public)/api/auth/public-key/route.ts` |
| `app/page.tsx` | `app/(authed)/page.tsx` |

路由组括号不影响 URL：`(public)/login` 仍然是 `/login`，`(authed)/page.tsx` 仍是 `/`。

### 4.2 `(authed)/layout.tsx` — 兜底鉴权钩子

```tsx
import { requireSession } from "@cloud/auth";

export default async function AuthedLayout({ children }: { children: React.ReactNode }) {
  await requireSession();
  return <>{children}</>;
}
```

每个具体页面 / Route Handler / Server Action 在自身代码里**仍要独立调** `requireSession()`，不依赖 layout 兜底（Server Action 不走 layout）。layout 只是 defense-in-depth。

### 4.3 `(public)/api/auth/logout/route.ts`

```ts
import { destroyCurrentSession } from "@cloud/auth";
import { redirect } from "next/navigation";

async function handler() {
  await destroyCurrentSession();
  redirect("/login");
}

export { handler as GET, handler as POST };
```

GET 支持 `requireSession` 触发的 302；POST 支持登录后的"退出登录"表单。两条路径同质化。

### 4.4 `(public)/login/actions.ts` — loginAction 改造（diff）

现有 actions.ts 末尾：

```ts
// 删除
const store = await cookies();
store.set("admin_account", user.account, { ... });
redirect("/");
```

改为：

```ts
// 新增
await createSessionFor({
  userId: user.id,
  account: user.account,
  email: user.email,
  permissions: user.permissions,
});
redirect("/");
```

并把 `prisma.user.findUnique` 的 `select` 由 `{ account, password }` 扩到 `{ id, account, email, password, permissions }`。

### 4.5 `(authed)/page.tsx` — 改为读 session

```tsx
import { getSession } from "@cloud/auth";

export default async function AdminHomePage() {
  const session = await getSession(); // layout 已 require，这里安全断言不 null
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="text-2xl font-semibold">Welcome, {session?.account}</h1>
    </main>
  );
}
```

---

## 5. 数据流

### 5.1 登录

```
浏览器                                    服务器                       Redis
  │                                          │                          │
  ├─ GET /login (public)                     │                          │
  ├─ GET /api/auth/public-key ──────────────►│                          │
  │◄────────── { publicKey } ─────────────── │                          │
  │ rsaEncrypt({password, ts: Date.now()})   │                          │
  ├─ POST loginAction(account, encrypted) ──►│                          │
  │                                          │ rsaDecrypt + assertFresh │
  │                                          │ prisma.user.findUnique   │
  │                                          │ verifyPassword (argon2)  │
  │                                          │ createSessionFor({...})  │
  │                                          ├─ SET session:<sid> EX 1800►
  │                                          │ cookies().set(sid, ..., maxAge=12h)
  │◄────────── 302 / + Set-Cookie ────────── │                          │
  ├─ GET / (authed)/page.tsx ───────────────►│                          │
  │                                          │ requireSession() → getSession()
  │                                          ├─ GET session:<sid> ──────►│
  │                                          │◄── snapshot JSON ────────│
  │                                          ├─ EXPIRE session:<sid> 1800►
  │◄────────── 200 HTML ──────────────────── │                          │
```

### 5.2 读 session（请求内去重）

同一请求中 RSC 树多处调 `getSession()`：

```
page.tsx     ──┐
nested RSC   ──┤── 三处都 await getSession()
sidebar      ──┘
                │
                ▼
         React cache()
                │
                ▼
     一次 Redis GET + 一次 EXPIRE
```

`cache()` 由 React 19 提供，作用域=单次请求 RSC 渲染。Server Action 与对应页面渲染是不同请求，各自独立命中一次。

### 5.3 失效 sid 的清理

```
浏览器（带过期 sid cookie）
  │
  ├─ GET / ─────────────────► (authed)/layout.tsx → requireSession()
  │                              getSession() → sessionStore.read(sid) → null
  │                              return null
  │                            redirect("/api/auth/logout")
  │◄─── 302 /api/auth/logout ───
  │
  ├─ GET /api/auth/logout ──► route handler
  │                            destroyCurrentSession()
  │                              ├─ kv.del(session:<sid>)  // 幂等：已是 0
  │                              └─ cookies().delete(SID_COOKIE)  ★ 清 cookie
  │                            redirect("/login")
  │◄─── 302 /login + Set-Cookie: sid=; Max-Age=0 ───
  │
  ├─ GET /login (public) ────► 正常渲染
```

### 5.4 显式登出

```
"退出登录"按钮 → POST /api/auth/logout → 同 §5.3 后半段
```

---

## 6. 错误处理与边界

| 场景 | 行为 |
|---|---|
| cookie 没 sid | `getSession() → null`，`requireSession()` redirect `/api/auth/logout` → 清空 cookie 后 redirect `/login` |
| cookie 有 sid，Redis 无 snapshot | 同上 |
| sid 有 snapshot 但 JSON 损坏 | `kv.get` 抛 `SyntaxError`，向上冒到 Next.js error boundary（理论上不该发生） |
| Redis 不可用 | ioredis 自身 `maxRetriesPerRequest=3` 重试；超出抛错冒到 error boundary。**不**做"Redis 挂了当作未登录"降级 — 防止攻击者用 Redis DoS 绕鉴权 |
| 同请求并发多次 `getSession` | React `cache()` 去重，单次 Redis 往返 + 单次 touch |
| Server Action 内 `getSession` | Server Action 与触发它的页面是不同请求，各自独立一次 Redis 往返 |
| 改密码 / 禁用用户 | 不主动作废其它 session；旧 session 在 TTL 到期前继续有效。可接受范围内的一致性窗口 |

---

## 7. 测试方案

### 7.1 单元测试（Vitest）

**`packages/cache`：**
- `getRedis()` 单例性
- `kv.get/set/del/expire` 行为正确（针对 `process.env.REDIS_URL` 起的本地 Redis 跑，CI 用 docker-compose）
- `closeRedis()` 正确关闭连接

**`packages/auth/session`：**
- `sessionStore.create` 写入后 `read` 拿到一致 snapshot，且 Redis TTL ≈ 1800
- `sessionStore.touch` 重置 TTL
- `sessionStore.destroy` 之后 `read` 返 null

**`packages/auth/dal`：**
- mock `next/headers.cookies` + `sessionStore`：
  - 无 cookie → null
  - cookie 有但 `store.read` null → null
  - cookie 有且成功 → 返回 snapshot 且 `touch` 调用 1 次
  - 同次请求多次调用 `getSession`（在同一 React 渲染上下文）只触发底层 1 次

**`packages/auth/actions`：**
- `createSessionFor` 写 cookie（maxAge=12h、httpOnly、sameSite=lax）+ 写 Redis
- `destroyCurrentSession` 删 Redis + 删 cookie；无 cookie 时只删 cookie，幂等

`vitest.config.mts` 中既有的 `resolve.alias['server-only']` shim 已经覆盖新包，不需要额外配置。

### 7.2 E2E（Playwright，admin app）

**位置**：`apps/admin/e2e/`，配 `apps/admin/playwright.config.ts`，新增 `pnpm --filter=@cloud/admin e2e`。

**前提**：docker-compose 的 PostgreSQL + Redis 已起，admin seed 账号已注入。

**测例：**
1. **未登录跳转**：清空 cookie 访问 `/` → 落到 `/login`
2. **登录失败留页**：错误密码 → 仍在 `/login`，看到错误提示
3. **登录成功**：正确账号密码 → 落到 `/`，页面渲染包含账号名
4. **显式登出**：登录后 POST `/api/auth/logout`（用 `request.post`）→ 302 到 `/login`；再访问 `/` 仍跳 `/login`
5. **失效 sid 清理**：手工注入 cookie `sid=fake_invalid_sid` 访问 `/` → 跟 302 链最终落在 `/login`，且响应中 `Set-Cookie: sid=; Max-Age=0`，浏览器 context 不再持有该 cookie
6. **session 滚动**：登录后等几秒、再请求一次 `/`、断言 Redis 中 `TTL session:<sid>` 接近 1800（用 `context.storageState` 取 sid 后通过 cache 客户端读 TTL）

现有 `pnpm smoke:auth`（验证 RSA+argon2 通路）**保留**，与 session 是正交的 concern。

### 7.3 静态检查

- TypeScript 类型严格不留 `any`
- 后续补 ESLint 规则禁止 `apps/**` 直接 `import "ioredis"` / `import "@cloud/cache"`，强制走 `@cloud/auth`。本期先约定 + code review，规则补到 follow-up

---

## 8. 渐进式落地步骤

1. **新建 `packages/cache`**：client + kv + 单测
2. **新建 `packages/auth`**：session + dal + actions + 单测；导出 server-only 副作用
3. **admin 路由组迁移**：把 `app/login` 和 `app/api/auth/public-key` 移到 `(public)`；把 `app/page.tsx` 移到 `(authed)`；新增 `(authed)/layout.tsx`、`(public)/api/auth/logout/route.ts`
4. **改 loginAction**：替换 `admin_account` cookie 写法为 `createSessionFor`，并扩 select 字段
5. **改 admin home**：用 `getSession()` 读账号
6. **Playwright 接入**：装依赖、写 `playwright.config.ts`、6 个测例
7. **更新文档**：README 的 Auth 节追加 session 说明；DEV_NOTE.md 新增 "Session 与 Redis" 节，记下 cookie/Redis TTL 解耦与 logout-route 多一跳的决策依据

---

## 9. 未来扩展（不在本期范围）

- partner / merchant 接入：cookie 名仍叫 `sid`，但 Redis key 前缀加 app（`admin:session:<sid>` / `partner:session:<sid>`）防 key 冲突。届时 `@cloud/auth` 加 `createSessionStore({ app })` 工厂
- 改密码 / 禁用即时作废全部 session：加 `user:<userId>:sids` SET 索引，改写时 `SMEMBERS` 后批量 del。本期不做
- 切换到 Org/Character 模型：snapshot 加 `orgId`、`characters[]` 字段；DAL 与 sessionStore 结构不变，只是 Session 类型扩字段
- `@cloud/permissions` 包：在 snapshot.permissions 基础上提供 `hasPermission(perm)` / `requirePermission(perm)` 工具。本期权限检查由调用方自己 `session.permissions.includes(...)`
