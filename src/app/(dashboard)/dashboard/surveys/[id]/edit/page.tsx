import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SurveyBuilder } from "@/components/surveys/survey-builder";

interface EditSurveyPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSurveyPage({ params }: EditSurveyPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <SurveyBuilder mode="edit" templateId={id} />;
}
