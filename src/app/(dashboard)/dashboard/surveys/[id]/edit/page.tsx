import { unifiedGetUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { SurveyBuilder } from "@/components/surveys/survey-builder";

export const metadata = {
  title: "Edit Survey Template | RepWell",
  description: "Update questions, logic, and settings for a survey template.",
};

interface EditSurveyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSurveyPage({ params }: EditSurveyPageProps) {
  const { id } = await params;

  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  return <SurveyBuilder mode="edit" templateId={id} />;
}
