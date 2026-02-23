import { EXSurveyTemplate } from "@/types/ex-survey.types";

// Wizard step enum
export type WizardStep = 1 | 2 | 3 | 4;

// Step metadata
export interface StepInfo {
  number: WizardStep;
  label: string;
  description: string;
}

export const WIZARD_STEPS: StepInfo[] = [
  { number: 1, label: "Template", description: "Choose survey template" },
  { number: 2, label: "Details", description: "Name and audience" },
  { number: 3, label: "Schedule", description: "Set timing" },
  { number: 4, label: "Review", description: "Confirm and send" },
];

// Form data collected across all steps
export interface WizardFormData {
  // Step 1: Template
  templateId: string;

  // Step 2: Details & Audience
  name: string;
  description: string;
  isAnonymous: boolean;
  targetDepartment: string; // "__all__" or department name (text)

  // Step 3: Schedule
  launchImmediately: boolean;
  startDate?: Date;
  endDate?: Date;
}

// Initial form state
export const INITIAL_FORM_DATA: WizardFormData = {
  templateId: "",
  name: "",
  description: "",
  isAnonymous: true,
  targetDepartment: "__all__",
  launchImmediately: true,
  startDate: undefined,
  endDate: undefined,
};

// Props shared across step components
export interface StepProps {
  formData: WizardFormData;
  setFormData: React.Dispatch<React.SetStateAction<WizardFormData>>;
  templates: EXSurveyTemplate[];
  departments: string[];
}

// Validation per step
export function isStepValid(step: WizardStep, formData: WizardFormData): boolean {
  switch (step) {
    case 1:
      return formData.templateId.length > 0;
    case 2:
      return formData.name.trim().length > 0;
    case 3:
      // Schedule step - validate date range if both dates are set
      if (formData.startDate && formData.endDate) {
        const start = formData.startDate instanceof Date ? formData.startDate : new Date(formData.startDate);
        const end = formData.endDate instanceof Date ? formData.endDate : new Date(formData.endDate);
        return start < end;
      }
      // If launching immediately, no date validation needed
      if (formData.launchImmediately) {
        return true;
      }
      // If not launching immediately and no start date, invalid
      if (!formData.launchImmediately && !formData.startDate) {
        return false;
      }
      return true;
    case 4:
      // Review step - all validations passed
      return true;
    default:
      return false;
  }
}

// Animation direction for transitions
export type AnimationDirection = 1 | -1;

// Animation variants for step transitions
export const stepVariants = {
  initial: (direction: AnimationDirection) => ({
    opacity: 0,
    x: direction > 0 ? 20 : -20,
  }),
  enter: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
  exit: (direction: AnimationDirection) => ({
    opacity: 0,
    x: direction > 0 ? -20 : 20,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] },
  }),
};
