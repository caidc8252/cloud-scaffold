"use server";

import { requirePermissions } from "@cloud/auth";

export type DemoActionResult = { ok: true; message: string };

export async function allowedAction(): Promise<DemoActionResult> {
  const session = await requirePermissions({ all: ["user.manage"] });
  return {
    ok: true,
    message: `Action ran for ${session.account} (has user.manage)`,
  };
}

export async function forbiddenAction(): Promise<DemoActionResult> {
  await requirePermissions({ all: ["user.export"] });
  return { ok: true, message: "unreachable" };
}
