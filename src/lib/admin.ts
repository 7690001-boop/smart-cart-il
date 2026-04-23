import { users } from "@/lib/data";

export function getAdminEmails() {
  const envList = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  const seededAdmins = users
    .filter((u) => u.role === "admin")
    .map((u) => u.email.toLowerCase());

  return new Set([...seededAdmins, ...envList]);
}

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return getAdminEmails().has(email.toLowerCase());
}

export function isAdminUserId(userId?: string | null) {
  if (!userId) return false;
  return users.some((u) => u.id === userId && u.role === "admin");
}
