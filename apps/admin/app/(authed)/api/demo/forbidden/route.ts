import { AuthzError, assertPermissions } from "@cloud/auth";
import {
  forbiddenResponse,
  successResponse,
  unauthorizedResponse,
} from "@cloud/request/server";

export async function GET() {
  try {
    await assertPermissions({ all: ["user.export"] });
    return successResponse({ message: "ok" });
  } catch (e) {
    if (e instanceof AuthzError) {
      return e.status === 401
        ? await unauthorizedResponse()
        : await forbiddenResponse();
    }
    throw e;
  }
}
