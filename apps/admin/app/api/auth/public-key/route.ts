import { getEnv } from "@cloud/config";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ publicKey: getEnv().LOGIN_PUBLIC_KEY_PEM });
}
