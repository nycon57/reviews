import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SurveyBuilder } from "@/components/surveys/survey-builder";

export default async function NewSurveyPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <SurveyBuilder mode="create" />;
}
