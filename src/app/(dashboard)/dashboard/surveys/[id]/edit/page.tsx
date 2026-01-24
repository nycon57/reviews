import { unifiedGetUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { SurveyBuilder } from "@/components/surveys/survey-builder";

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
