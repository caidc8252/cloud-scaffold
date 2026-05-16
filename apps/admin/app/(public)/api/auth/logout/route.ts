import { redirect } from "next/navigation";
import { destroyCurrentSession } from "@cloud/auth";

async function handler() {
  await destroyCurrentSession();
  redirect("/login");
}

export { handler as GET, handler as POST };
