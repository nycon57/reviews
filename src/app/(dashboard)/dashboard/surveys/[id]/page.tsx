import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { getSurveyTemplate } from "@/lib/surveys/actions";
import { SurveyTemplateDetail } from "./survey-template-detail";

export const metadata = {
  title: "Survey Template Details | RepWell",
  description: "Review and manage an existing survey template.",
};

interface SurveyDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function SurveyDetailPage({ params }: SurveyDetailPageProps) {
  const { id } = await params;

  const ctx = await getAccessContext();

  if (!ctx) {
    redirect("/login");
  }

  if (!hasPermission(ctx, PERMISSIONS.MANAGE_SURVEY_TEMPLATES)) {
    redirect("/dashboard");
  }

  const result = await getSurveyTemplate(id);

  if (!result.success || !result.data) {
    redirect("/dashboard/surveys");
  }

  return <SurveyTemplateDetail template={result.data} />;
}
