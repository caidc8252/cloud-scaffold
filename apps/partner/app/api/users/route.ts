import { withApi } from "@cloud/request";
import { z } from "zod";

export const GET = withApi(
  {
    permission: { obj: "user", method: "read" },
    querySchema: z.object({
      page: z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(100).default(20),
    }),
  },
  async ({ prisma, query }) => {
    const [items, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.user.count(),
    ]);

    return { items, total, page: query.page, pageSize: query.pageSize };
  },
);

export const POST = withApi(
  {
    permission: { obj: "user", method: "create" },
    bodySchema: z.object({
      name: z.string().min(2),
      email: z.string().email(),
    }),
  },
  async ({ prisma, body }) => {
    return prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        name: body.name,
        email: body.email,
        emailVerified: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
  },
);
