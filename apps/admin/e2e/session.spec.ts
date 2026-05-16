import { expect, test } from "@playwright/test";

const ADMIN_ACCOUNT = "admin";
const ADMIN_PASSWORD = "ChangeMe!123";

// 登录表单的 RSA 加密在浏览器侧执行，因此 e2e 直接驱动表单即可，
// 不需要在 test 内手写 SubtleCrypto。
async function login(
  page: import("@playwright/test").Page,
  account: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.getByLabel(/账号|account/i).fill(account);
  await page.getByLabel(/密码|password/i).fill(password);
  await page.getByRole("button", { name: /登录|sign in|login/i }).click();
}

test.describe("admin session auth", () => {
  test("未登录访问 / 跳到 /login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("错误密码留在 /login 并显示错误", async ({ page }) => {
    await page.context().clearCookies();
    await login(page, ADMIN_ACCOUNT, "wrong-password");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText(/账号或密码错误/)).toBeVisible();
  });

  test("正确账号密码后跳到 / 并渲染账号", async ({ page }) => {
    await page.context().clearCookies();
    await login(page, ADMIN_ACCOUNT, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByText(`Welcome, ${ADMIN_ACCOUNT}`)).toBeVisible();
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "sid")).toBe(true);
  });

  test("POST /api/auth/logout 后再访问 / 重新跳 /login", async ({ page }) => {
    await page.context().clearCookies();
    await login(page, ADMIN_ACCOUNT, ADMIN_PASSWORD);
    await expect(page).toHaveURL(/\/$/);

    // 用 page 内置 fetch 走同一 cookie context
    await page.evaluate(async () => {
      await fetch("/api/auth/logout", { method: "POST", redirect: "manual" });
    });

    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    const cookies = await page.context().cookies();
    expect(cookies.some((c) => c.name === "sid" && c.value)).toBe(false);
  });

  test("失效 sid 访问 / 时 cookie 被清并跳 /login", async ({ page, context, baseURL }) => {
    await context.clearCookies();
    const url = new URL(baseURL!);
    await context.addCookies([
      {
        name: "sid",
        value: "invalid-sid-not-in-redis",
        domain: url.hostname,
        path: "/",
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/");
    await expect(page).toHaveURL(/\/login$/);
    const cookies = await context.cookies();
    const sid = cookies.find((c) => c.name === "sid");
    // 浏览器收到 Set-Cookie: sid=; Max-Age=0 后会从 context 移除该 cookie
    expect(sid?.value ?? "").toBe("");
  });
});

