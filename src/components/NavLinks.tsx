"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

const links = [
  { href: "/lists", label: "רשימות" },
  { href: "/items", label: "פריטים" },
  { href: "/optimize", label: "אופטימיזציה" },
];

export default function NavLinks() {
  const path = usePathname();
  return (
    <>
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={href as Route}
          className={`rounded-md px-3 py-1.5 text-sm transition-colors
            ${path.startsWith(href)
              ? "bg-blue-600 text-white font-medium"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
        >
          {label}
        </Link>
      ))}
    </>
  );
}
