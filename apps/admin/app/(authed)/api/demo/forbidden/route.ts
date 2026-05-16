import { AuthzError, assertPermissions } from "@cloud/auth";

export async function GET() {
  try {
    await assertPermissions({ all: ["user.export"] });
    return Response.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthzError) {
      return Response.json(
        { code: e.code, missing: e.missing },
        { status: e.status },
      );
    }
    throw e;
  }
}
