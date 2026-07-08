import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { requirePlatformAdmin } from "@/lib/auth/actions";

export default async function StaffLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/80">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-repwell-teal-300/10">
              <ShieldCheck className="h-5 w-5 text-repwell-teal-300" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                RepWell
              </p>
              <h1 className="text-lg font-semibold leading-tight text-heading">
                RepWell Staff
              </h1>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
