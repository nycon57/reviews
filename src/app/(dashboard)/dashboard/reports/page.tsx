import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getReportTemplates, initializeDefaultTemplates } from "@/lib/reporting";
import { ReportsDashboard } from "./reports-dashboard";

export const metadata = {
  title: "Reports | ReviewHub",
  description: "Generate and export performance reports",
};

export default async function ReportsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile with organization
  const { data: profile } = await supabase
    .from("users")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) {
    redirect("/login");
  }

  // Check role - only managers and admins can access reports
  if (profile.role !== "manager" && profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Initialize default templates for the organization if needed
  await initializeDefaultTemplates();

  // Get templates
  const templatesResult = await getReportTemplates();
  const templates = templatesResult.success ? templatesResult.data || [] : [];

  // Get loan officers for filtering
  const { data: loanOfficers } = await supabase
    .from("loan_officers")
    .select("id, full_name, branch")
    .eq("organization_id", profile.organization_id)
    .eq("is_active", true)
    .order("full_name");

  // Get unique branches
  const branches = Array.from(
    new Set(
      (loanOfficers || [])
        .map((lo) => lo.branch)
        .filter((b): b is string => !!b)
    )
  );

  return (
    <ReportsDashboard
      templates={templates}
      loanOfficers={loanOfficers || []}
      branches={branches}
    />
  );
}
