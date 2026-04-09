import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Smart Cart IL",
  description: "Find the cheapest grocery basket in Israel."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between p-4">
            <Link href="/" className="font-semibold">
              Smart Cart IL
            </Link>
            <div className="flex gap-3 text-sm">
              <Link href="/lists">My Lists</Link>
              <Link href="/optimize">Optimize</Link>
              <Link href="/admin/clusters">Admin</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl p-4">{children}</main>
      </body>
    </html>
  );
}
