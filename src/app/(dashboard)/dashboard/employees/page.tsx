import { requireEnterpriseManager } from "@/lib/access";
import { EmployeesPageClient } from "./employees-page-client";

export const metadata = {
  title: "Employees | RepWell",
  description: "Manage your organization's employee directory",
};

export default async function EmployeesPage() {
  await requireEnterpriseManager();

  return <EmployeesPageClient />;
}
