# Test fixtures — RSA-2048 keypair

**仅用于单元测试。** 不是生产密钥，可以直接 commit 进仓库。

生成命令（已执行过一次，无需重跑）：

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out test-private.pem
openssl pkey -in test-private.pem -pubout -out test-public.pem
```

`vitest.setup.ts` 会读这两份 PEM 写入 `process.env.LOGIN_*_PEM`，避免依赖 `@cloud/config.getEnv()` 的模块在测试 module load 期挂。
