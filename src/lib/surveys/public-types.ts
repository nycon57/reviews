import type { SurveyTemplate } from "@/types/survey.types";

// Types for public survey data
export interface PublicSurvey {
  id: string;
  token: string;
  customerName: string;
  customerEmail: string;
  status: string;
  expiresAt: string | null;
  completedAt: string | null;
  loanOfficer: {
    id: string;
    fullName: string;
    photoUrl: string | null;
    title: string | null;
  };
  organization: {
    id: string;
    name: string;
    logoUrl: string | null;
    primaryColor: string | null;
  };
  template: SurveyTemplate;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
