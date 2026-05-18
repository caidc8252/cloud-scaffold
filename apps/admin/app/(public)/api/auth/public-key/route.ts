import { getEnv } from "@cloud/config";
import { successResponse } from "@cloud/request/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return successResponse({ publicKey: getEnv().LOGIN_PUBLIC_KEY_PEM });
}
