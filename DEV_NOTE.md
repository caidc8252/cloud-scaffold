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
| 根 `.env`                         | Docker 基础设施（`POSTGRES_*`、`REDIS_PORT`）+ 共享后端连接（`DATABASE_URL`、`REDIS_URL`）                                                                                                    | `docker-compose.yml`、`packages/db/prisma.config.ts`、`apps/*/next.config.ts` 通过 `loadEnvFile(rootEnvPath)` 提前注入          |
| 根 `.env.development`             | 上一行所有键的本地开发覆盖值（数据库口令、本地端口等）。**仅 dev 加载**。                                                                                                                     | `apps/*/next.config.ts` 在 `process.env.NODE_ENV !== "production"` 时 `loadEnvFile(rootDevEnvPath)`，**早于** 根 `.env`         |
| `apps/<app>/.env`                 | 该 app 自己的部署参数（`NEXT_PUBLIC_APP_NAME`）                                                                                                                                               | Next.js 按约定从 app cwd 自动加载                                                                                               |
| `apps/<app>/.env.development`     | dev-only 覆盖。                                                                                                                                                                               | Next.js 在 `next dev`（`NODE_ENV=development`）时自动加载，**优先级高于** 同目录 `.env`                                          |

变量优先级（后者覆盖前者，dev 模式下）：
根 `.env` → 根 `.env.development` → `apps/<app>/.env` → `apps/<app>/.env.development` → `apps/<app>/.env.local` → shell 环境。

生产（`NODE_ENV=production`）只读 `.env`，`.env.development` 完全跳过；PaaS 控制台注入的同名变量再覆盖文件值。

> 加载机制说明：`loadEnvFile` 是"已存在则不覆盖"语义，所以**先**调用的文件值会胜出。`next.config.ts` 里先 load `.env.development` 再 load `.env`，因此 dev 文件优先。Next.js 自身对 `apps/<app>/.env*` 的加载顺序也遵循相同的 first-wins 原则。

### 为什么这么拆

- 安全：DB 口令等共享后端凭据只在根 `.env`，不会复制进每个 app 目录，减少串味和误提交面。
- 多 app 隔离：`NEXT_PUBLIC_APP_NAME` 会 build-time 烘焙进 client bundle，三个 app 必须各自声明。
- onboarding 简化：只跑 partner 时，只需根 + `apps/partner/.env`，其余 per-app 文件可省略。

### 关键变量必填策略

`packages/config/src/index.ts` 中的 schema 故意去掉了 `DATABASE_URL`、`NEXT_PUBLIC_APP_NAME` 两个的默认值 —— 缺失时 `getEnv()` 在启动期就抛 ZodError，明确指出缺哪个文件、哪个键，比静默连错库 / 串名字调试代价低。其余（如 `REDIS_URL`）保留 dev 默认。

测试环境通过 `vitest.setup.ts` 注入 `DATABASE_URL` / `NEXT_PUBLIC_APP_NAME` 的占位值，使依赖 `@cloud/config` 的包在 module load 期调用 `getEnv()` 不会失败。

### 排障顺序

1. 启动报 ZodError 指明 `DATABASE_URL` / `REDIS_URL` 等 → 检查**根** `.env`。
2. 启动报 ZodError 指明 `NEXT_PUBLIC_APP_NAME` → 检查 `apps/<当前 app>/.env`。

---

## Workspace 约定

- 包间依赖统一使用 `workspace:*`。版本锁在根 `pnpm-workspace.yaml` 的 `catalog:` 中。
- `@cloud/db` 的 `exports` 字段只暴露 `.`，不要新增子路径导出 —— 入口收敛便于审计。
- `@cloud/security` 例外：刻意通过 subpath exports 拆 `/client` 与 `/server`，server 子路径首行 `import "server-only"`，防止私钥相关代码进入客户端 bundle。

---

## Auth / RSA 登录密钥

### 决策

- **算法**：RSA-2048 / OAEP / SHA-256。客户端用 Web Crypto `SubtleCrypto`，服务端用 Node `crypto.privateDecrypt`。
- **密钥来源**：根 `.env` 的 `LOGIN_PUBLIC_KEY_PEM` / `LOGIN_PRIVATE_KEY_PEM`，由 `@cloud/config` 校验后 `getEnv()` 暴露。
- **静态使用，不做热重载、不做 kid 轮换**。轮换流程 = 改 env + 重启服务。
- **公钥下发**：每个 app 自带 `GET /api/auth/public-key`（`dynamic = "force-dynamic"`），登录前 FE fetch 一次缓存。**不走 `NEXT_PUBLIC_*` 编译期烘焙**，避免改密钥要重新 build。
- **私钥隔离**：`@cloud/security/server` 顶部 `import "server-only"` —— 任何 client component 直接或间接 import 都在 Next.js build 期报错。

### 密钥生成

```bash
# 仅打印到 stdout（用于复制贴到 PaaS 控制台）
pnpm keys:gen

# 同时写入根 .env 与 .env.example（已存在则跳过，加 --force 覆盖）
pnpm keys:gen --write
```

底层用 Node `crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: spki, privateKeyEncoding: pkcs8 })`。

### PEM 在 env 文件里的写法

```env
# 推荐：多行 quoted（本地 .env）
LOGIN_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----
MIIE...
-----END PRIVATE KEY-----"

# 兼容：单行 + \n 字面量（PaaS 控制台只能单行时）
LOGIN_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----"
```

`@cloud/config` 的 zod schema 自带 `\n` 字面量 → 真实换行的 transform，两种来源都通过同一个 regex 校验。

### argon2 参数硬编码

`@cloud/security/server/argon2.ts` 把 OWASP 2023+ 推荐档（argon2id, m=19456 KiB, t=2, p=1）写死。调整这些常量**不影响**已存 hash 的 verify —— argon2 编码字符串自带参数（`$argon2id$v=19$m=...,t=...,p=...$...`），新旧 hash 共存无迁移成本。所以不放 env。

### `server-only` 在非 Next.js 场景的解法

`server-only` 包在 module load 期 unconditional throw，任何 vitest / Node CLI 脚本 import 链上一旦碰到就炸。

- **vitest**：`vitest.config.mts` 的 `resolve.alias['server-only']` 指向 `vitest.shims/server-only.ts`（noop）。
- **Node CLI**：用 `--conditions=react-server` 让 Node 走 `server-only` 的 `react-server` 条件解析（resolves to `empty.js`）。`pnpm smoke:auth` 走这条路径。
- **Prisma seed 不走这条路**：`packages/db` 不依赖 `@cloud/security`，seed.ts 把 argon2id hash 预先算好以字面量形式 inline，依赖树保持干净。改默认密码时按 seed.ts 注释里的 one-liner 重算 hash 粘贴即可。

### 排障

| 现象 | 检查 |
|---|---|
| 启动 ZodError 指明 `LOGIN_*_PEM` 不匹配 | 多半是 PEM 头/尾标记写错，或私钥贴反到公钥变量 |
| 登录页 `/api/auth/public-key` 500 | 根 `.env` 是否缺 `LOGIN_PUBLIC_KEY_PEM`；`pnpm install` 是否在改 env 后跑过 |
| 登录解密失败但 ts 正确 | FE bundle 里的公钥与服务端 env 私钥不是同一对（轮换时容易半换） |
| `Argon2 native binding` 不可用 | `pnpm-workspace.yaml` 的 `onlyBuiltDependencies` 必须包含 `argon2`，pnpm 10 默认禁所有 build script |

### 端到端 smoke

`pnpm smoke:auth` 跑 `scripts/smoke-auth.ts`：fetch 公钥 → encrypt → decrypt → ts 校验 → 用真实 argon2 hash 比对 admin 密码。改 env / 改密钥 / 改 argon2 参数后先跑这个再手测 UI。
