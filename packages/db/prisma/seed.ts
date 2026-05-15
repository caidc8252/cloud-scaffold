import { prisma } from "../src/index.ts";

// 明文密码占位，接入登录前替换为哈希。
const DEFAULT_PASSWORD = "changeme";
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
        permissions: DEFAULT_PERMISSIONS,
      },
      create: {
        account: u.account,
        email: u.email,
        password: DEFAULT_PASSWORD,
        permissions: DEFAULT_PERMISSIONS,
      },
    });
    console.log(`seeded user: ${u.account}`);
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
