# 开发笔记 / DEV_NOTE

> 长期需要关注的框架知识、环境约定、决策依据。这里记**为什么**，操作步骤放 README，临时计划放 WIP/TODO。

---

## Prisma / 数据访问层

### 决策

- **版本**：Prisma ORM **v7**（`prisma` / `@prisma/client` 均在根 `pnpm-workspace.yaml` catalog 中锁到 `^7.6.0`）。
- **生成器**：使用 `prisma-client`（不要回退到 `prisma-client-js`，后者官方已 deprecated）。
- **生成位置**：`packages/db/generated/client`（与 `src/` 平级，避免污染源码目录）。这样落地的好处：
  - 不依赖 pnpm 对 `node_modules/.prisma/client` 的 symlink，避免 worktree / 分支切换后客户端与 schema 不一致。
  - 生成的是普通 TS 源码，Next.js / tsx 直接消费，无运行时桥接。
- **生成产物不入 git**：`.gitignore` 已排除 `packages/db/generated/`。`pnpm install` 的 postinstall 钩子负责重新生成。
- **唯一事实源**：`packages/db/prisma.config.ts`。schema / migrations / seed 路径都从这里读，不要散落到各 `package.json` script。
  - **v7 起 `datasource.url` 必须从 `schema.prisma` 移走**，由 `prisma.config.ts` 的 `datasource: { url: env("DATABASE_URL") }` 提供给 CLI；运行时连接走 driver adapter。schema 里的 `datasource db { provider = "postgresql" }` 只保留 `provider`，加 `url` 会触发 P1012。
- **驱动适配器**：v7 起 SQL provider 必须显式注入 driver adapter，内置 query engine 不再直连数据库。本仓使用 `@prisma/adapter-pg` + `pg`，**只在 `packages/db` 声明**，应用层照旧 `import { prisma } from "@cloud/db"`，不需要感知 adapter。
- **唯一消费入口**：`import { prisma, ... } from "@cloud/db"`。
  - 禁止任何 app / package 直接 `import { PrismaClient } from "@prisma/client"`。
  - 禁止深入 `@cloud/db/generated/*` 子路径。
  - 需要 enum / 输入输出类型时也走 `@cloud/db` 的 re-export。
  - `packages/db/prisma/seed.ts` 也走共享单例（`import { prisma } from "../src/index.ts"`），避免第二处 adapter 构造。

### 多人协作流程

| 场景                | 操作                                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 拉新代码 / 切分支   | `pnpm install` —— postinstall 会自动 `prisma generate`                                                                 |
| 改 schema           | 1) 编辑 `prisma/schema.prisma` 2) `pnpm db:migrate -- --name <slug>` 3) commit `prisma/migrations/*` + `schema.prisma` |
| 生成产物冲突 / 错乱 | `rm -rf packages/db/src/generated && pnpm db:generate`；**不要手动 merge 生成代码**                                    |
| CI / 生产部署       | `pnpm install` → `pnpm db:deploy`（apply migrations）→ `pnpm build`                                                    |
| Migration 命名      | `<动作>_<对象>`，如 `add_user_email_index`、`drop_legacy_role_table`                                                   |

### 故障排查

- **类型不存在 / 找不到 `PrismaClient`**：先 `pnpm db:generate`，确认 `packages/db/generated/client/` 下有 `client.ts`。
- **`Cannot find module '../../node_modules/prisma/...'`**：脚本应该走 pnpm bin（`prisma ...`），不要再写绝对路径。
- **postinstall 失败但只是想跑 generate 之外的命令**：可以临时 `PRISMA_SKIP_POSTINSTALL_GENERATE=1 pnpm install`（注意不是默认行为）。

---

## Env 分层

### 决策

按"基础设施 / 共享后端 / 每个 app"三层拆分 env，再叠加一层 dev / prod 分轨，单点消费入口 `getEnv()`（`packages/config`）不变。

| 文件                              | 内容                                                                                                                                                                                          | 谁加载                                                                                                                          |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 根 `.env`                         | Docker 基础设施（`POSTGRES_*`、`REDIS_PORT`）+ 共享后端连接 / 密钥（`DATABASE_URL`、`REDIS_URL`、`BETTER_AUTH_SECRET`、`GOOGLE_*`）+ 共享 tunables（`SESSION_*`、`REQUEST_BODY_LIMIT_BYTES`） | `docker-compose.yml`、`packages/db/prisma.config.ts`、`apps/*/next.config.ts` 通过 `loadEnvFile(rootEnvPath)` 提前注入          |
| 根 `.env.development`             | 上一行所有键的本地开发覆盖值（数据库口令、本地端口、dev secret 等）。**仅 dev 加载**。                                                                                                        | `apps/*/next.config.ts` 在 `process.env.NODE_ENV !== "production"` 时 `loadEnvFile(rootDevEnvPath)`，**早于** 根 `.env`         |
| `apps/<app>/.env`                 | 该 app 自己的部署参数（`BETTER_AUTH_URL`、`BETTER_AUTH_TRUSTED_ORIGINS`、`NEXT_PUBLIC_APP_NAME`）                                                                                             | Next.js 按约定从 app cwd 自动加载                                                                                               |
| `apps/<app>/.env.development`     | dev-only 覆盖。显式写 `BETTER_AUTH_TRUSTED_ORIGINS=*` 以**屏蔽**同目录 `.env` 里的严格白名单值（换端口 / 127.0.0.1 / LAN / ngrok 全部免改）。                                                  | Next.js 在 `next dev`（`NODE_ENV=development`）时自动加载，**优先级高于** 同目录 `.env`                                          |

变量优先级（后者覆盖前者，dev 模式下）：
根 `.env` → 根 `.env.development` → `apps/<app>/.env` → `apps/<app>/.env.development` → `apps/<app>/.env.local` → shell 环境。

生产（`NODE_ENV=production`）只读 `.env`，`.env.development` 完全跳过；PaaS 控制台注入的同名变量再覆盖文件值。

> 加载机制说明：`loadEnvFile` 是"已存在则不覆盖"语义，所以**先**调用的文件值会胜出。`next.config.ts` 里先 load `.env.development` 再 load `.env`，因此 dev 文件优先。Next.js 自身对 `apps/<app>/.env*` 的加载顺序也遵循相同的 first-wins 原则。

### 为什么这么拆

- 安全：BETTER_AUTH_SECRET / DB 口令 / OAuth secret 只在根 `.env`，不会复制进每个 app 目录，减少串味和误提交面。
- 多 app 隔离：`NEXT_PUBLIC_APP_NAME` 会 build-time 烘焙进 client bundle，三个 app 必须各自声明；`BETTER_AUTH_URL` 各 app 端口不同（3000 / 3001 / 3002）。共享一个根 `.env` 会让 admin / merchant 静默连到 partner 的值。
- onboarding 简化：只跑 partner 时，只需根 + `apps/partner/.env`，其余 per-app 文件可省略。

### 关键变量必填策略

`packages/config/src/index.ts` 中的 schema 故意去掉了 `DATABASE_URL`、`BETTER_AUTH_URL`、`NEXT_PUBLIC_APP_NAME` 三个的默认值 —— 缺失时 `getEnv()` 在启动期就抛 ZodError，明确指出缺哪个文件、哪个键，比静默连错库 / 串名字调试代价低。其余（`SESSION_*`、`REDIS_URL`、`REQUEST_BODY_LIMIT_BYTES`）保留 dev 默认。

`BETTER_AUTH_TRUSTED_ORIGINS` 走 dev/prod 双轨（详见下方 "Better Auth Origin 校验"）：dev 可留空，prod 通过 `superRefine` 强制非空。

测试环境通过 `vitest.setup.ts` 注入 `DATABASE_URL` / `BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_NAME` 的占位值，使 `@cloud/auth` / `@cloud/request` 在 module load 期调用 `getEnv()` 不会失败。

### 排障顺序

1. 启动报 ZodError 指明 `DATABASE_URL` / `REDIS_URL` / `BETTER_AUTH_SECRET` 等 → 检查**根** `.env`。
2. 启动报 ZodError 指明 `BETTER_AUTH_URL` / `BETTER_AUTH_TRUSTED_ORIGINS` / `NEXT_PUBLIC_APP_NAME` → 检查 `apps/<当前 app>/.env`。
3. 同时跑多个 app 时若 session / 登录跨串，先看各自 `BETTER_AUTH_URL` 是否对应自己的端口。

---

## Better Auth Origin 校验

### 决策

- **单点入口**：`resolveTrustedOrigins()`（`packages/config/src/index.ts`）。任何 app / 包都不要再直接解析 `BETTER_AUTH_TRUSTED_ORIGINS`。
- **Dev 默认放行**：`NODE_ENV !== "production"` 且 env 缺省时返回 `["*"]`。Better Auth 的 `wildcardMatch("*")` 会匹配所有 origin，等效于不校验。换端口 / LAN IP / ngrok 不必改 env。
- **Dev 可显式收窄**：dev 模式下如果 env 写了具体值（如 `http://localhost:3000`），仍以 env 为准，便于本地测试白名单逻辑。
- **dev / prod 分轨**：`apps/<app>/.env` 写严格白名单（生产模板），`apps/<app>/.env.development` 写 `BETTER_AUTH_TRUSTED_ORIGINS=*` 以屏蔽。Next.js dev 模式自动加载 `.env.development` 且优先级更高，因此 dev 默认放行、prod 默认严格。
- **Prod 严格**：`superRefine` 强制非空，缺失 / 空字符串 → ZodError 启动失败。
- **通配符**：原样透传给 Better Auth，由内置 `matchesOriginPattern`（`better-auth/dist/auth/trusted-origins.mjs`）处理 `*.foo.com` 这类模式。**不要在仓内复刻匹配器**。

### 来源优先级（高 → 低）

由 Node + Next.js + 我们的 `loadEnvFile()` 共同决定，**不需要新增加载逻辑**：

1. 运行时注入的环境变量（Render / Docker / Kubernetes / shell `export`）
2. `apps/<app>/.env.local`
3. `apps/<app>/.env`
4. 根 `.env`（由 `apps/*/next.config.ts` 的 `loadEnvFile(rootEnvPath)` 提前注入，遵循"已存在则不覆盖"语义）

PaaS 部署只要在控制台填 `BETTER_AUTH_TRUSTED_ORIGINS`，自然覆盖文件值。

### 配置示例

```
# 单 origin
BETTER_AUTH_TRUSTED_ORIGINS=https://partner.example.com

# 多 origin
BETTER_AUTH_TRUSTED_ORIGINS=https://partner.example.com,https://admin.example.com

# 通配符（所有 partner 子域）
BETTER_AUTH_TRUSTED_ORIGINS=https://*.example.com
```

### Secret 生成

```
npx @better-auth/cli@latest secret
```

输出粘到根 `.env` 的 `BETTER_AUTH_SECRET`。不要复用旧 secret 在多个环境。

---

## Workspace 约定

- 包间依赖统一使用 `workspace:*`。版本锁在根 `pnpm-workspace.yaml` 的 `catalog:` 中。
- `@cloud/db` 的 `exports` 字段只暴露 `.`，不要新增子路径导出 —— 入口收敛便于审计。
