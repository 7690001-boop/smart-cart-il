"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function AuthMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-xs text-slate-500">טוען משתמש...</span>;
  }

  if (!session?.user?.email) {
    return (
      <button
        onClick={() => signIn("google", { callbackUrl: "/items" })}
        className="rounded bg-blue-600 px-3 py-1 text-white"
      >
        התחברות Gmail
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-700">
        {session.user.email}
        {session.user.isAdmin ? " (מנהל)" : ""}
      </span>
      {session.user.isAdmin ? (
        <>
          <Link href="/admin/clusters" className="text-xs underline">
            ניהול התאמות
          </Link>
          <Link href="/admin/import-status" className="text-xs underline">
            סטטוס ייבוא
          </Link>
        </>
      ) : null}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded border px-2 py-1 text-xs"
      >
        התנתקות
      </button>
    </div>
  );
}
