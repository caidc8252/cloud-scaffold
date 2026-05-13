import { describe, expect, it } from "vitest";
import { z } from "zod";
import { withApi } from "./with-api";

describe("withApi", () => {
  it("runs a public handler with validated query", async () => {
    const handler = withApi(
      {
        public: true,
        querySchema: z.object({ page: z.coerce.number().int().default(1) }),
      },
      async ({ query }) => ({ page: query.page }),
    );

    const response = await handler(new Request("http://localhost/api/users?page=2"));
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { page: 2 },
    });
  });

  it("returns validation errors", async () => {
    const handler = withApi(
      {
        public: true,
        querySchema: z.object({ page: z.coerce.number().int().positive() }),
      },
      async () => ({}),
    );

    const response = await handler(new Request("http://localhost/api/users?page=-1"));
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: "VALIDATION_ERROR" },
    });
  });

  it("returns payload too large before handler execution", async () => {
    const handler = withApi({ public: true }, async () => ({}));
    const response = await handler(
      new Request("http://localhost/api/users", {
        method: "POST",
        headers: {
          "content-length": `${10 * 1024 * 1024 + 1}`,
          "content-type": "application/json",
        },
        body: "{}",
      }),
    );

    expect(response.status).toBe(413);
  });

  it("returns session expired for protected routes without cookie", async () => {
    const handler = withApi({}, async () => ({}));
    const response = await handler(new Request("http://localhost/api/users"));
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: "SESSION_EXPIRED" },
    });
  });
});
