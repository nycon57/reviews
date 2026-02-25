/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - ex_surveys tables not in generated types yet
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { EXTemplateBuilder } from "@/components/ex-surveys";
import { getEXSurveyTemplate } from "@/lib/ex-surveys/actions";

export const metadata = {
  title: "Edit Template | Employee Experience | RepWell",
  description: "Edit your employee experience survey template",
};

interface EditTemplatePageProps {
  params: Promise<{ id: string }>;
}

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

export default async function EditTemplatePage({ params }: EditTemplatePageProps) {
  const { organizationId } = await checkAccess();
  const { id } = await params;

  // Fetch the template
  const result = await getEXSurveyTemplate(id);

  if (!result.data) {
    notFound();
  }

  const template = result.data;

  // Cannot edit default templates
  if (template.isDefault) {
    redirect(`/dashboard/ex-surveys/templates?error=cannot-edit-default`);
  }

  // Can only edit templates owned by this organization
  if (template.organizationId !== organizationId) {
    redirect(`/dashboard/ex-surveys/templates?error=not-owner`);
  }

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
          <h1 className="font-display text-2xl font-bold tracking-tight text-repwell-teal-500">
            Edit Template
          </h1>
          <p className="font-sans text-repwell-teal-400">
            Modify your custom survey template
          </p>
        </div>
      </div>

      {/* Template Builder */}
      <EXTemplateBuilder mode="edit" initialTemplate={template} />
    </div>
  );
}
