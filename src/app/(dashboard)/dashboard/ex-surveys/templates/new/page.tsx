/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - ex_surveys tables not in generated types yet
import { redirect } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { EXTemplateBuilder } from "@/components/ex-surveys";

export const metadata = {
  title: "Create Template | Employee Experience | RepWell",
  description: "Create a custom employee experience survey template",
};

async function checkAccess() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();
  const { data: userData } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!userData?.organization_id) {
    redirect("/dashboard");
  }

  if (userData.role !== "admin" && userData.role !== "manager") {
    redirect("/dashboard");
  }

  return { organizationId: userData.organization_id, role: userData.role };
}

export default async function NewTemplatePage() {
  await checkAccess();

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          asChild
          aria-label="Back to survey templates"
        >
          <Link href="/dashboard/ex-surveys/templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-heading">
            Create Custom Template
          </h1>
          <p className="font-sans text-label">
            Build a custom survey template for your organization
          </p>
        </div>
      </div>

      {/* Template Builder */}
      <EXTemplateBuilder mode="create" />
    </div>
  );
}
