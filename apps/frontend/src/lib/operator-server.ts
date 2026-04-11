import { cookies } from "next/headers";
import { SESSION_TOKEN_COOKIE } from "@/lib/operator";

export async function getCurrentSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_TOKEN_COOKIE)?.value?.trim() ?? "";
}
