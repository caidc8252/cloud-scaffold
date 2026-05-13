import { describe, expect, it } from "vitest";
import { useAuthStore } from "./auth-store";

describe("useAuthStore", () => {
  it("stores account snapshots and clears them", () => {
    useAuthStore.getState().setAccountSnapshot({
      account: { id: "u1", email: "u1@example.com", name: "User 1" },
      roles: ["admin"],
      permissions: ["admin.user.read"],
    });

    expect(useAuthStore.getState().account?.email).toBe("u1@example.com");
    expect(useAuthStore.getState().hasPermission(["admin.user.delete", "admin.user.read"])).toBe(
      true,
    );

    useAuthStore.getState().clearAuthCache();
    expect(useAuthStore.getState().account).toBeNull();
  });
});
