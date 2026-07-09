import { Metadata } from "next";
import { getSurveyByToken } from "@/lib/surveys/public-actions";
import { PublicSurveyForm } from "./public-survey-form";
import { SurveyError } from "./survey-error";

interface PageProps {
  params: Promise<{
    token: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const result = await getSurveyByToken(token);

  if (!result.success || !result.data) {
    return {
      title: "Survey Not Found",
      description: "This survey link is invalid or has expired.",
    };
  }

  const { organization, loanOfficer } = result.data;

  return {
    title: `Share Your Experience - ${organization.name}`,
    description: `Tell us about your experience with ${loanOfficer.fullName}`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function PublicSurveyPage({ params }: PageProps) {
  const { token } = await params;
  const result = await getSurveyByToken(token);

  if (!result.success || !result.data) {
    return <SurveyError message={result.error || "Survey not found"} />;
  }

  return <PublicSurveyForm key={result.data.token} survey={result.data} />;
}
