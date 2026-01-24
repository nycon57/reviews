import { Suspense } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { WebhooksPageContent } from "./webhooks-page-content";
import { CardSkeleton } from "@/components/shared/skeletons";

export const metadata = {
  title: "Webhooks | RepWell",
  description: "Manage webhook integrations and view webhook logs",
};

export default async function WebhooksPage() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

  // Check if user is admin
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Webhooks</h1>
        <p className="text-muted-foreground">
          Manage webhook endpoints, test integrations, and view webhook logs
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
            <CardSkeleton />
          </div>
        }
      >
        <WebhooksPageContent />
      </Suspense>
    </div>
  );
}
