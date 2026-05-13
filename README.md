# Cloud Frontend

Next.js 16 monorepo for partner, merchant, and admin consoles.

## Monorepo Structure

```txt
apps/
  partner/   # ISV/合作伙伴后台，完整认证和权限闭环
  merchant/  # 商户后台骨架
  admin/     # Admin 后台，已接入登录、退出和 admin 角色校验

packages/
  ui/           # shadcn 风格基础组件、公共后台布局、Tailwind v4 样式
  request/      # fetch 封装、统一 API 响应、withApi、Zustand auth store
  db/           # Prisma schema、Prisma client、seed
  auth/         # Better Auth 配置、Google 登录、session snapshot 构建
  cache/        # Redis client、session snapshot 读写
  permissions/  # ABAC PermissionChecker
  config/       # 环境变量校验和公共路径配置
  security/     # bcryptjs 密码 hash/verify、token hash、敏感字段脱敏
```

## Stack

- Next.js `16.2.6` App Router
- React `19`
- pnpm workspace
- Better Auth + Google 登录
- Prisma + PostgreSQL
- Redis session snapshot cache
- ABAC 权限格式：`role.obj.method`
- Zod + React Hook Form
- Zustand client auth cache
- Vitest, ESLint, Prettier

## Getting Started

Install dependencies:

```bash
pnpm install
```

Create local env:

```bash
cp .env.example .env
```

Update `.env` with real values. `BETTER_AUTH_SECRET` should be a random 32+ character secret.

Create and start PostgreSQL and Redis with values from `.env`:

```bash
docker compose --env-file .env create
docker compose --env-file .env start
```

Or create and start them in one command:

```bash
docker compose --env-file .env up -d
```

`DATABASE_URL` must match the PostgreSQL values used by Docker Compose:

```env
POSTGRES_DB=cloud_frontend
POSTGRES_USER=cloud
POSTGRES_PASSWORD=cloud_dev_password
POSTGRES_PORT=5433
DATABASE_URL=postgresql://cloud:cloud_dev_password@localhost:5433/cloud_frontend?schema=public
```

These defaults are also defined in `docker-compose.yml` with Docker Compose interpolation syntax, so `docker compose up -d` works on both Windows and Linux even before you customize `.env`.

PostgreSQL only applies `POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` when the data volume is initialized for the first time. If you changed these values after the container was already created, either update `DATABASE_URL` to match the existing database credentials, or recreate the local database volume:

```bash
docker compose --env-file .env down -v
docker compose --env-file .env up -d
```

`down -v` deletes the local PostgreSQL and Redis data volumes.

Generate Prisma client and prepare seed data:

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

The database scripts run from `packages/db` and load the repository root `.env` with `node --env-file=../../.env`.
Each Next.js app also loads the repository root `.env` from its `next.config.ts`, so workspace apps share the same `DATABASE_URL`, Redis, and Better Auth settings during `dev`, `build`, and `start`.

Seed creates three platform accounts with bcryptjs-hashed passwords:

| Platform | Email                        | Password          | Role             |
| -------- | ---------------------------- | ----------------- | ---------------- |
| Partner  | `partner.admin@example.com`  | `Partner@123456`  | `partner_admin`  |
| Merchant | `merchant.admin@example.com` | `Merchant@123456` | `merchant_admin` |
| Admin    | `admin@example.com`          | `Admin@123456`    | `admin`          |

These accounts are for local bootstrap only. Change the passwords before using a shared or production environment.

Start the partner app:

```bash
pnpm dev
```

Open:

- Partner: http://localhost:3000
- Merchant: `pnpm dev:merchant`, then http://localhost:3001
- Admin: `pnpm dev:admin`, then http://localhost:3002

## Auth And Permissions

`apps/partner/proxy.ts` and `apps/admin/proxy.ts` handle early request checks:

- public route allowlist
- missing `session-token` redirect or JSON 401
- `content-length` over 10 MB returns 413
- `x-request-id` propagation

Protected API routes use `withApi` from `@cloud/request`:

- accepts `public`, `permission`, `querySchema`, `bodySchema`, and `paramsSchema`
- loads Redis session snapshot
- hydrates snapshot from Better Auth when needed
- checks ABAC permissions
- formats request input
- validates query/body/params with Zod
- returns unified success/failure JSON
- catches and logs errors with request id, path, method, and stack

Auth/session rules:

- Better Auth + Prisma is the source of truth; Redis only caches session snapshots at `session:${sha256(session-token)}`.
- Session expiration returns `SESSION_EXPIRED` and clears the session cookie.
- Permission denial returns 401 `PERMISSION_DENIED`.
- Multiple permissions use any-of semantics: any matching permission is enough.

API response format:

```ts
type ApiSuccess<T> = {
  success: true;
  data: T;
  message?: string;
  requestId: string;
};

type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
};
```

`PermissionChecker` supports single permission and any-of checks:

```ts
checker.has("admin.user.read");
checker.has(["admin.user.read", "viewer.user.read"]);
checker.can("user", "read");
checker.can("user", ["read", "create"]);
```

## Useful Commands

```bash
pnpm dev
pnpm dev:partner
pnpm dev:merchant
pnpm dev:admin

pnpm lint
pnpm format:check
pnpm test

pnpm --filter partner build
pnpm --filter merchant build
pnpm --filter admin build
pnpm build
```

## Validation Status

The monorepo migration has been verified with:

```bash
pnpm test
pnpm lint
pnpm format:check
pnpm --filter partner build
pnpm --filter merchant build
pnpm --filter admin build
```
