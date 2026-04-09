import { cookies } from "next/headers";
import { users } from "@/lib/data";
import { isAdminUserId } from "@/lib/admin";

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

export async function requireAdminUserId() {
  const userId = await requireUserId();
  if (!userId || !isAdminUserId(userId)) return null;
  return userId;
}
