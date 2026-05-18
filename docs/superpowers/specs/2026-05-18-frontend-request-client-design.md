# @cloud/request/client 设计 — 前端 HTTP 壳 + 全局 401

> 状态：spec(draft)
> 日期：2026-05-18
> 范围：扩展 `@cloud/request` 包，新增 `./client` 子路径；admin 接入。partner / merchant 后续复制。

---

## 1. 背景与目标

`@cloud/request` 现状只覆盖 **服务端响应外壳**（`successResponse / errorResponse / 4xx helpers`，约定 `{ data, pager? }` / `{ message }` + HTTP status）。前端则全部裸 `fetch`：

- `apps/admin/app/(public)/login/login-form.tsx` 手动 `json.data.publicKey`
- `apps/admin/app/(authed)/demo-buttons.tsx` 手动 `res.json()` + `res.status`

缺：

- 统一拆 `{ data }`
- 统一 401 自动登出（与后端 DAL 的 `/api/auth/logout` 出口对齐）
- 统一 `RequestError` 异常形态
- 网络/解析异常的本地化兜底文案

本期产出 `@cloud/request/client` 薄壳 + admin 接入；不引入 TanStack Query / SWR 等数据层。

## 2. 决策汇总

| 维度 | 决策 | 备选 / 理由 |
|---|---|---|
| 范围 | 薄 fetch 壳 + 全局 401 | 不引入 client 状态库；不内置 retry / cache / toast |
| 包边界 | 沿用 `@cloud/security` 的 subpath 分裂：`./client` + `./server`，根仅纯类型 | 现 root barrel 间接含 `import "server-only"`，client 不能 import；分裂后边界清晰 |
| 401 处理 | `window.location.replace("/api/auth/logout")` + 抛 `RequestError(status: 401)` | 与 DAL 同出口；用 `replace` 不在 history 留 logout 跳；抛错而非永挂 Promise，调用方约定静默处理 |
| 其余 4xx / 5xx / 网络 | 统一抛 `RequestError`（status / body / code / cause） | 调用方决定 UI（toast / 表单字段 / Error Boundary） |
| 错误码 | `code: "http" \| "network" \| "parse" \| "unknown"` | http 覆盖任意非 2xx；body 解析失败放进 `cause`；parse 只用于 2xx 但响应不符合 envelope 的情况；unknown 是 wrapper 内部兜底 |
| API 形态 | 动词方法：`get / post / put / patch / delete` | 比单一 `request(url, init)` 手感好，POST/PUT 写法不重 |
| 返回值拆解 | `get<T>` 返 `{ data, pager? }`；其余动词返 `T`（拆 data） | **不对称是已知 trade-off**：list 才需要 pager；mutation 拆掉省一层。统一为 envelope 也是合理选项，但写多了 `.data` 噪音，故按 §2 决策走 |
| 错误文案 | 后端 4xx 已译 `body.message` 直显；网络/解析异常给 `code`，调用方自译 `t(\`request.errors.${code}\`)` | 避免给 wrapper 注入 i18n Context；包零运行时 i18n 依赖 |
| messages namespace | 顶层 `request.errors.*`（server / client 共享同一 namespace） | 与 app 自有 `errors.*` 解耦，不撞名 |
| base URL | 无 base，相对路径 `/api/...` | 同源；跨源场景本期 YAGNI |
| CSRF | 不内置 | sid 是 httpOnly cookie；同源 POST 默认带 cookie；如需 CSRF token 后续单独立项 |

## 3. 包结构

```
packages/request/
├── package.json
├── messages/
│   ├── en.json       # 顶层 request.errors.*（rename + 新增 http / network / parse / unknown）
│   ├── zh-CN.json
│   └── ja.json
└── src/
    ├── index.ts      # 共享纯类型: Pager, SuccessBody, ErrorBody（不依赖 server-only / next-intl）
    ├── server.ts     # 现 response.ts + errors.ts 合并：successResponse / createdResponse / noContentResponse
    │                 # / errorResponse / badRequestResponse / unauthorizedResponse / forbiddenResponse / notFoundResponse
    └── client.ts     # 首行 "use client"; 次行 import "client-only";
                      # request.{get,post,put,patch,delete} + class RequestError
```

`package.json` exports：

```jsonc
{
  "exports": {
    ".":        "./src/index.ts",
    "./server": "./src/server.ts",
    "./client": "./src/client.ts",
    "./messages/*.json": "./messages/*.json"
  }
}
```

> 子路径分裂规约与 `@cloud/security` 完全一致：文件名而非文件夹区分 server / client；server 子路径首行 `import "server-only"`，进 client bundle build 期报错。
>
> client 侧除了顶部 `"use client"` boundary 指令，还需 `import "client-only"`：`"use client"` 只标 client entry boundary，被 server module 直接 import 时不会拦截；`client-only` 在被 server bundle 链路引用时**模块加载期 throw**，捕捉 `window` 逻辑误用。需要把 `client-only` 加进根 `pnpm-workspace.yaml` 的 catalog，并在 `packages/request/package.json` 的 dependencies 增加 `"client-only": "catalog:"`。同时 vitest 已经为 `server-only` 做了 alias shim，需要为 `client-only` 加同样的 noop alias（`vitest.shims/client-only.ts` + `vitest.config.mts` 的 `resolve.alias`）。

## 4. 类型与 API

### 4.1 共享类型（`src/index.ts`）

```ts
export type Pager = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type SuccessBody<T> = {
  data: T;
  pager?: Pager;
};

export type ErrorBody = {
  message: string;
};
```

注意：`index.ts` 不能 import `server-only` 也不能 import `next-intl`，保持纯类型，client / server 都可读。

### 4.2 Client API（`src/client.ts`）

```ts
"use client";
import "client-only";

export type RequestQueryValue = string | number | boolean | null | undefined;

export type RequestOptions = {
  signal?: AbortSignal;
  headers?: HeadersInit;            // 与 fetch 一致：Headers | Record<string, string> | [string, string][]
  query?: Record<string, RequestQueryValue>;
};

export type RequestErrorCode = "http" | "network" | "parse" | "unknown";

export class RequestError extends Error {
  readonly status: number;          // HTTP status；0 表示未发出（网络层失败）
  readonly code: RequestErrorCode;  // 调用方 fallback 翻译用
  readonly body?: ErrorBody;        // 解析到 { message } 时填充
  constructor(
    message: string,
    init: { status: number; code: RequestErrorCode; body?: ErrorBody; cause?: unknown },
  );
}

export const request: {
  get<T>(url: string, opts?: RequestOptions): Promise<SuccessBody<T>>;
  post<T>(url: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  put<T>(url: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  patch<T>(url: string, body?: unknown, opts?: RequestOptions): Promise<T>;
  delete<T = void>(url: string, opts?: RequestOptions): Promise<T>;
};
```

#### `RequestErrorCode` 语义

| code | 触发 | body | cause |
|---|---|---|---|
| `http` | 任意非 2xx 响应（含 401 跳转抛出的那次） | 解析成功时为 `{ message }`；解析失败时 undefined | 解析失败时填 SyntaxError |
| `network` | `fetch()` 同步/异步 throw（DNS / 断网 / CORS preflight 失败） | undefined | 原 throw |
| `parse` | 2xx 但响应体不是 JSON 或不符合 envelope 形状 | undefined | SyntaxError |
| `unknown` | wrapper 内部未预期异常的兜底，**正常路径不会用到** | undefined | 原 throw |

### 4.3 Body 处理规则

| 输入 body | 序列化 | 自动 Content-Type |
|---|---|---|
| `undefined` / `null` | 不带 body | — |
| `FormData` / `Blob` / `URLSearchParams` / `ReadableStream` / `string` | 原样透传 | 不设置（让浏览器自决，比如 FormData 的 boundary） |
| 其他对象 / 数组 / 数值 / 布尔 | `JSON.stringify` | `application/json` |

`opts.headers` 始终覆盖默认 Content-Type。

### 4.4 query 序列化

用 `new URL(url, window.location.origin)` 合并：

```ts
function buildUrl(url: string, query?: RequestOptions["query"]): string {
  if (!query) return url;
  const u = new URL(url, window.location.origin);
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue;        // null / undefined 跳过
    u.searchParams.append(k, String(v));
  }
  // 同源时返回相对路径（pathname + search + hash）；跨源（理论上当前不发生）返回 absolute
  return u.origin === window.location.origin
    ? `${u.pathname}${u.search}${u.hash}`
    : u.toString();
}
```

- url 自带 query / hash（如 `/api/x?a=1#frag`）会被 `URL` 正确解析并保留。
- **不支持数组**：`Record<string, RequestQueryValue>` 类型已禁止 array；如果将来需要 repeated key，再扩到 `string | number | boolean | Array<...>` 并显式实现 `searchParams.append` 多次。

## 5. 全局 401 处理

```ts
async function execute(input: Request): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input);
  } catch (cause) {
    throw new RequestError("network failure", { status: 0, code: "network", cause });
  }
  if (res.status === 401) {
    // replace: 不在 history 留 logout 跳；用户后退键不会回到出错页
    if (typeof window !== "undefined") {
      window.location.replace("/api/auth/logout");
    }
    // 同步抛错，避免永挂 Promise；调用方约定静默处理 status === 401
    throw new RequestError("unauthorized — redirecting to logout", {
      status: 401,
      code: "http",
    });
  }
  return res;
}
```

**调用方约定（写进 §7 调用示例 + DEV_NOTE）**：

```ts
catch (err) {
  if (err instanceof RequestError) {
    if (err.status === 401) return;     // 浏览器已经在跳 logout，UI 不响应
    // ... 其余分支
  }
}
```

理由：

- 与后端 DAL 同出口（`/api/auth/logout` 已经接受 GET，清 cookie 后 302 到 `/login`）。
- `replace` 而非 `assign`：过期登出不应该污染 history，回退键不应该回到 401 的那一刻。
- 同步抛错而非永挂 Promise：
  - 永挂 Promise 在测试里会导致用例卡死，在 React 渲染里会让 `useTransition` / `useActionState` 永不结束；
  - 抛错让 `.catch` / `.finally` 仍然能跑（finally 通常用来关 loading，需要执行）；
  - 调用方收到 `status === 401` 时静默返回即可，UI 没有显示窗口。
- `typeof window` 兜底：client.ts 标了 `"use client"` + `client-only`，理论不会进 SSR，保留检查应对 React 19 + Next.js 16 RSC 边界踩坑。

不做：
- 不区分"过期" vs "未登录"。后端只发 401，前端无法感知差异。
- 不弹"会话过期"提示。`/login` 是足够强的信号。如需提示，后续在 `/api/auth/logout` 加 query 转给 `/login?reason=expired`。

## 6. 错误响应处理

非 401 的 4xx / 5xx 走同一分支：**始终 `code: "http"`**，解析失败不改 code，把 SyntaxError 放进 `cause`：

```ts
if (!res.ok) {
  let body: ErrorBody | undefined;
  let parseCause: unknown;
  try {
    body = (await res.json()) as ErrorBody;
  } catch (e) {
    parseCause = e;
  }
  throw new RequestError(body?.message ?? `HTTP ${res.status}`, {
    status: res.status,
    code: "http",          // 语义稳定：用户/调用方看到的是 HTTP 失败，不是"解析失败"
    body,
    cause: parseCause,
  });
}
```

`res.ok` 分支按方法不同分流（**这里**才会出现 `code: "parse"`，表示响应 200 但 envelope 形状错）：
- `get`：解析为 `SuccessBody<T>`，直接返回；解析失败 → `RequestError(status: res.status, code: "parse", cause)`。
- `post / put / patch`：解析为 `SuccessBody<T>`，返回 `body.data`；解析失败同上。
- `delete`：`status === 204` → `undefined`；其他 status 走 `post` 逻辑。

调用方在 fallback 翻译时 `t(\`request.errors.${err.code}\`)`：
- `http` → "请求失败"（一般会先用 `err.body?.message`，所以这条很少出现）
- `network` → "网络错误，请检查连接"
- `parse` → "响应格式异常"
- `unknown` → "未知错误"

## 7. 文案与 i18n

### 7.1 namespace 变更（**行为变更**，非"无逻辑变更"）

| 文件 | 现状 | 改为 |
|---|---|---|
| `packages/request/messages/{en,zh-CN,ja}.json` | 顶层 `errors.*`（4 个 key：badRequest / unauthorized / forbidden / notFound） | 顶层 `request.errors.*`（旧 4 + `http` / `network` / `parse` / `unknown`） |
| `packages/request/src/server.ts`（迁移后） | `getTranslations("errors")` | `getTranslations("request.errors")` |
| `packages/request/test/errors.test.ts` | mock translator namespace = `errors` | 改为 `request.errors` |
| `DEV_NOTE.md` "HTTP 响应约定（@cloud/request）" 段 | 描述错误默认文案走 `errors.*` namespace | 改为 `request.errors.*`，并增补 client 侧 `http / network / parse / unknown` 4 个 key 的含义说明 |

admin app 自有 `errors.*` namespace 不变；本期改的是 `@cloud/request` 自带 messages 文件的顶层 key，不影响业务 namespace。

### 7.2 调用方使用

```ts
const t = useTranslations();

try {
  const { data } = await request.get<User>("/api/users/1");
  // ...
} catch (err) {
  if (!(err instanceof RequestError)) throw err; // 非预期异常透传
  if (err.status === 401) return;                // 浏览器在跳 logout，UI 静默
  const msg = err.body?.message ?? t(`request.errors.${err.code}`);
  toast.error(msg);
}
```

绝大多数 4xx 错误 `err.body.message` 已由后端 `request.errors.*` namespace 翻译过；前端仅在 http 无 body / network / parse / unknown 时回退本地 fallback。

## 8. 迁移计划

### 8.1 包内（含行为变更：i18n namespace + messages 文件）

1. 把 `packages/request/src/response.ts` + `errors.ts` 内容合并搬到 `src/server.ts`，原文件删除。
2. 新建 `src/index.ts`，仅 export `Pager / SuccessBody / ErrorBody` 三个纯类型。
3. 新建 `src/client.ts`，实现 §4–§6。首行 `"use client"`，次行 `import "client-only"`。
4. `package.json` exports 增加 `./client` 与 `./server`；dependencies 增加 `"client-only": "catalog:"`。
5. 根 `pnpm-workspace.yaml` 的 catalog 加入 `client-only`（与 `server-only` 同版本约定）。
6. `vitest.shims/client-only.ts` 新建（空 module）；`vitest.config.mts` 的 `resolve.alias` 加 `'client-only'` 指向它。
7. `packages/request/messages/*.json` 按 §7.1 改 namespace + 加 4 个 client 端 key（`http / network / parse / unknown`）。
8. 测试：`packages/request/test/client.test.ts`（新增）；现有 `errors.test.ts` / `response.test.ts` 改 import 到 `../src/server.ts`，并把 mock translator 的 namespace 改成 `request.errors`。
9. 更新 `DEV_NOTE.md` 的 "HTTP 响应约定（@cloud/request）" 段：namespace 改写、client 侧 helper 矩阵。

### 8.2 包外（route handler import 路径）

`@cloud/request` → `@cloud/request/server`，覆盖：

- `apps/admin/app/(public)/api/auth/public-key/route.ts`
- `apps/admin/app/(authed)/api/demo/allowed/route.ts`
- `apps/admin/app/(authed)/api/demo/forbidden/route.ts`
- 其他 grep 结果（落地时全量搜一次）

### 8.3 admin 客户端接入

| 文件 | 改造点 |
|---|---|
| `apps/admin/app/(public)/login/login-form.tsx` | `getPublicKey` 改用 `request.get<{ publicKey: string }>`；try/catch 收 `RequestError`，错误文案走 `t(\`request.errors.${code}\`)` |
| `apps/admin/app/(authed)/demo-buttons.tsx` | `callApi` 改用 `request.get<unknown>`；演示 catch `RequestError` 展示 status + body |

partner / merchant 暂不改，文档化路径即可。

## 9. 测试

### 9.1 单元（vitest，stub `globalThis.fetch`）

| 用例 | 期望 |
|---|---|
| `get` 200 with pager | resolve `{ data, pager }` |
| `get` 200 no pager | resolve `{ data }`，无 pager 字段 |
| `post` 序列化对象 body + 自动设 Content-Type: application/json | fetch 收到 stringify 后 body |
| `post` 传 FormData / Blob / string | 原样透传，不自动设 Content-Type |
| `query` 序列化 | `?a=1&b=true`；`null`/`undefined` 字段过滤 |
| `delete` 204 | resolve `undefined`，不调 .json() |
| 非 401 4xx + JSON body | reject `RequestError`，`status` / `body.message` / `code: "http"`，`cause` undefined |
| 5xx + 非 JSON body | reject `RequestError`，`body` undefined，`code: "http"`（**不是** parse），`cause` 为 SyntaxError |
| 2xx + 非 JSON / envelope 不合规 | reject `RequestError`，`code: "parse"`，`cause` 为 SyntaxError |
| 网络 throw | reject `RequestError`，`status: 0`，`code: "network"`，`cause` 透传 |
| 401 触发跳转 + 抛错 | spy `window.location.replace("/api/auth/logout")`；reject `RequestError(status: 401, code: "http")` |
| `signal` 透传 | mock fetch 收到同一 `AbortSignal` |
| `query` 与 url 已有 `?` / `#` 共存 | `buildUrl` 用 `URL` 合并，已有 query 保留，hash 保留 |

### 9.2 集成 / E2E

- `pnpm --filter admin e2e` 现有 `session.spec.ts` 未登录跳转、失效 sid 清理用例不变 —— 验证 401 链路依旧通畅。
- 不新增独立 e2e spec。

## 10. 验收清单

- [ ] `pnpm --filter @cloud/request test` 全绿
- [ ] `pnpm --filter admin test` 全绿
- [ ] `pnpm --filter admin e2e` 全绿
- [ ] `pnpm --filter admin build` 通过（server-only / client-only 双向边界检查）
- [ ] admin 登录页 + demo 按钮 UI 手测
- [ ] 手动 `redis-cli DEL session:<sid>` 后任意按钮 → 浏览器 `replace` 到 `/api/auth/logout` → `/login`，history 不留 logout 一跳
- [ ] `DEV_NOTE.md` 已同步 `request.errors.*` namespace 与 client 侧 helper 矩阵

## 11. 显式不做（YAGNI）

- 重试 / 退避
- 请求并发 / 取消队列管理（调用方自管 `AbortController`）
- 请求 / 响应缓存
- 全局 toast / Error Boundary 注入
- CSRF token
- base URL / 多 origin
- 客户端 zod 响应校验（信任后端响应形状）
- TanStack Query / SWR 集成（如未来引入，作为本壳之上的独立层）
