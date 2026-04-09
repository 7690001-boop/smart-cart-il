import { cookies } from "next/headers";
import { users } from "@/lib/data";

const AUTH_COOKIE = "smart_cart_user_id";

export async function getCurrentUserId() {
  const jar = await cookies();
  return jar.get(AUTH_COOKIE)?.value ?? null;
}

export async function requireUserId() {
  const userId = await getCurrentUserId();
  if (!userId || !users.some((u) => u.id === userId)) {
    return null;
  }
  return userId;
}
