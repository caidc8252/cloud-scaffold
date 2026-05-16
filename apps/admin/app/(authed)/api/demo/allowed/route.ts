import { AuthzError, assertPermissions } from "@cloud/auth";

export async function GET() {
  try {
    const session = await assertPermissions({ all: ["user.manage"] });
    return Response.json({
      ok: true,
      message: "you can read this because you have user.manage",
      account: session.account,
    });
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
