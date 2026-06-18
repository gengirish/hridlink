import Link from "next/link";
import { Heart } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <div className="w-12 h-12 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-4">
          <Heart className="w-6 h-6 text-brand-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Page not found</h1>
        <p className="text-sm text-slate-500 mb-6">
          This page doesn&apos;t exist in HridLink.
        </p>
        <Link href="/" className="btn-primary inline-flex">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
