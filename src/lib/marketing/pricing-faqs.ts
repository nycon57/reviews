import { MARKETING_TRIAL_FACTS } from "./pricing-facts";

export interface MarketingFAQItem {
  question: string;
  answer: string;
}

export const PRICING_FAQS: readonly MarketingFAQItem[] = [
  {
    question: "How does the free trial work?",
    answer: `Start your ${MARKETING_TRIAL_FACTS.shortCopy} with full access to all features in your selected plan. ${MARKETING_TRIAL_FACTS.creditCardCopy} You won't be charged until the trial ends.`,
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, the change takes effect at your next billing cycle.",
  },
  {
    question: "What happens if I exceed my survey limit?",
    answer:
      "You'll receive a notification when you're approaching your limit. You can either upgrade to a higher plan or purchase additional survey credits as needed. We won't automatically charge you for overages.",
  },
  {
    question: "Is there a setup fee?",
    answer:
      "No, there are no setup fees. You can get started immediately after signing up. Our onboarding team is available to help you configure your account at no extra cost.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express) and ACH bank transfers for annual plans. Enterprise customers can also pay by invoice.",
  },
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes, you can cancel your subscription at any time. Your account will remain active until the end of your current billing period. We don't offer prorated refunds for partial months.",
  },
  {
    question: "Do you offer discounts for nonprofits?",
    answer:
      "Yes, we offer a 20% discount for registered nonprofit organizations. Contact our sales team with proof of nonprofit status to receive your discount code.",
  },
  {
    question: "What kind of support is included?",
    answer:
      "All plans include email support with response within 24 hours. Pro plans include priority support with faster response times. Enterprise plans include a dedicated account manager and phone support.",
  },
];
