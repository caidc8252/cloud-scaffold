# Auth & Permission Rewrite — Design Spec

> 2026-05-14 · 设计阶段，待 Claude 接力实现。
> 替换当前 Better Auth + Google OAuth 链路，重做账密登录、session、权限、统一请求管线、i18n、安全、日志。
> 本 spec 由 brainstorming 流程产出，逐节经用户确认。
> 落地用 WIP.md 任务清单（见末尾"渐进式落地步骤"）。

---

## 0. 范围与原则

- 目标 app：`apps/admin`、`apps/partner`、`apps/merchant`（共享 DB + Redis，运行时彼此独立）
- 数据可重来：当前数据库 / Redis 数据无需保留
- 设计原则：安全第一 → 可维护 → 性能；约定大于配置；公共能力下沉到 `packages/`，业务/部署留在 `apps/`
- 不做：复杂多版本 API、操作审计表、单点登录、refresh token、SSO、密码强度评分、SRP/PAKE、多语言路径段

## 1. 整体架构

```
apps/{admin,partner,merchant}
  ├ proxy.ts            注 x-request-id + 10MB 限制 + 安全头（不再做登录校验）
  ├ instrumentation.ts  SIGTERM 关 Prisma / Redis
  ├ i18n/request.ts     next-intl 入口，合并 shared + app 词条
  ├ app/(public)/login  登录页
  ├ app/(authed)/...    requireSession() 保护
  ├ app/api/auth/...    login / logout / me / change-password
  ├ app/api/me/menu     菜单树（DB 过滤后）
  ├ app/api/health      DB + Redis 健康
  └ app/403/page.tsx    无权限页

packages/
  ├ config         env 校验 + isPublicPath + resolveTrustedOrigins
  ├ db             Prisma schema + 客户端 + seed
  ├ logger         pino + redact + child(requestId, userId)
  ├ i18n           shared messages + zod errorMap + 错误码 key 表
  ├ security       argon2、RSA 解密、密码 schema、CSP/安全头、redact
  ├ cache          Redis 客户端 + sessionStore（set/get/touch/del）
  ├ auth           login/logout/me/change-password/admin-reset 服务 + requireSession
  ├ permissions    PermissionChecker（has/can/list）
  ├ request        withApi + requestJson + respond + ApiException + useAuthStore + rateLimit
  └ ui             shadcn + 通用布局 + sonner + <RequirePermission> + <LanguageSwitch>
```

**砍掉**：`better-auth`、`bcryptjs`、`@cloud/auth` 的 Better Auth 适配、`packages/db` 的 `Account/Session/Verification` 模型、Google OAuth 路径、`sha256(token)` 作为 Redis key 的环节。

## 2. 数据模型

### 身份与组织

```prisma
enum Platform { admin partner merchant }
enum UserStatus { active locked }

model User {
  id            String      @id @default(cuid())
  platform      Platform
  email         String      @unique
  name          String
  status        UserStatus  @default(active)
  partnerOrgId  String?                              // platform=partner 时非空
  merchantOrgId String?                              // platform=merchant 时非空
  lastLoginAt   DateTime?
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  partnerOrg    PartnerOrg?  @relation(fields: [partnerOrgId], references: [id], onDelete: Restrict)
  merchantOrg   MerchantOrg? @relation(fields: [merchantOrgId], references: [id], onDelete: Restrict)
  passwords     PasswordHistory[]
  userRoles     UserRole[]
  @@index([platform, status])
  @@map("user")
}

// DB CHECK 约束（migration 里手写 raw SQL）：
//   admin    → partnerOrgId IS NULL AND merchantOrgId IS NULL
//   partner  → partnerOrgId IS NOT NULL AND merchantOrgId IS NULL
//   merchant → merchantOrgId IS NOT NULL AND partnerOrgId IS NULL

model PartnerOrg {
  id    String @id @default(cuid())
  name  String
  isIso Boolean @default(false)
  isIsv Boolean @default(false)
  users        User[]
  ownedApps    App[]               // 作为 ISV 拥有的 app
  ownedMerchants MerchantOrg[]    // 作为 ISO 旗下商户
  appDistributions AppDistribution[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("partner_org")
}

model MerchantOrg {
  id              String     @id @default(cuid())
  name            String
  ownerIsoOrgId   String
  ownerIso        PartnerOrg @relation(fields: [ownerIsoOrgId], references: [id], onDelete: Restrict)
  users           User[]
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  @@index([ownerIsoOrgId])
  @@map("merchant_org")
}

model App {
  id            String     @id @default(cuid())
  name          String
  ownerIsvOrgId String
  ownerIsv      PartnerOrg @relation(fields: [ownerIsvOrgId], references: [id], onDelete: Restrict)
  distributions AppDistribution[]
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  @@map("app")
}

model AppDistribution {
  appId       String
  isoOrgId    String
  app         App        @relation(fields: [appId], references: [id], onDelete: Cascade)
  isoOrg      PartnerOrg @relation(fields: [isoOrgId], references: [id], onDelete: Cascade)
  createdAt   DateTime   @default(now())
  @@id([appId, isoOrgId])
  @@map("app_distribution")
}
```

> `SessionSnapshot.orgId` 在 BE 拼时按 platform 取对应字段：`platform=partner` 取 `partnerOrgId`，`platform=merchant` 取 `merchantOrgId`，`platform=admin` 为 `null`。前端不感知字段差异。

### RBAC

```prisma
model Role {
  id          String           @id @default(cuid())
  key         String           @unique          // 'admin','iso','isv','merchant_admin','merchant_member'
  name        String
  platform    Platform                          // 与 User.platform 校验一致
  description String?
  userRoles   UserRole[]
  rolePermissions RolePermission[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@map("role")
}

model Permission {
  id        String @id @default(cuid())
  key       String @unique       // 'merchant.create','terminal.lock'
  business  String
  method    String
  description String?
  rolePermissions RolePermission[]
  menuPermissions MenuPermission[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([business, method])
  @@map("permission")
}

model RolePermission {
  roleId       String
  permissionId String
  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  createdAt    DateTime   @default(now())
  @@id([roleId, permissionId])
  @@map("role_permission")
}

model UserRole {
  userId String
  roleId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  role   Role @relation(fields: [roleId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  @@id([userId, roleId])
  @@map("user_role")
}
```

> v1 **不做 dataScope**。需要时在 `RolePermission` 加 `dataScope` 列、`PermissionChecker` 加 `scopeOf` API。

### 密码历史

```prisma
model PasswordHistory {
  id           String   @id @default(cuid())
  userId       String
  passwordHash String                   // argon2id
  setBy        String                   // userId of operator (self / admin reset)
  source       PasswordSource           // self_change / admin_reset / bootstrap
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt    DateTime @default(now())
  @@index([userId, createdAt])
  @@map("password_history")
}

enum PasswordSource { self_change admin_reset bootstrap }
```

- 当前密码 = `password_history.createdAt DESC LIMIT 1`
- "最近 5 条不重复" = `LIMIT 5` 后 `argon2.verify(new, oldHash)` 逐条比对
- admin reset 也写一条 (source=admin_reset)，参与后续 5 条历史
- 不删旧记录；积压无碍（B 端用户量级）

### 菜单

```prisma
model Menu {
  id        String   @id @default(cuid())
  key       String   @unique             // 用于前端路由映射
  parentId  String?
  parent    Menu?    @relation("MenuTree", fields: [parentId], references: [id], onDelete: SetNull)
  children  Menu[]   @relation("MenuTree")
  platform  Platform
  path      String                       // '/users'
  icon      String?
  sort      Int      @default(0)
  status    MenuStatus @default(visible)
  i18nKey   String                       // 'menu.users'，FE 翻译
  permissions MenuPermission[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([platform, status])
  @@map("menu")
}

model MenuPermission {
  menuId       String
  permissionId String
  menu         Menu       @relation(fields: [menuId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)
  @@id([menuId, permissionId])
  @@map("menu_permission")
}

enum MenuStatus { visible hidden }
```

- 菜单无权限绑定 = 公共菜单（登录后即可见）
- 有权限绑定 = any-of：用户拥有任一条即可见

### 会话

- 不入库
- Redis key `session:<sessionToken>`
- value = `SessionSnapshot` JSON
- TTL 1800s sliding（每次访问 `EXPIRE` 重置为 now+1800）
- 无绝对上限（按需补）
- 多端登录允许，v1 不做 user→sessions 反向索引

```ts
type SessionSnapshot = {
  account: { id: string; email: string; name: string; image?: string };
  platform: 'admin' | 'partner' | 'merchant';
  orgId: string | null;
  roles: string[];                  // role.key 列表
  permissions: string[];            // permission.key 扁平列表，已 union 去重
  version: number;                  // 角色/权限变更时 bump
  issuedAt: string;                 // ISO timestamp
};
```

> snapshot 不存 menu 列表。菜单树（含 parentId / icon / sort / i18nKey）走 `/api/me/menu` 单独取，由 useAuthStore 客户端缓存。

## 3. 认证流程

### 3.1 密码加密传输

- `NEXT_PUBLIC_LOGIN_PUBLIC_KEY_PEM`（公钥）—— FE bundle 注入
- `LOGIN_PRIVATE_KEY_PEM`（私钥）—— 根 `.env`，仅 BE 读
- RSA-OAEP（SHA-256）
- payload = `JSON.stringify({ password, ts: Date.now() })`
- 密文 base64 编码后随 body 提交
- BE 解密后校验 `now - ts <= 60_000 ms`，否则 `REPLAY_DETECTED`
- 公私钥生成：`openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out priv.pem && openssl rsa -in priv.pem -pubout -out pub.pem`
- 轮换：替换 `.env` 两个值 + 重新部署；FE 静态化无需协调

### 3.2 登录

`POST /api/auth/login`

Body: `{ email: string, encrypted: string }`

流程：

```
1. 解密 encrypted → { password, ts }；ts 超 60s → 400 REPLAY_DETECTED
2. GET Redis login:fail:account:<email>，>=5 → 401 ACCOUNT_LOCKED { ttl }
3. SELECT user WHERE email=$1 AND status='active'
   - 未命中 → INCR login:fail / EXPIRE 3600 → 401 INVALID_CREDENTIALS
4. SELECT password_history WHERE userId=u ORDER BY createdAt DESC LIMIT 1 → currentHash
5. argon2.verify(currentHash, password)
   - false → INCR login:fail / EXPIRE 3600 → 401 INVALID_CREDENTIALS
6. true：
   a. DEL login:fail:account:<email>
   b. snapshot = await buildSnapshot(user)
   c. token = crypto.randomBytes(32).toString('hex')   // 64 char
   d. SET session:<token> JSON(snapshot) EX 1800
   e. UPDATE user SET lastLoginAt=now()
   f. Set-Cookie: session-token=<token>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=…
   g. 200 { account, roles, permissions }
```

### 3.3 续期（sliding TTL）

`withApi` + `requireSession()` 在 session 命中时立刻 `EXPIRE session:<token> 1800`。不累加（每次重置为 now+1800）。

### 3.4 登出

`POST /api/auth/logout` → `DEL session:<token>` + 清 cookie（Max-Age=0）

### 3.5 修改密码

`POST /api/auth/change-password`

Body: `{ encryptedOld: string, encryptedNew: string }`

```
1. 解密 + ts 校验（两个都校）
2. complexity(newPassword, user.email)
3. SELECT password_history LIMIT 1 → currentHash；argon2.verify(currentHash, oldPassword)
   - false → 401 INVALID_CREDENTIALS
4. newPassword === oldPassword → 400 PASSWORD_REUSED
5. SELECT password_history LIMIT 5 → 逐条 argon2.verify(hash, newPassword) → 命中 → 400 PASSWORD_REUSED
6. INSERT password_history (userId, hash=argon2.hash(newPassword), source=self_change, setBy=userId)
7. 200 { ok: true }
```

> 不主动下线本会话；snapshot 不需变。下次登录用新密码。

### 3.6 admin 重置密码

`POST /api/admin/users/:id/reset-password`

要求 platform=admin + permission `user.reset_password`

Body: `{ encryptedNew: string }`

```
1. 解密 + ts 校验
2. complexity(newPassword, target.email)
3. INSERT password_history (userId=target.id, hash=argon2.hash, source=admin_reset, setBy=actor.id)
4. 200 { ok: true, hint: "用户下次登录生效" }
```

> 不强制踢下线（v1 没 user→session 反向索引）；如需立即生效，后续阶段补 user_session_index。

### 3.7 me

`GET /api/me` → snapshot 反序列化对外，去掉 `version` / `issuedAt` 内部字段；返 `{ account, platform, orgId, roles, permissions }`。

`GET /api/me/menu` → DB 查 Menu WHERE `platform = user.platform` AND `status = 'visible'`；按 MenuPermission any-of 过滤；按 `parentId` / `sort` 组装树后返回；树节点字段：`{ key, path, icon?, i18nKey, sort, children? }`。

### 3.8 公共路径

`isPublicPath()` 维护在 `@cloud/config`：

```ts
const PUBLIC_PATHS = [
  /^\/login$/,
  /^\/api\/auth\/login$/,
  /^\/api\/health$/,
  /^\/403$/,
  /^\/_next\//,
  /^\/__nextjs_/,
  /^\/favicon\.ico$/,
];
```

> proxy.ts 不做登录态校验。仅页面通过 `(authed)/layout.tsx` 的 `requireSession()`、API 通过 `withApi` 的 `requireAuth: true` 校验。

## 4. 权限模型

### 4.1 SessionSnapshot

见 §2 末尾。

### 4.2 PermissionChecker（位于 `@cloud/permissions`）

```ts
class PermissionChecker {
  constructor(snapshot: Pick<SessionSnapshot,'roles'|'permissions'>);

  has(input: string | string[]): boolean;       // any-of
  can(business: string, method: string | string[]): boolean;
  list(): string[];
  roles(): string[];
}
```

> 不暴露 `scopeOf` / `allows` / `scopedWhere` 等 scope API。

### 4.3 withApi 权限选项

```ts
withApi({
  requireAuth: true,        // 默认
  permission: 'merchant.create',
  // 或
  permission: ['merchant.create', 'merchant.update'],
}, handler);
```

- public：`requireAuth: false`，不接受 permission
- 命中失败：401 UNAUTHENTICATED / 401 SESSION_EXPIRED（清 cookie）/ 403 PERMISSION_DENIED

### 4.4 前端组件

```tsx
<RequirePermission perm="merchant.create">
  <Button>New</Button>
</RequirePermission>

<RequirePermission perm={['merchant.update', 'merchant.delete']} fallback={null}>
  ...
</RequirePermission>
```

底层走 `useAuthStore.hasPermission(input)`：any-of 字符串集合判断。

## 5. 统一请求管线

### 5.1 响应格式（RESTful，无 success 字段）

成功：

```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Request-Id: 8f3-...
{ "id": "u_1", "email": "..." }
```

无内容：`204 No Content`，空 body。

错误：

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json
X-Request-Id: 8f3-...
{ "code": "PERMISSION_DENIED", "message": "no permission" }
```

- BE message 永远英文占位（FE 翻译）
- 复杂错误带 `details`（如 zod issues）
- 分页 / 副信息直接放 body 字段（`{ items, total, page }`）

### 5.2 BE 工具

```ts
respondData<T>(data: T, init?: ResponseInit): Response;
respondError(exc: ApiException | Error, init?: { requestId?, clearSessionCookie? }): Response;

class ApiException extends Error {
  constructor(status: number, code: string, message: string, details?: unknown);
}
```

### 5.3 错误码全集（v1）

| code | HTTP | 触发 |
|---|---|---|
| `UNAUTHENTICATED` | 401 | 请求无 cookie |
| `SESSION_EXPIRED` | 401 | cookie 在但 Redis miss（清 cookie） |
| `PERMISSION_DENIED` | 403 | 已登录无权限 |
| `INVALID_CREDENTIALS` | 401 | 账密错或用户不存在/已锁 |
| `ACCOUNT_LOCKED` | 401 | 1h 内失败 5 次后 |
| `REPLAY_DETECTED` | 400 | 登录/改密 payload ts 超 60s |
| `PASSWORD_REUSED` | 400 | 改密命中最近 5 条历史 |
| `PASSWORD_WEAK` | 400 | 复杂度不过 |
| `VALIDATION_ERROR` | 400 | zod 校验失败 |
| `INVALID_JSON` | 400 | body JSON 错 |
| `PAYLOAD_TOO_LARGE` | 413 | size > 10MB |
| `RATE_LIMITED` | 429 | 命中限频 |
| `CSRF_BLOCKED` | 403 | Origin/Referer 不在白名单（非 GET） |
| `INTERNAL_SERVER_ERROR` | 500 | 兜底；不返 stack |

### 5.4 withApi 执行顺序

```
1. 注 / 取 x-request-id
2. assertBodySize（10MB）
3. CSRF：非 GET/HEAD/OPTIONS 验 Origin / Referer 在白名单
4. requireAuth：cookie → Redis → 401 / 续期 / 装 ctx.session + permissions
5. permission：any-of 校验 → 403
6. rateLimit：Redis INCR + EXPIRE → 429
7. format + validate（query / body / params）
8. handler(ctx)
9. respondData 包 + access log + slow log
10. catch → respondError + error log（4xx warn, 5xx error）
```

`ctx`：

```ts
{
  request: Request;
  requestId: string;
  session: SessionSnapshot | null;
  permissions: PermissionChecker | null;
  query, body, params;
  prisma: PrismaClient;
  logger: pino.Logger;     // child(requestId, userId, path)
}
```

### 5.5 FE：`requestJson`

```ts
async function requestJson<T>(input, init?): Promise<T>;
```

- 自动注 `x-request-id` + `content-type: application/json`
- 解 JSON；204 → undefined
- !ok → 抛 `ApiException(status, code, message, details)`
- 401 → `useAuthStore.clearAuthCache()` + `window.location.replace('/login?reason=expired')`
- 403 → `window.location.replace('/403')`
- 其它错误：只抛，不 Toast、不 loading
- loading 由调用方处理（React 19 useTransition / useActionState / TanStack Query 自带）
- Toast 由调用方在 catch 里调（`@cloud/ui` 提供 `toast.error(t('errors.'+exc.code))`）

### 5.6 requireSession 服务函数

```ts
// @cloud/auth
export async function requireSession(): Promise<SessionSnapshot>;
```

读 cookies → getSession → touchSession → 失败 `redirect('/login?reason=expired')`，成功返。

`apps/<app>/app/(authed)/layout.tsx`：

```tsx
import { requireSession } from '@cloud/auth';
export default async function Layout({ children }) {
  const session = await requireSession();
  return <AuthBoundary session={session}>{children}</AuthBoundary>;
}
```

`AuthBoundary` 客户端组件：把 session 推入 `useAuthStore`。

## 6. i18n

### 6.1 包结构

```
packages/i18n/
  src/
    config.ts            // locales = ['en','zh-CN'], defaultLocale = 'en'
    codes.ts             // ERROR_CODE_KEYS map
    zod-error-map.ts     // buildZodErrorMap(t)
    pick-locale.ts       // cookie 'locale' → Accept-Language → 'en'
    index.ts
  messages/
    en.json
    zh-CN.json
apps/<app>/messages/{en,zh-CN}.json    业务词条
apps/<app>/i18n/request.ts             next-intl getRequestConfig
```

### 6.2 加载合并

shared 在前、app 在后，浅合并（同 key app 覆盖 shared）。next-intl `messages` 接收合并结果，自带 missing key fallback 到 `en`。

### 6.3 错误码翻译

`@cloud/i18n/codes.ts`：

```ts
export const ERROR_CODE_KEYS = {
  UNAUTHENTICATED: 'errors.unauthenticated',
  SESSION_EXPIRED: 'errors.session_expired',
  PERMISSION_DENIED: 'errors.permission_denied',
  // ...
} as const;
```

FE：`t(ERROR_CODE_KEYS[exc.code] ?? 'errors.unknown', { ...exc.details })`。

### 6.4 zod errorMap

```ts
// buildZodErrorMap(t: TFn): z.ZodErrorMap
// 客户端启动期：z.setErrorMap(buildZodErrorMap(t));
```

服务端 zod parse 用英文占位（BE 不翻译），FE 收到 `details.issues` 时再用同一份 errorMap 翻译。

### 6.5 语言切换

- 走 cookie `locale`，1 年过期
- `<LanguageSwitch>`：写 cookie + `router.refresh()`
- 路径不带 locale 段（不做 `/en/foo` 风格）

### 6.6 时间 / 日期 / 数字

next-intl `useFormatter()`；时区由 next-intl `timeZone` 配置（默认 `Asia/Shanghai`，FE 用户可选）。

## 7. 安全

### 7.1 HTTP 安全头

`@cloud/security/headers.ts` 提供 `applySecurityHeaders(response, { nonce })`：

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-<nonce>' [dev only: 'unsafe-eval' 'unsafe-inline'];
  style-src  'self' 'unsafe-inline';
  img-src    'self' data: blob:;
  font-src   'self' data:;
  connect-src 'self';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
```

nonce 由 proxy.ts 每请求生成（`crypto.randomUUID()`），同时写入响应头 + 通过 `headers()` 给 RSC 用。

### 7.2 CSRF

- session cookie：`HttpOnly; Secure; SameSite=Strict; Path=/`
- `withApi` 非 GET/HEAD/OPTIONS：校验 `Origin` 或 `Referer` 与 `APP_ORIGIN` / `trusted_origins` 匹配；失败 → 403 `CSRF_BLOCKED`

### 7.3 密码

- argon2id；参数走 env：`ARGON2_MEMORY_KIB=19456`、`ARGON2_TIME_COST=2`、`ARGON2_PARALLELISM=1`
- 复杂度：`length 8–18` + 4 类（lower/upper/digit/special）取 3 + 不等于 email
- 历史：`PasswordHistory` 表，最近 5 条
- 传输：静态公钥 RSA-OAEP-SHA256 + payload `{password, ts}`，60s 时间窗

### 7.4 登录限频

- key `login:fail:account:<email>`，`INCR` + `EXPIRE 3600`（首次设置）
- ≥5 → 401 ACCOUNT_LOCKED
- 成功登录后 `DEL`

### 7.5 redact

`@cloud/security/redact-paths.ts` 暴露常量数组，喂给 pino：

```
req.headers.authorization
req.headers.cookie
body.password
body.oldPassword
body.newPassword
body.encrypted
*.token
*.sessionToken
*.privateKey
*.secret
*.clientSecret
```

### 7.6 其它

- SQL 注入：强制 Prisma；ESLint 禁 `$queryRawUnsafe`
- 错误细节：5xx 仅返兜底 message，stack 仅入 error log
- env 隔离：OAuth secret / DB pwd / RSA 私钥仅在根 `.env`

## 8. 日志与可观测

### 8.1 pino 实例

`@cloud/logger`：

```ts
import pino from 'pino';
import { REDACT_PATHS } from '@cloud/security';

export const logger = pino({
  level: env.LOG_LEVEL ?? 'info',
  base: { app: env.NEXT_PUBLIC_APP_NAME, env: env.NODE_ENV },
  redact: { paths: REDACT_PATHS, censor: '[REDACTED]' },
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

export function createRequestLogger(meta: {
  requestId: string;
  userId?: string;
  path?: string;
  method?: string;
}) {
  return logger.child(meta);
}
```

- dev：pino-pretty stdout
- prod：纯 JSON stdout（含 error level）
- 不再分 stderr / 多文件，依赖采集端（docker / PaaS）按 level / kind 分流

### 8.2 日志分类（一通道靠字段）

withApi finally 块：

```ts
ctx.logger.info({ kind: 'access', status, durationMs }, 'request done');
if (durationMs > env.SLOW_API_THRESHOLD_MS) {
  ctx.logger.warn({ kind: 'slow', durationMs }, 'slow api');
}
```

withApi catch 块：

```ts
const level = status >= 500 ? 'error' : 'warn';
ctx.logger[level]({ kind: 'error', status, code, stack }, 'request failed');
```

业务代码：`ctx.logger.info({ kind: 'app', orderId }, 'order created')`。

### 8.3 traceId

- FE `requestJson` 生成 UUID
- proxy.ts 兜底（缺则生成）
- withApi 取 + 注 child logger
- 响应永远带 `X-Request-Id` 头
- FE Toast 在异常时显示 requestId 复制按钮

### 8.4 health

`app/api/health/route.ts`，每个 app 一份，requireAuth=false：

```ts
export const GET = async () => {
  const dbOk  = await prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  const redisOk = await getRedis().ping().then(() => true).catch(() => false);
  const ok = dbOk && redisOk;
  return Response.json(
    { status: ok ? 'ok' : 'degraded', db: dbOk, redis: redisOk },
    { status: ok ? 200 : 503 },
  );
};
```

### 8.5 graceful shutdown

`apps/<app>/instrumentation.ts`：

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const close = async () => {
    try { await prisma.$disconnect(); } catch {}
    try { await getRedis().quit(); } catch {}
    process.exit(0);
  };
  process.on('SIGTERM', close);
  process.on('SIGINT', close);
}
```

## 9. 包结构变更总览

```
+ packages/logger
+ packages/i18n
~ packages/auth         (重写：删 Better Auth / Google；新 login/logout/me/change/reset/buildSnapshot/requireSession)
~ packages/cache        (sessionStore；移除 sha256 key)
~ packages/security     (换 argon2；加 RSA / headers / password-schema / redact-paths)
~ packages/permissions  (简化 has/can/list)
~ packages/request      (RESTful 响应；新 withApi / requestJson / rateLimit；删 loading store / silent)
~ packages/db           (新 schema；删 Account/Session/Verification)
~ packages/config       (新增 env)
~ packages/ui           (sonner / RequirePermission / LanguageSwitch / 403 page)
- better-auth           (依赖移除)
- bcryptjs              (依赖移除)
```

## 10. 渐进式落地步骤

> **执行规则**：每个 Stage 完成后等用户审核，通过后 check off；任务粒度按文件 / 接口 / 测试切；每个任务 commit message 含 stage 编号。文档同步规则见末尾。

### Stage 0 — 依赖与基础设施

- T0.1 `pnpm-workspace.yaml` catalog：加 `argon2`、`pino`、`pino-pretty`、`next-intl`、`sonner`（`better-auth`、`bcryptjs` 暂保留，Stage 13 清理）
- T0.2 `packages/logger`、`packages/i18n` 占位（package.json / tsconfig / index.ts）
- T0.3 `packages/config`：新 env keys（`LOGIN_PRIVATE_KEY_PEM`、`NEXT_PUBLIC_LOGIN_PUBLIC_KEY_PEM`、`LOG_LEVEL`、`SLOW_API_THRESHOLD_MS`、`ARGON2_MEMORY_KIB`、`ARGON2_TIME_COST`、`ARGON2_PARALLELISM`、`APP_ORIGIN`）
- T0.4 根 `.env.example` + 各 app `.env.example` 同步；README 注释 `openssl` 生成 RSA-2048 PEM 的命令
- T0.5 DEV_NOTE：新增 "Auth Rewrite — RSA 公私钥生成与轮换" 小节

### Stage 1 — Prisma 新 schema + seed

- T1.1 重写 `prisma/schema.prisma`：按 §2 全部模型；移除 Account / Session / Verification
- T1.2 `pnpm db:migrate -- --name auth_rewrite_v1`
- T1.3 重写 `prisma/seed.ts`：3 套 Role（admin/iso/isv/merchant_admin/merchant_member），初始 Permission 集合，role_permission 绑定，bootstrap 用户（admin / partner_admin / merchant_admin），首条 PasswordHistory（source=bootstrap，密码 argon2 哈希），示例 Menu + MenuPermission
- T1.4 `@cloud/db/index.ts` re-export 新类型 / enum；删除旧 export
- T1.5 README seed 表格更新（账号 / 密码 / 角色）

### Stage 2 — logger + i18n 基建

- T2.1 `@cloud/logger`：pino + child + redact + dev pretty
- T2.2 `@cloud/i18n/config.ts` + `codes.ts` + `zod-error-map.ts` + `pick-locale.ts`
- T2.3 公共词条 `packages/i18n/messages/{en,zh-CN}.json`（buttons / common / errors / zod）
- T2.4 单元测试：pick-locale、错误码 key 覆盖

### Stage 3 — security 重写

- T3.1 装 argon2，删 bcryptjs；新 `hashPassword` / `verifyPassword`
- T3.2 RSA：`decryptLoginPayload(encrypted, privateKeyPem) → { password, ts }` + 60s 时间窗检查
- T3.3 `headers.ts`：`applySecurityHeaders(response, { nonce, isDev })`
- T3.4 `password-schema.ts`：`buildPasswordSchema(email)` 返回 zod schema
- T3.5 `redact-paths.ts`：常量数组导出
- T3.6 升级 `maskSensitive` 复用 redact-paths
- T3.7 单元测试覆盖加密 / 解密 / 复杂度 / 时间窗

### Stage 4 — cache 升级

- T4.1 `sessionStore.ts`：`createSession(snapshot) → token`、`getSession(token)`、`touchSession(token)`、`deleteSession(token)`，key=`session:<token>` TTL 1800
- T4.2 删旧 `getSessionCacheKey`（sha256 版）；`hashToken` 留 security
- T4.3 单元测试 set→get→touch（验 TTL 重置）→delete→get null

### Stage 5 — auth 重写（与旧实现并行，Stage 13 才删旧）

- T5.1 在 `packages/auth/src` 下**并列添加**新文件：`login-service.ts` / `logout-service.ts` / `build-snapshot.ts` / `change-password-service.ts` / `admin-reset-service.ts` / `require-session.ts`；旧文件（`session-role.ts` / 旧 `index.ts` 中的 Better Auth glue）原地保留不动
- T5.2 `loginService({ email, encrypted })`：解密 → 限频 → 查用户 → 历史最新 verify → 失败 INCR / 成功 buildSnapshot + createSession + 设 cookie
- T5.3 `logoutService(token)`
- T5.4 `buildSnapshot(userId, prisma) → SessionSnapshot`（联表 roles / permissions，菜单不进 snapshot）
- T5.5 `changePasswordService(userId, encryptedOld, encryptedNew)`：含历史 5 条比对
- T5.6 `adminResetPasswordService(actorId, targetUserId, encryptedNew)`
- T5.7 `requireSession()` server 函数
- T5.8 单元测试覆盖：成功 / 密码错 / 锁定 / 重放 / 历史重复 / 改密成功 / admin reset
- T5.9 DEV_NOTE 同步：新增 "Auth 服务接口" 小节

### Stage 6 — permissions 简化

- T6.1 `PermissionChecker`：has / can / list / roles；删 scope 相关 API
- T6.2 单元测试更新

### Stage 7 — request 重写

> 此阶段引入响应格式 / withApi 选项的破坏性变更。完成后到 Stage 10 之间 `pnpm --filter <app> build` 预期失败；Stage 10/11/12 各自修正自己的 app。Stage 8 验证不依赖 app 构建。

- T7.1 `respondData<T>` / `respondError`（写 `X-Request-Id` 头；错误体无外壳）
- T7.2 `ApiException` + `ERROR_CODES` 常量（与 i18n codes.ts 对齐）
- T7.3 新 `withApi`：执行顺序按 §5.4；ctx 携 logger
- T7.4 `requestJson<T>`：401/403 自动跳；其它抛
- T7.5 `useAuthStore`：snapshot 接收 / clearAuthCache / hasPermission
- T7.6 `rateLimit` 工具：`enforceRateLimit({ key, max, windowSec })`
- T7.7 单元测试：withApi 状态机、requestJson 跳转

### Stage 8 — 最小链路验证（不进 Next.js）

- T8.1 Vitest 集成测试：argon2 哈希 / 验证
- T8.2 测：RSA 加密 / 解密 / 时间窗
- T8.3 测：createSession / getSession（命中即续期）/ deleteSession / TTL 重置（Redis 实际跑）
- T8.4 测：loginService 成功路径（mock prisma 或起 test DB）
- T8.5 测：loginService 失败计数 / 锁定 / 解锁
- T8.6 测：changePasswordService 命中历史 5 条
- T8.7 测：PermissionChecker.has / can
- T8.8 测：withApi mock Request → 401（无 cookie）/ 401（session 过期）/ 403（无权限）/ 400（zod）/ 200（成功）
- T8.9 `scripts/smoke-auth.ts`：手测脚本，把 T8.4~T8.6 串成 stdout 输出
- T8.10 **本阶段不通过不进下一阶段**

### Stage 9 — UI 包扩展

- T9.1 引入 sonner；`toast.success/error` 接 next-intl
- T9.2 `<RequirePermission perm>` 客户端组件
- T9.3 `<LanguageSwitch>` 客户端组件
- T9.4 `<AuthBoundary>` 客户端组件（注 useAuthStore）
- T9.5 通用 `<UnauthorizedPage>` 骨架

### Stage 10 — admin app 端到端打通

- T10.1 重写 `apps/admin/proxy.ts`：requestId + size + security headers（含 nonce）
- T10.2 `apps/admin/instrumentation.ts`：SIGTERM
- T10.3 `apps/admin/i18n/request.ts` + `messages/{en,zh-CN}.json`
- T10.4 路由结构：`(public)/login`、`(authed)/layout.tsx`（requireSession + AuthBoundary）、`(authed)/page.tsx`（dashboard）、`403/page.tsx`
- T10.5 API：`/api/auth/login` / `logout` / `change-password` / `me` / `me/menu` / `health` + `/api/admin/users/:id/reset-password`
- T10.6 用户列表 / 重置密码 UI（admin 业务示例）
- T10.7 登录页：账密表单 + 静态公钥加密（Web Crypto SubtleCrypto importKey + encrypt RSA-OAEP）+ Toast i18n
- T10.8 端到端手测：登录、续期、越权（403）、改密、锁定（5 次失败）、登出、跨标签、SIGTERM 优雅关
- T10.9 DEV_NOTE 同步：新增 "App 集成模式 (admin)" 小节
- T10.10 README 同步：admin 启动 + 默认账号 + 操作说明

### Stage 11 — partner app 复刻

- T11.1–T11.10 同 Stage 10，对 partner（注意 ISO / ISV 两个 role，菜单按权限过滤）
- 额外：登录后选择"切换视图"控件（前端 only，按你确认仅 UI 切换）

### Stage 12 — merchant app 复刻

- T12.1–T12.10 同 Stage 10，对 merchant

### Stage 13 — 清理 + 文档

- T13.1 删 `better-auth`、`bcryptjs` 依赖；`pnpm install` 干净
- T13.2 删旧 auth 工具（getSessionTokenFromCookieHeader / buildSessionSnapshot 旧版 / session-role.ts）
- T13.3 删旧 schema 残留（已在 Stage 1 完成则跳）
- T13.4 DEV_NOTE：删除 "Better Auth Origin 校验" 小节；新增 "Auth & Permission v1" 总述（snapshot 模型、TTL、错误码表、密码策略、CSP、health/shutdown）
- T13.5 README：错误码表、登录账号、3 个 app 启动命令、health 检查 URL
- T13.6 AGENTS.md：部署相关（RSA 生成、SIGTERM/PaaS 配置、CSP 调优）
- T13.7 WIP.md 清空，写入"下一阶段开发计划占位"

### 文档同步规则

| 触发 | 同步目标 |
|---|---|
| 改 env / 新加 env | 根 `.env.example` + 各 app `.env.example` + DEV_NOTE Env 分层 |
| 新加包 / 改包 exports | DEV_NOTE Workspace 约定（如必要） |
| 新加运维 / 部署步骤 | AGENTS.md |
| 改对外契约 / 错误码 / 错误流程 | DEV_NOTE Auth & Permission v1 + README（如需用户感知） |
| 仅内部重构 | commit message 标 "no doc" |

---

## 附录 A — env 全集（v1 完成后）

根 `.env`：

```
# infra
POSTGRES_DB / POSTGRES_USER / POSTGRES_PASSWORD / POSTGRES_PORT
REDIS_PORT / REDIS_URL
DATABASE_URL

# auth secrets
LOGIN_PRIVATE_KEY_PEM=<RSA-2048 PEM>
NEXT_PUBLIC_LOGIN_PUBLIC_KEY_PEM=<RSA-2048 PEM>
SESSION_COOKIE_NAME=session-token
SESSION_TTL_SECONDS=1800

# argon2
ARGON2_MEMORY_KIB=19456
ARGON2_TIME_COST=2
ARGON2_PARALLELISM=1

# logging
LOG_LEVEL=info
SLOW_API_THRESHOLD_MS=1000

# request limits
REQUEST_BODY_LIMIT_BYTES=10485760
```

每个 `apps/<app>/.env`：

```
APP_ORIGIN=http://localhost:3002        # admin / partner / merchant 各自端口
NEXT_PUBLIC_APP_NAME=admin              # / partner / merchant
BETTER_AUTH_TRUSTED_ORIGINS=...         # 保留：CSRF 校验
```

> Stage 13 时如果 `BETTER_AUTH_TRUSTED_ORIGINS` 名字过期，改名 `TRUSTED_ORIGINS`，DEV_NOTE 标注。

## 附录 B — 决策记录摘要

- **用户域**：单 user 表 + `platform` 字段隔离
- **租户**：admin 全局；PartnerOrg 带 `isIso/isIsv` 能力位；MerchantOrg 挂 ISO PartnerOrg；ISV 发布 App 经 AppDistribution 分发到 ISO
- **角色切换**：UI only，BE 永远看 roles 全集（partner 用户可同时持有 iso / isv）
- **权限 key**：`business.method` 二段（RBAC 标准）
- **dataScope**：v1 不做
- **密码传输**：静态公钥 + ts 防重放
- **session 上限**：无（仅 30min sliding）
- **多端登录**：允许；v1 无 user→sessions 反向索引
- **登录限频**：账号维度 5/h，锁 1h
- **菜单**：DB 表 + many-to-many permission
- **错误国际化**：BE 仅 code + 英文占位，FE 翻译
- **i18n 库**：next-intl
- **响应格式**：RESTful 无 success 字段；HTTP status 表示成败
- **CSRF**：SameSite=Strict + Origin/Referer 校验
- **越权状态码**：403
- **日志**：pino + stdout + pretty(dev)；一通道 kind 字段分类
- **session key**：Redis `session:<token>` 原 token，不 sha256
- **proxy 不做登录态校验**：交给 withApi（API）+ requireSession()（页面 layout）
