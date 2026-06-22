import Link from "next/link";
import { Stethoscope } from "lucide-react";
import { PageHeader } from "@/components/page-header";

export function RoleGate({ roleLabel }: { roleLabel: string }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <PageHeader
        icon={Stethoscope}
        title="Access restricted"
        description={`Your account does not have the ${roleLabel} role required for this page.`}
      />
      <p className="mt-4 text-sm leading-relaxed text-ink-600">
        New sign-ups are health workers by default. Ask an admin to promote your account, or sign in
        with a seeded demo cardiologist email if you are testing the pilot.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-primary">
          Back to home
        </Link>
        <Link href="/demo" className="btn-secondary">
          Demo guide
        </Link>
      </div>
    </main>
  );
}
