import { AuthzError, assertPermissions } from "@cloud/auth";
import {
  forbiddenResponse,
  successResponse,
  unauthorizedResponse,
} from "@cloud/request";

export async function GET() {
  try {
    const session = await assertPermissions({ all: ["user.manage"] });
    return successResponse({
      message: "you can read this because you have user.manage",
      account: session.account,
    });
  } catch (e) {
    if (e instanceof AuthzError) {
      return e.status === 401
        ? await unauthorizedResponse()
        : await forbiddenResponse();
    }
    throw e;
  }
}
