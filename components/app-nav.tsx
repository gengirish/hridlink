"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart } from "lucide-react";

const links = [
  { href: "/register", label: "Register" },
  { href: "/ecg-upload", label: "Upload ECG" },
  { href: "/cardiologist", label: "Cardiologist" },
  { href: "/admin", label: "Admin" },
];

export function AppNav() {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/sign-");
  if (isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-100 px-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between h-12">
        <Link href="/" className="flex items-center gap-1.5 text-brand-700 font-bold text-sm">
          <Heart className="w-4 h-4 text-brand-600" />
          HridLink
        </Link>
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                pathname === l.href || pathname.startsWith(l.href + "/")
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
