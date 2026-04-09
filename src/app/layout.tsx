import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import AuthMenu from "@/components/AuthMenu";
import SessionProviderClient from "@/components/SessionProviderClient";

export const metadata: Metadata = {
  title: "Smart Cart IL",
  description: "מציאת סל הקניות הזול ביותר בישראל."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen">
        <SessionProviderClient>
          <header className="border-b bg-white">
            <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
              <Link href="/" className="font-semibold">
                Smart Cart IL
              </Link>
              <div className="flex items-center gap-3 text-sm">
                <Link href="/lists">רשימות</Link>
                <Link href="/items">פריטים</Link>
                <Link href="/optimize">אופטימיזציה</Link>
                <AuthMenu />
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-5xl p-4">{children}</main>
        </SessionProviderClient>
      </body>
    </html>
  );
}
