import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { unifiedGetUser } from "@/lib/auth/actions";
import { getReportTemplates, initializeDefaultTemplates } from "@/lib/reporting";
import { ReportsDashboard } from "./reports-dashboard";

export const metadata = {
  title: "Reports | RepWell",
  description: "Generate and export performance reports",
};

export default async function ReportsPage() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  const supabase = createAdminClient();

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

  // Get professionals for filtering
  const { data: usersData } = await supabase
    .from("users")
    .select("id, full_name, branch")
    .eq("organization_id", profile.organization_id)
    .eq("is_active", true)
    .not("full_name", "is", null)
    .order("full_name");

  // Filter and ensure proper types
  const users = (usersData || [])
    .filter((u): u is typeof u & { full_name: string } => !!u.full_name)
    .map((user) => ({ id: user.id, full_name: user.full_name, branch: user.branch }));

  // Get unique branches
  const branches = Array.from(
    new Set(
      users
        .map((user) => user.branch)
        .filter((b): b is string => !!b)
    )
  );

  return (
    <ReportsDashboard
      templates={templates}
      teamMembers={users}
      branches={branches}
    />
  );
}
