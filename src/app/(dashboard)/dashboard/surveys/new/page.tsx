import { unifiedGetUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";
import { SurveyBuilder } from "@/components/surveys/survey-builder";

export const metadata = {
  title: "New Survey Template | RepWell",
  description: "Build a new survey template for your organization.",
};

export default async function NewSurveyPage() {
  const user = await unifiedGetUser();

  if (!user) {
    redirect("/login");
  }

  return <SurveyBuilder mode="create" />;
}
