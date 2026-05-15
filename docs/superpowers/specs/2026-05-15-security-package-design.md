# `@cloud/security` Package — Design Spec

> 2026-05-15 创建。对应 `docs/superpowers/specs/2026-05-14-auth-permission-rewrite-design.md` 的 Stage 3 子集（RSA + argon2 工具部分），其余 Stage 3 内容（密码复杂度 schema、redact-paths、CSP headers）不在本 spec 范围。
> 本 spec 经 brainstorming 流程逐节确认。

---

## 0. 目标与不做

### 0.1 做

- RSA-OAEP-SHA256 对称工具：浏览器侧加密（`rsaEncrypt`），服务端侧解密（`rsaDecrypt`）
- argon2id 密码哈希工具（仅服务端）：`hashPassword` / `verifyPassword`
- 时间戳防重放工具（仅服务端）：`assertFreshTimestamp`，默认 60s 双向窗口
- 公私钥统一从 `@cloud/config` 读取，启动期做 PEM regex 格式校验
- 公钥通过 `GET /api/auth/public-key` 接口下发到前端（仅定义合同；route 实现归各 app）

### 0.2 不做（YAGNI）

- 密码复杂度 schema（Stage 3 后续任务）
- redact-paths / CSP / 安全 header（Stage 3 后续任务）
- key rotation / 多公钥 / `kid` 字段：公私钥静态使用，轮换 = 改 env + 重启服务
- argon2 参数 env 化：硬编码安全默认值（数值在 §3.3）
- 高层 payload 封装（如 `encryptLoginPayload({password, ts})`）：security 只暴露原子工具，业务 payload 拼装归 `@cloud/auth`

### 0.3 与 auth-permission-rewrite spec 的偏离

> 父 spec（2026-05-14-auth-permission-rewrite-design.md）§3.1 原方案是 `NEXT_PUBLIC_LOGIN_PUBLIC_KEY_PEM` 编译期注入公钥。本 spec 改为 `LOGIN_PUBLIC_KEY_PEM`（无 `NEXT_PUBLIC_` 前缀）+ `GET /api/auth/public-key` 接口下发，以满足"改 env 重启即生效，不重编译"的运维诉求。父 spec 落地到 Stage 10/11/12 时同步更新该节。

### 0.4 关键不变量

- 私钥代码路径**永不**进入客户端 bundle：通过 subpath exports + `import "server-only"` 双重防线
- security 工具不感知具体业务 payload 形状：RSA 工具收发任意字符串，时间戳工具收发任意 number
- argon2 hash 字符串自带参数（`$argon2id$v=19$m=...,t=...,p=...$...`），未来调整硬编码参数不影响已存 hash 的 verify

---

## 1. 包结构

```
packages/security/
├── package.json
├── tsconfig.json
└── src/
    ├── client/
    │   ├── index.ts          # 仅 export { rsaEncrypt }
    │   └── rsa-encrypt.ts    # SubtleCrypto 实现
    └── server/
        ├── index.ts          # 顶部 `import "server-only"`；re-export 其余
        ├── rsa-decrypt.ts    # Node crypto.privateDecrypt
        ├── argon2.ts         # hashPassword / verifyPassword（硬编码参数）
        └── timestamp.ts      # assertFreshTimestamp
```

`package.json`：

```json
{
  "name": "@cloud/security",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "exports": {
    "./client": "./src/client/index.ts",
    "./server": "./src/server/index.ts"
  },
  "dependencies": {
    "@cloud/config": "workspace:*",
    "argon2": "^0.41.1",
    "server-only": "^0.0.1"
  }
}
```

**强约束**：

- 无根 `.` 导出。消费方必须显式 `@cloud/security/client` 或 `@cloud/security/server`。
- `server-only` 模块在 client component / browser bundle 中被 import 时，Next.js 在 build 期报错。这是私钥隔离的主要防线。
- subpath exports 在 TS（`moduleResolution: "bundler"` 或 `"nodenext"`）和 Next.js 双侧均直接生效。

---

## 2. API Surface

### 2.1 `@cloud/security/client`

> 同构（浏览器 + Node 都能跑），底层用 Web Crypto `SubtleCrypto`。

```ts
export async function rsaEncrypt(
  plaintext: string,
  publicKeyPem: string,
): Promise<string>;
```

- 算法：RSA-OAEP，hash = SHA-256
- 实现：`SubtleCrypto.importKey("spki", <der>, ...)` + `encrypt("RSA-OAEP", key, <utf8 bytes>)`
- PEM → DER：剥离 `-----BEGIN/END PUBLIC KEY-----` 行 + 去空白 + `atob`/`Buffer.from(..., "base64")` 转 Uint8Array
- 返回：base64 字符串（无换行）
- 错误：PEM 解析失败 / 公钥不是 2048+ bit / 明文过长 → 抛原生 `DOMException`（不包装）
- 输入长度上限：RSA-OAEP-SHA256 with 2048-bit key 最多 190 字节明文；密码长度本身有 18 字符上限，远低于此

### 2.2 `@cloud/security/server`

> 文件顶部 `import "server-only"`。任何 client component 引入即 build 期失败。

```ts
export function rsaDecrypt(
  ciphertextBase64: string,
  privateKeyPem: string,
): string;
```

- 同步实现：`crypto.privateDecrypt({ key, oaepHash: "sha256", padding: crypto.constants.RSA_PKCS1_OAEP_PADDING }, Buffer.from(b64, "base64"))`
- 返回：UTF-8 解码后的明文字符串
- 错误：私钥不可读 / 密文损坏 / OAEP 校验失败 → 抛原生 `Error`（不包装；上层 auth 服务负责转 `ApiException`）

```ts
export async function hashPassword(plain: string): Promise<string>;
export async function verifyPassword(hash: string, plain: string): Promise<boolean>;
```

- 算法：argon2id
- 硬编码参数（OWASP 2023+ 推荐档）：

  ```ts
  const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 19456,   // 19 MiB
    timeCost: 2,
    parallelism: 1,
  } as const;
  ```
- `hashPassword` 直接 `argon2.hash(plain, ARGON2_OPTIONS)`，返回 argon2 编码字符串
- `verifyPassword` 调 `argon2.verify(hash, plain)`；非法 hash 字符串 / 任意异常 → catch 返 `false`（不抛）

```ts
export function assertFreshTimestamp(
  ts: number,
  options?: { maxAgeMs?: number },
): void;
```

- 默认 `maxAgeMs = 60_000`
- 校验 `ts` 在 `[now - maxAgeMs, now + maxAgeMs]` 区间内
- 双向容差：处理客户端时钟稍快的边界（避免合法请求被拒）
- 越界抛 `Error("timestamp out of window")`；上层 auth 服务转 `ApiException(400, "REPLAY_DETECTED")`
- 非 finite 数 / 非 number → 同样抛错

### 2.3 不暴露

- `JSON.stringify({password, ts})` 拼装：归 `@cloud/auth`
- RSA 密钥生成：用 `openssl` CLI，不在工具包内
- 任何 redaction / log scrubbing：归后续 Stage

---

## 3. `@cloud/config` 改动

### 3.1 schema 增量

```ts
const PEM_PUB = /^-----BEGIN PUBLIC KEY-----[\s\S]+-----END PUBLIC KEY-----\s*$/;
const PEM_PRIV = /^-----BEGIN PRIVATE KEY-----[\s\S]+-----END PRIVATE KEY-----\s*$/;

const envSchema = z.object({
  // 既有
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  NEXT_PUBLIC_APP_NAME: z.string().min(1),

  // 新增
  LOGIN_PUBLIC_KEY_PEM: z.string()
    .transform((s) => s.replace(/\\n/g, "\n"))
    .pipe(z.string().regex(PEM_PUB, "LOGIN_PUBLIC_KEY_PEM must be SPKI PEM (-----BEGIN PUBLIC KEY-----)")),
  LOGIN_PRIVATE_KEY_PEM: z.string()
    .transform((s) => s.replace(/\\n/g, "\n"))
    .pipe(z.string().regex(PEM_PRIV, "LOGIN_PRIVATE_KEY_PEM must be PKCS8 PEM (-----BEGIN PRIVATE KEY-----)")),
});
```

### 3.2 `\\n` → `\n` transform 的用意

根 `.env` 文件多行 quoted 写法可直接表达换行。但 PaaS 控制台单行输入时，惯例是把换行写成字面量 `\n`。transform 兼容这两种来源，避免运维侧踩坑。

### 3.3 PEM 在 env 文件里的写法

**写法 A — 多行 quoted（推荐，本地 .env）：**

```env
LOGIN_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAAS...
-----END PRIVATE KEY-----"
```

dotenv 16+ / Next.js `@next/env` 默认支持。

**写法 B — 单行 + `\n` 字面量（PaaS 控制台）：**

```env
LOGIN_PRIVATE_KEY_PEM="-----BEGIN PRIVATE KEY-----\nMIIEvQIBAD...\n-----END PRIVATE KEY-----"
```

config schema 的 transform 会把 `\n` 字面量还原为真实换行。

### 3.4 不做

- 启动期 parse 校验（用 `crypto.createPublicKey` 验 PEM 结构）：本 spec 取最轻档（仅 regex）。如果未来发现"PEM 头正确但内容损坏"导致运行时挂登录的频率高，再升级到 parse 档。
- 公私钥配对 round-trip 校验：同上，过度防御。

---

## 4. `/api/auth/public-key` API 合同

> 本 spec 只定合同；route 文件归各 app（Stage 10/11/12 落地）。

```
GET /api/auth/public-key
Auth: none
Response 200:
  Content-Type: application/json
  Body: { "publicKey": "-----BEGIN PUBLIC KEY-----\n..." }
```

实现要点（route.ts 内）：

- `export const dynamic = "force-dynamic";` —— 防止 Next.js build-time 静态化把公钥钉死在编译产物里
- body 永远是 JSON 对象（不是裸字符串）—— 后续要扩字段（如 `kid`）时不破坏前端契约
- 加入 `isPublicPath()` 白名单：`/^\/api\/auth\/public-key$/`

FE 消费模式（参考实现，不进 security 包）：

```ts
'use client';
import { rsaEncrypt } from '@cloud/security/client';

let cachedPubKey: string | null = null;

async function getPubKey(): Promise<string> {
  if (!cachedPubKey) {
    const res = await fetch('/api/auth/public-key');
    cachedPubKey = (await res.json()).publicKey;
  }
  return cachedPubKey;
}

async function buildLoginPayload(password: string): Promise<string> {
  const pem = await getPubKey();
  const payload = JSON.stringify({ password, ts: Date.now() });
  return rsaEncrypt(payload, pem);
}
```

- 同页面生命周期内缓存公钥（避免每次提交都 fetch）
- 不做强缓存（重启 server 即生效，客户端刷新页面后重新拉）

---

## 5. 测试

### 5.1 fixtures

`packages/security/test/fixtures/` 下放一对 RSA-2048 测试密钥（**仅测试用**，commit 进仓库）：

```
fixtures/
├── README.md          # 说明用途 + openssl 生成命令
├── test-public.pem
└── test-private.pem
```

生成命令（写进 fixtures/README.md）：

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out test-private.pem
openssl pkey -in test-private.pem -pubout -out test-public.pem
```

### 5.2 用例清单

`packages/security/test/`：

- `rsa.test.ts`
  - client `rsaEncrypt` → server `rsaDecrypt` round-trip：明文一致
  - 同明文两次 `rsaEncrypt` 密文不相同（OAEP 随机性）
  - `rsaDecrypt` 收到损坏密文抛错
  - `rsaEncrypt` 收到非 PEM 字符串抛错
- `argon2.test.ts`
  - `hashPassword` → `verifyPassword(hash, same)` true
  - `verifyPassword(hash, different)` false
  - `verifyPassword("not-a-hash", "anything")` false（不抛）
  - hash 字符串以 `$argon2id$` 开头
- `timestamp.test.ts`
  - `assertFreshTimestamp(Date.now())` 不抛
  - `assertFreshTimestamp(Date.now() - 70_000)` 抛
  - `assertFreshTimestamp(Date.now() + 70_000)` 抛
  - `assertFreshTimestamp(Date.now() - 30_000, { maxAgeMs: 10_000 })` 抛（自定义窗口生效）
  - `assertFreshTimestamp(NaN)` 抛

`packages/config/test/`：

- `pem-env.test.ts`
  - 合法多行 PEM 通过 schema
  - 单行 `\n` 字面量 PEM 通过 schema（transform 生效）
  - 缺 `BEGIN PUBLIC KEY` 头抛 ZodError
  - 私钥放进 `LOGIN_PUBLIC_KEY_PEM` 抛 ZodError（头不匹配）

### 5.3 vitest.setup.ts 注入

测试期注入 fixture PEM 给 `process.env`，让依赖 `@cloud/config.getEnv()` 的模块在 module load 期不挂：

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const fixturesDir = resolve(process.cwd(), "packages/security/test/fixtures");
process.env.LOGIN_PUBLIC_KEY_PEM ??= readFileSync(
  resolve(fixturesDir, "test-public.pem"),
  "utf-8",
);
process.env.LOGIN_PRIVATE_KEY_PEM ??= readFileSync(
  resolve(fixturesDir, "test-private.pem"),
  "utf-8",
);
```

`vitest.setup.ts` 是 ESM，不能用 `__dirname`；`process.cwd()` 在 vitest 从仓库根运行时即为仓库根（当前 `vitest.config.mts` 即在根）。

### 5.4 jsdom 环境兼容性

当前 `vitest.config.mts` 全局 environment = `jsdom`。两点已知影响：

- `argon2` 走 Node native binding，jsdom 不阻塞 → server 端测试直接跑
- `SubtleCrypto`：现代 jsdom 已通过 `Crypto`/`SubtleCrypto` 提供基础实现，但若运行时报缺失，client 端 RSA 测试文件顶部加 pragma 切回 Node 环境：
  ```ts
  // @vitest-environment node
  ```
  Node 18+ 全局自带 `crypto.subtle`，与 SubtleCrypto API 同根。

---

## 6. 文件变更清单

| 文件 | 动作 |
|---|---|
| `packages/security/` | 新建（package.json / tsconfig.json / src/* / test/*） |
| `packages/config/src/index.ts` | 增加 `LOGIN_PUBLIC_KEY_PEM` / `LOGIN_PRIVATE_KEY_PEM` schema |
| `packages/config/test/pem-env.test.ts` | 新建 |
| `pnpm-workspace.yaml` catalog | 加 `argon2: ^0.41.1`、`server-only: ^0.0.1`（保持 catalog 收敛） |
| 根 `.env.example` | 加 `LOGIN_PUBLIC_KEY_PEM` / `LOGIN_PRIVATE_KEY_PEM` 占位 + 多行写法注释 |
| `vitest.setup.ts` | 注入两个 PEM 测试值 |
| `DEV_NOTE.md` | 新增小节 "Auth: RSA 登录密钥"（写法、生成、轮换 = 重启） |

**不动**：

- `packages/auth/`（login service、payload 拼装、`REPLAY_DETECTED` 转换归 Stage 5）
- `apps/*/login-form.tsx`（FE 改造归 Stage 10/11/12）
- `apps/*/app/api/auth/public-key/route.ts`（合同已定，落地归 Stage 10/11/12）

---

## 7. DEV_NOTE 新增小节（草稿）

> 落地时一并写入 DEV_NOTE.md。

```markdown
## Auth: RSA 登录密钥

### 决策

- 算法：RSA-2048 / OAEP / SHA-256
- 公私钥从根 `.env` 读：`LOGIN_PUBLIC_KEY_PEM` / `LOGIN_PRIVATE_KEY_PEM`
- 静态使用，**不做热重载、不做 kid 轮换**。轮换流程 = 替换 env 两个值 + 重启服务
- 公钥下发：`GET /api/auth/public-key` 接口（每 app 一份），**不**走 `NEXT_PUBLIC_*` build-time 注入
  - 好处：改 env 重启即生效，不需要 rebuild bundle
  - 代价：登录前多一次 HTTP fetch（同页面生命周期内缓存，可忽略）
- 私钥隔离：`@cloud/security` 用 subpath exports 拆 `/client` 与 `/server`，`/server` 顶部 `import "server-only"` 双保险

### 密钥生成

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out priv.pem
openssl pkey -in priv.pem -pubout -out pub.pem
```

把两份 PEM 内容写进根 `.env`（多行 quoted 写法或 `\n` 字面量都支持，见 §3.3）。

### 排障

- 启动 ZodError 指明 `LOGIN_PRIVATE_KEY_PEM` 不匹配 PEM 头 → 多半是写错了头/尾标记，或私钥贴反到公钥变量
- 登录解密失败 → 检查 FE bundle 拿到的公钥与服务端 env 里的私钥是不是同一对（轮换时容易半换）
```

---

## 8. 后续接续 stage（提示，非本 spec 范围）

- Stage 3 剩余：`@cloud/security/server` 加 `password-schema.ts`、`redact-paths.ts`、`headers.ts`
- Stage 5：`@cloud/auth` 的 `login-service.ts` 在解密后调用 `assertFreshTimestamp(payload.ts)`，越界抛 `ApiException(400, "REPLAY_DETECTED")`
- Stage 10/11/12：各 app 落地 `/api/auth/public-key/route.ts`，前端登录表单接 `rsaEncrypt`

---

## 附录 A — 决策记录

- **subpath exports + server-only 双防线**：单防线（仅 `server-only`）依赖 Next.js 的 import 链分析，万一 build 工具配错就漏；subpath 让消费方"显式选择"，减少误触面
- **argon2 参数硬编码**：与 hash 字符串自带参数的特性结合，未来调整无迁移成本；env 化反而增加配置漂移风险（dev/prod 不同步导致密码 hash 不可验证）
- **不做高层 payload 封装**：业务 payload 形状（`{password, ts}` vs `{oldPassword, newPassword, ts}` vs `{password}`）变体多；统一封装会拖累 auth 包灵活度。security 只保证原子工具够稳。
- **公钥通过 API 下发 而非 `NEXT_PUBLIC_*`**：满足"改 env 重启即生效不重编译"要求。多一次 fetch 的代价在登录路径上可忽略（且可缓存）。
- **不引 round-trip 启动校验**：公私钥配对错误在开发期第一次登录即暴露；生产期密钥变更需要走部署流程，前置校验收益小于复杂度成本。
