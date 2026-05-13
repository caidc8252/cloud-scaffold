import { describe, expect, it } from "vitest";
import { ApiException, apiFailure, apiSuccess } from "./index";

describe("api response helpers", () => {
  it("wraps success responses", async () => {
    const response = apiSuccess({ ok: true }, { requestId: "req_1" });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      data: { ok: true },
      requestId: "req_1",
    });
  });

  it("wraps ApiException failures", async () => {
    const response = apiFailure(new ApiException(401, "PERMISSION_DENIED", "没有当前权限"), {
      requestId: "req_2",
    });
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: "PERMISSION_DENIED", message: "没有当前权限" },
      requestId: "req_2",
    });
  });
});
