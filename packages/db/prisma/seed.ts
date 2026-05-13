import { hashPassword } from "@cloud/security";
import { randomUUID } from "node:crypto";
import { prisma } from "../src/index.ts";

const platformRoles = [
  {
    name: "partner_admin",
    description: "Partner platform administrator",
    account: {
      name: "Partner Admin",
      email: "partner.admin@example.com",
      password: "Partner@123456",
    },
    permissions: [
      { obj: "user", method: "read", description: "Read partner users" },
      { obj: "user", method: "create", description: "Create partner users" },
      { obj: "user", method: "update", description: "Update partner users" },
      { obj: "role", method: "read", description: "Read partner roles" },
    ],
  },
  {
    name: "merchant_admin",
    description: "Merchant platform administrator",
    account: {
      name: "Merchant Admin",
      email: "merchant.admin@example.com",
      password: "Merchant@123456",
    },
    permissions: [
      { obj: "merchant", method: "read", description: "Read merchant data" },
      { obj: "merchant", method: "update", description: "Update merchant data" },
      { obj: "order", method: "read", description: "Read merchant orders" },
      { obj: "settlement", method: "read", description: "Read merchant settlements" },
    ],
  },
  {
    name: "admin",
    description: "Platform administrator",
    account: {
      name: "Admin",
      email: "admin@example.com",
      password: "Admin@123456",
    },
    permissions: [
      { obj: "dataset", method: "read", description: "Read platform datasets" },
      { obj: "dataset", method: "create", description: "Create platform datasets" },
      { obj: "pipeline", method: "read", description: "Read platform pipelines" },
      { obj: "pipeline", method: "update", description: "Update platform pipelines" },
    ],
  },
];

async function main() {
  for (const platformRole of platformRoles) {
    const role = await prisma.role.upsert({
      where: { name: platformRole.name },
      update: { description: platformRole.description },
      create: {
        name: platformRole.name,
        description: platformRole.description,
      },
    });

    for (const item of platformRole.permissions) {
      const key = `${platformRole.name}.${item.obj}.${item.method}`;
      const permission = await prisma.permission.upsert({
        where: { key },
        update: {
          obj: item.obj,
          method: item.method,
          description: item.description,
        },
        create: {
          key,
          obj: item.obj,
          method: item.method,
          description: item.description,
        },
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }

    const user = await prisma.user.upsert({
      where: { email: platformRole.account.email },
      update: {
        name: platformRole.account.name,
        emailVerified: true,
      },
      create: {
        id: randomUUID(),
        name: platformRole.account.name,
        email: platformRole.account.email,
        emailVerified: true,
      },
    });

    await upsertCredentialAccount(user.id, platformRole.account.password);

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: role.id,
      },
    });
  }
}

async function upsertCredentialAccount(userId: string, password: string) {
  const passwordHash = await hashPassword(password);
  const existing = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "credential",
    },
  });

  if (existing) {
    await prisma.account.update({
      where: { id: existing.id },
      data: {
        accountId: userId,
        password: passwordHash,
      },
    });
    return;
  }

  await prisma.account.create({
    data: {
      id: randomUUID(),
      accountId: userId,
      providerId: "credential",
      userId,
      password: passwordHash,
    },
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
