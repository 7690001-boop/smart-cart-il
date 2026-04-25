import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import AuthMenu from "@/components/AuthMenu";
import SessionProviderClient from "@/components/SessionProviderClient";
import NavLinks from "@/components/NavLinks";

export const metadata: Metadata = {
  title: "Smart Cart IL",
  description: "מציאת סל הקניות הזול ביותר בישראל."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen">
        <SessionProviderClient>
          <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur-sm shadow-sm">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2 font-bold text-blue-600 text-lg">
                🛒 Smart Cart IL
              </Link>
              <div className="flex items-center gap-1">
                <NavLinks />
                <div className="mx-2 h-5 w-px bg-slate-200" />
                <AuthMenu />
              </div>
            </nav>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        </SessionProviderClient>
      </body>
    </html>
  );
}
