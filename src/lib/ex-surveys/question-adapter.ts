/**
 * Adapter utilities to transform EXQuestion format to standard Question format
 * for reuse of existing survey renderers.
 *
 * EXQuestion uses:
 * - `text` field (Question uses `title`)
 * - `scale.labels[]` as array (Question uses `config.labels` as object)
 * - `single_choice` type (Question uses `multiple_choice` with `allowMultiple: false`)
 */

import type { EXQuestion, EXSurveyTemplate } from "@/types/ex-survey.types";
import type {
  Question,
  RatingQuestion,
  NPSQuestion,
  TextQuestion,
  MultipleChoiceQuestion,
  SurveyTemplate,
} from "@/types/survey.types";

/**
 * Adapts an EXQuestion to the standard Question format used by QuestionRenderer
 */
export function adaptEXQuestionToQuestion(exQuestion: EXQuestion): Question {
  const baseQuestion = {
    id: exQuestion.id,
    title: exQuestion.text,
    description: exQuestion.description,
    required: exQuestion.required,
    order: exQuestion.order,
  };

  switch (exQuestion.type) {
    case "rating": {
      const scaleLabels = exQuestion.scale?.labels || [];
      return {
        ...baseQuestion,
        type: "rating",
        config: {
          maxRating: exQuestion.scale?.max || 5,
          labels: {
            low: scaleLabels[0] || "Poor",
            high: scaleLabels[scaleLabels.length - 1] || "Excellent",
          },
        },
      } as RatingQuestion;
    }

    case "nps": {
      const scaleLabels = exQuestion.scale?.labels || [];
      return {
        ...baseQuestion,
        type: "nps",
        config: {
          labels: {
            detractor: scaleLabels[0] || "Not at all likely",
            passive: scaleLabels.length > 2 ? scaleLabels[Math.floor(scaleLabels.length / 2)] : "Neutral",
            promoter: scaleLabels[scaleLabels.length - 1] || "Extremely likely",
          },
        },
      } as NPSQuestion;
    }

    case "text": {
      return {
        ...baseQuestion,
        type: "text",
        config: {
          multiline: true,
          placeholder: "Enter your response...",
        },
      } as TextQuestion;
    }

    case "single_choice": {
      const options = (exQuestion.options || []).map((opt, index) => ({
        id: `opt-${index}`,
        label: opt,
        value: opt.toLowerCase().replace(/\s+/g, "_"),
      }));
      return {
        ...baseQuestion,
        type: "multiple_choice",
        config: {
          options,
          allowMultiple: false,
          allowOther: false,
        },
      } as MultipleChoiceQuestion;
    }

    case "multiple_choice": {
      const options = (exQuestion.options || []).map((opt, index) => ({
        id: `opt-${index}`,
        label: opt,
        value: opt.toLowerCase().replace(/\s+/g, "_"),
      }));
      return {
        ...baseQuestion,
        type: "multiple_choice",
        config: {
          options,
          allowMultiple: true,
          allowOther: false,
        },
      } as MultipleChoiceQuestion;
    }

    default:
      // Fallback to text type for unknown question types
      return {
        ...baseQuestion,
        type: "text",
        config: {
          multiline: true,
          placeholder: "Enter your response...",
        },
      } as TextQuestion;
  }
}

/**
 * Adapts an EXSurveyTemplate to the standard SurveyTemplate format
 * for use with existing survey preview components
 */
export function adaptEXTemplateToSurveyTemplate(template: EXSurveyTemplate): SurveyTemplate {
  return {
    id: template.id,
    organizationId: template.organizationId,
    name: template.name,
    description: template.description,
    questions: template.questions.map(adaptEXQuestionToQuestion),
    branding: template.branding,
    thankYouConfig: template.thankYouConfig
      ? {
          title: template.thankYouConfig.title,
          message: template.thankYouConfig.message,
          showSocialShare: template.thankYouConfig.showSocialShare,
          redirectUrl: template.thankYouConfig.redirectUrl,
          redirectDelay: template.thankYouConfig.redirectDelay,
        }
      : undefined,
    isActive: template.isActive,
    isDefault: template.isDefault,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
    createdBy: template.createdBy,
  };
}

/**
 * Creates a default EXQuestion with standard defaults
 */
export function createDefaultEXQuestion(
  type: EXQuestion["type"],
  order: number
): EXQuestion {
  const id = globalThis.crypto.randomUUID();
  const baseQuestion = {
    id,
    text: "",
    required: true,
    order,
  };

  switch (type) {
    case "rating":
      return {
        ...baseQuestion,
        type: "rating",
        scale: {
          min: 1,
          max: 5,
          labels: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
        },
      };
    case "nps":
      return {
        ...baseQuestion,
        type: "nps",
        scale: {
          min: 0,
          max: 10,
          labels: ["Not at all likely", "Neutral", "Extremely likely"],
        },
      };
    case "text":
      return {
        ...baseQuestion,
        type: "text",
      };
    case "single_choice":
      return {
        ...baseQuestion,
        type: "single_choice",
        options: ["Option 1", "Option 2"],
      };
    case "multiple_choice":
      return {
        ...baseQuestion,
        type: "multiple_choice",
        options: ["Option 1", "Option 2"],
      };
    default:
      return {
        ...baseQuestion,
        type: "text",
      };
  }
}

/**
 * Calculates estimated time in minutes for a template based on question count and types
 */
export function calculateEstimatedTime(questions: EXQuestion[]): number {
  // Base time of 1 minute
  let minutes = 1;

  for (const question of questions) {
    switch (question.type) {
      case "nps":
      case "rating":
      case "single_choice":
        minutes += 0.3; // Quick questions
        break;
      case "multiple_choice":
        minutes += 0.4; // Slightly longer
        break;
      case "text":
        minutes += 0.8; // Text takes longer
        break;
      default:
        minutes += 0.5;
    }
  }

  return Math.ceil(minutes);
}
