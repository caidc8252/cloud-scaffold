import { prisma } from "../src/index.ts";

// 预先计算的 argon2id hash —— 对应明文 `ChangeMe!123`，参数与 @cloud/security/server 硬编码档一致。
// 改 seed 默认密码时：在 packages/security 目录下跑
//   node -e 'import("argon2").then(m=>m.default.hash("<新密码>",{type:m.default.argon2id,memoryCost:19456,timeCost:2,parallelism:1}).then(h=>console.log(h)))'
// 把输出粘到这里。这样 @cloud/db 不需要依赖 @cloud/security，prisma seed 也不必跨 server-only。
const DEFAULT_PASSWORD = "ChangeMe!123";
const DEFAULT_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$Ev3lJmDRsEa0Nbomhgn47A$1lT4/JCDbV5hT5+63bxLMZBMyUinbkuEiAko+NTT96g";
const DEFAULT_PERMISSIONS = ["user.manage", "role.manage"];

const seedUsers = [
  { account: "admin", email: "admin@cloud.local" },
  { account: "isv", email: "isv@cloud.local" },
  { account: "iso", email: "iso@cloud.local" },
];

async function main() {
  for (const u of seedUsers) {
    await prisma.user.upsert({
      where: { account: u.account },
      update: {
        email: u.email,
        password: DEFAULT_PASSWORD_HASH,
        permissions: DEFAULT_PERMISSIONS,
      },
      create: {
        account: u.account,
        email: u.email,
        password: DEFAULT_PASSWORD_HASH,
        permissions: DEFAULT_PERMISSIONS,
      },
    });
    console.log(`seeded user: ${u.account} (password=${DEFAULT_PASSWORD})`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
