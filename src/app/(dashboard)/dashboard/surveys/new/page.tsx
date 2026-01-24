import { unifiedGetUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { SurveyBuilder } from "@/components/surveys/survey-builder";

export default async function NewSurveyPage() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  return <SurveyBuilder mode="create" />;
}
