import type { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/actions";
import { getOpenIndividualDisputes } from "@/lib/reviews/dispute-staff-actions";
import { StaffDisputesClient } from "./staff-disputes-client";

export const metadata: Metadata = {
  title: "Disputes | Staff | RepWell",
  description: "Review individual-account dispute escalations",
};

export default async function StaffDisputesPage() {
  await requirePlatformAdmin();
  const result = await getOpenIndividualDisputes();

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6">
      <StaffDisputesClient
        disputes={result.success ? result.data?.disputes ?? [] : []}
        loadError={result.success ? null : result.error ?? "Failed to load disputes"}
      />
    </div>
  );
}
