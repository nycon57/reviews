import type { EmailDocument } from "./types";
import { DEFAULT_DOCUMENT_SETTINGS } from "./types";

function id() {
  return crypto.randomUUID?.() ?? `block-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_SETTINGS = DEFAULT_DOCUMENT_SETTINGS;

/** Review Request — logo + heading + greeting text + CTA button */
export function makeReviewRequestTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "We'd love your feedback!" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "How was your experience?", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nThank you for working with {{professional_name}} at {{company_name}}. Your feedback helps us improve and helps others make informed decisions.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "button", props: { text: "Leave a Review", href: "{{review_link}}", variant: "primary", size: "lg", align: "center", fullWidth: false } },
      { id: id(), type: "spacer", props: { size: "lg" } },
      { id: id(), type: "text", props: { text: "It only takes a minute and makes a real difference. Thank you!", fontSize: 14, color: "#52796f", align: "center", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
    ],
  };
}

/** Review Reminder — shorter, urgency-focused */
export function makeReviewReminderTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "Your feedback still matters!" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "Just a gentle reminder", level: "h2", color: "#354f52", align: "center" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}}, we noticed you haven't had a chance to share your experience yet. Your feedback means a lot to {{professional_name}} and helps future customers.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "button", props: { text: "Share Your Experience", href: "{{review_link}}", variant: "primary", size: "lg", align: "center", fullWidth: false } },
      { id: id(), type: "spacer", props: { size: "md" } },
    ],
  };
}

/** Thank You — gratitude + social sharing prompt */
export function makeThankYouTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "Thank you for your feedback!" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "Thank you, {{customer_first_name}}!", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "text", props: { text: "Your review means the world to us. Feedback like yours helps {{professional_name}} continue providing exceptional service.", fontSize: 16, color: "#2f3e46", align: "center", fontWeight: "normal" } },
      { id: id(), type: "divider", props: { variant: "solid", color: "#e2e8e4", spacing: "md" } },
      { id: id(), type: "text", props: { text: "Know someone who could benefit from our services? We'd love the introduction!", fontSize: 14, color: "#52796f", align: "center", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
    ],
  };
}

/** Welcome — onboarding welcome */
export function makeWelcomeTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "Welcome aboard!" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "Welcome, {{customer_first_name}}!", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "text", props: { text: "We're thrilled to have you. {{professional_name}} at {{company_name}} is here to make your experience exceptional.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Here's what you can expect from us:", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "bold" } },
      { id: id(), type: "text", props: { text: "• Personalized attention to your needs\n• Transparent communication at every step\n• A commitment to exceeding expectations", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "button", props: { text: "Get Started", href: "{{survey_link}}", variant: "primary", size: "lg", align: "center", fullWidth: false } },
      { id: id(), type: "spacer", props: { size: "md" } },
    ],
  };
}

/** Campaign Generic — two-column highlight + CTA */
export function makeCampaignGenericTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "Something special for you" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "Your Monthly Update", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}}, here's what's new this month.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "divider", props: { variant: "solid", color: "#e2e8e4", spacing: "md" } },
      { id: id(), type: "heading", props: { text: "Highlight of the Month", level: "h3", color: "#354f52", align: "left" } },
      { id: id(), type: "text", props: { text: "Add your campaign content here. Tell your audience about promotions, updates, or valuable resources.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "cta", props: { heading: "Ready to learn more?", description: "", buttonText: "Learn More", buttonHref: "#", variant: "default" } },
      { id: id(), type: "spacer", props: { size: "md" } },
    ],
  };
}

/** Minimal — text-only with branded header/footer */
export function makeMinimalTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "lg" } },
      { id: id(), type: "heading", props: { text: "Your Subject Here", level: "h2", color: "#354f52", align: "left" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nWrite your message here. Keep it simple and focused.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "text", props: { text: "Best regards,\n{{professional_name}}\n{{company_name}}", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "lg" } },
    ],
  };
}

/** Review Request — Branded — header + social proof testimonial + brand CTA */
export function makeReviewRequestBrandedTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "We'd love to hear from you" },
    blocks: [
      { id: id(), type: "header", props: { variant: "centered", logoSrc: "{{company_logo_url}}", logoAlt: "{{company_name}}", logoHeight: 42 } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "Your opinion matters to us", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nThank you for choosing {{company_name}}. {{professional_name}} enjoyed working with you and would be grateful to hear about your experience.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "testimonial", props: { quote: "Working with this team was an outstanding experience. Professional, attentive, and genuinely caring.", authorName: "A Recent Customer", authorTitle: "", authorPhotoUrl: "", rating: 5, variant: "compact" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "cta", props: { heading: "Share your experience", description: "It only takes a minute and helps others make confident decisions.", buttonText: "Write a Review", buttonHref: "{{review_link}}", variant: "brand" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "footer", props: { variant: "default", companyName: "{{company_name}}", address: "", showSocialLinks: false, unsubscribeUrl: "{{unsubscribe_url}}" } },
    ],
  };
}

/** Reminder — Final — urgency-focused last-chance reminder */
export function makeReminderFinalTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "Last chance to share your feedback" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "One last reminder", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "callout", props: { title: "Your feedback window is closing", text: "We'll stop reaching out after this, but we'd really love to hear how things went with {{professional_name}}.", variant: "important" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nThis is our final reminder. Your honest feedback — whether positive or constructive — helps us improve and helps others make informed decisions.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "button", props: { text: "Share Your Feedback Now", href: "{{review_link}}", variant: "primary", size: "lg", align: "center", fullWidth: false } },
      { id: id(), type: "spacer", props: { size: "lg" } },
    ],
  };
}

/** Survey — NPS-style rating scale */
export function makeSurveyTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "We have a quick question for you" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "Quick question, {{customer_first_name}}", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "We value your perspective and would love a quick pulse on your experience with {{professional_name}}. Just tap a number below — it takes seconds.", fontSize: 16, color: "#2f3e46", align: "center", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "rating", props: { question: "How likely are you to recommend {{professional_name}} to a friend or colleague?", scale: 10, surveyUrl: "{{survey_link}}", lowLabel: "Not likely", highLabel: "Very likely" } },
      { id: id(), type: "spacer", props: { size: "lg" } },
    ],
  };
}

/** Survey Follow-Up — Promoter — thank high scorers and ask for public review */
export function makeSurveyFollowUpPromoterTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "Thanks for the great score!" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "You're amazing!", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nThank you for the incredible feedback — it truly made our day! Since you had such a positive experience with {{professional_name}}, would you consider sharing it publicly? A brief review can make a huge difference.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "button-group", props: { buttons: [{ text: "Leave a Google Review", href: "{{review_link}}", variant: "primary" }, { text: "Share on LinkedIn", href: "#", variant: "secondary" }], align: "center", stackOnMobile: true } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "callout", props: { title: "Why reviews matter", text: "Your review helps others find great professionals and rewards the people who go above and beyond.", variant: "tip" } },
      { id: id(), type: "spacer", props: { size: "lg" } },
    ],
  };
}

/** Survey Follow-Up — Detractor — acknowledge low scores, invite further conversation */
export function makeSurveyFollowUpDetractorTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "We appreciate your honesty" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "We appreciate your honesty", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nThank you for sharing your candid feedback. It's not always easy to be honest, and we genuinely respect that. Your experience didn't meet expectations, and we want to make it right.\n\n{{professional_name}} and our team take every piece of feedback seriously. We'd welcome the chance to hear more and work toward a resolution.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "cta", props: { heading: "Let's make it right", description: "Schedule a brief call or share additional details — whatever works best for you.", buttonText: "Share More Details", buttonHref: "{{survey_link}}", variant: "default" } },
      { id: id(), type: "spacer", props: { size: "lg" } },
    ],
  };
}

/** Video Testimonial Request — ask for a short video review */
export function makeVideoTestimonialRequestTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "Would you share a quick video?" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "Your story in your own words", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nWe'd love to hear about your experience with {{professional_name}} — in your own voice. A short video testimonial is one of the most powerful ways to help others feel confident choosing us.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "image", props: { src: "https://placehold.co/560x315/e8f0ec/354f52?text=Record+a+Video", alt: "Record a video testimonial", width: 560, align: "center", borderRadius: 8 } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "button", props: { text: "Record a 60-Second Video", href: "{{review_link}}", variant: "primary", size: "lg", align: "center", fullWidth: false } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "callout", props: { title: "Tips for a great video", text: "Find a quiet, well-lit spot. Speak naturally — no script needed. Share what stood out about your experience and whether you'd recommend us. That's it!", variant: "tip" } },
      { id: id(), type: "spacer", props: { size: "lg" } },
    ],
  };
}

/** Milestone / Anniversary — celebrate a customer milestone */
export function makeMilestoneTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "A milestone worth celebrating!" },
    blocks: [
      { id: id(), type: "header", props: { variant: "centered", logoSrc: "{{company_logo_url}}", logoAlt: "{{company_name}}", logoHeight: 42 } },
      { id: id(), type: "hero", props: { headline: "Celebrating {{milestone_text}}!", description: "Thank you for being part of our journey, {{customer_first_name}}. We're grateful for every moment.", buttonText: "View Your Journey", buttonHref: "{{survey_link}}", imageUrl: "", imageAlt: "", imagePosition: "top" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "stats", props: { items: [{ value: "{{total_reviews}}", label: "Reviews" }, { value: "{{avg_rating}}", label: "Avg Rating" }, { value: "{{months_active}}", label: "Months Active" }], columns: 3, showDividers: true } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "text", props: { text: "These numbers tell a story of trust and consistency. {{professional_name}} and the entire {{company_name}} team are proud to have you as a valued customer. Here's to many more milestones together.", fontSize: 16, color: "#2f3e46", align: "center", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "lg" } },
    ],
  };
}

/** Personal Intro — professional introduction email */
export function makePersonalIntroTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "Nice to meet you!" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "Hi, I'm {{professional_name}}", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "image", props: { src: "https://placehold.co/120x120/e8f0ec/354f52?text=Photo", alt: "{{professional_name}}", width: 120, align: "center", borderRadius: 60 } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nI'm excited to connect with you! I'm a member of the {{company_name}} team, and I'm here to ensure you have an exceptional experience from start to finish.\n\nA little about me — I'm passionate about helping people achieve their goals with personalized guidance and transparent communication.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "list", props: { items: ["Personalized attention tailored to your needs", "Clear, honest communication at every step", "Deep industry expertise you can rely on", "A commitment to exceeding expectations"], type: "check" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "cta", props: { heading: "Let's get started", description: "I'd love to learn more about how I can help you.", buttonText: "Schedule a Conversation", buttonHref: "#", variant: "default" } },
      { id: id(), type: "spacer", props: { size: "lg" } },
    ],
  };
}

/** Newsletter — multi-section newsletter with featured story and tips */
export function makeNewsletterTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "Your monthly newsletter is here" },
    blocks: [
      { id: id(), type: "header", props: { variant: "centered", logoSrc: "{{company_logo_url}}", logoAlt: "{{company_name}}", logoHeight: 42 } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "{{company_name}} Newsletter", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nHere's what's been happening and what's ahead. We've put together the highlights so you stay informed and inspired.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "divider", props: { variant: "solid", color: "#e2e8e4", spacing: "md" } },
      { id: id(), type: "heading", props: { text: "Featured Story", level: "h3", color: "#354f52", align: "left" } },
      { id: id(), type: "text", props: { text: "Add your featured story content here. Highlight a customer success, a company milestone, or an industry insight that your audience will find valuable.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "image", props: { src: "https://placehold.co/560x280/e8f0ec/354f52?text=Featured+Image", alt: "Featured story", width: 560, align: "center", borderRadius: 8 } },
      { id: id(), type: "divider", props: { variant: "solid", color: "#e2e8e4", spacing: "md" } },
      { id: id(), type: "heading", props: { text: "Quick Tips", level: "h3", color: "#354f52", align: "left" } },
      { id: id(), type: "feature-list", props: { items: [{ title: "Tip One", description: "A brief, actionable tip your audience can apply right away." }, { title: "Tip Two", description: "Share an insight or best practice from your area of expertise." }, { title: "Tip Three", description: "Offer a resource, tool, or strategy that adds real value." }], variant: "default", columns: 1 } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "cta", props: { heading: "Want to learn more?", description: "Visit our website for the latest resources and updates.", buttonText: "Read More", buttonHref: "#", variant: "default" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "footer", props: { variant: "default", companyName: "{{company_name}}", address: "", showSocialLinks: true, unsubscribeUrl: "{{unsubscribe_url}}" } },
    ],
  };
}

/** Event Invitation — dark header hero with logistics and RSVP */
export function makeEventInvitationTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "You're invited to a special event" },
    blocks: [
      { id: id(), type: "header", props: { variant: "inline", logoSrc: "{{company_logo_url}}", logoAlt: "{{company_name}}", logoHeight: 42, backgroundColor: "#2f3e46", linkColor: "#cad2c5" } },
      { id: id(), type: "hero", props: { headline: "{{event_name}}", description: "Join us for an exclusive event. Save the date and be part of something special.", buttonText: "RSVP Now", buttonHref: "{{survey_link}}", imageUrl: "", imageAlt: "", imagePosition: "top", contentBackgroundColor: "#2f3e46" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "feature-list", props: { items: [{ title: "Expert Insights", description: "Hear from industry leaders and gain actionable knowledge." }, { title: "Networking", description: "Connect with peers and build meaningful professional relationships." }, { title: "Exclusive Resources", description: "Access tools and materials available only to attendees." }], variant: "default", columns: 1 } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "callout", props: { title: "Event Details", text: "Date: TBD\nTime: TBD\nLocation: TBD\n\nLight refreshments will be provided. Business casual dress code.", variant: "info" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "button-group", props: { buttons: [{ text: "RSVP Yes", href: "{{survey_link}}", variant: "primary" }, { text: "Maybe Later", href: "#", variant: "secondary" }], align: "center", stackOnMobile: true } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "footer", props: { variant: "default", companyName: "{{company_name}}", address: "", showSocialLinks: false, unsubscribeUrl: "{{unsubscribe_url}}" } },
    ],
  };
}

/** We Miss You / Re-engagement — win back inactive contacts */
export function makeReengagementTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "It's been a while — we miss you!" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "It's been a while!", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nWe've noticed it's been some time since we last connected, and we wanted to reach out personally. {{professional_name}} and the {{company_name}} team have been busy making things even better for you.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "stats", props: { items: [{ value: "12+", label: "New Features" }, { value: "500+", label: "Happy Customers" }, { value: "4.9", label: "Avg Rating" }], columns: 3, showDividers: true } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "cta", props: { heading: "See what's new", description: "We've been working hard on improvements we think you'll love.", buttonText: "Come Back & See What's New", buttonHref: "#", variant: "brand" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "testimonial", props: { quote: "I came back after a few months away and was blown away by the improvements. Better than ever!", authorName: "A Returning Customer", authorTitle: "", authorPhotoUrl: "", rating: 5, variant: "featured" } },
      { id: id(), type: "spacer", props: { size: "lg" } },
    ],
  };
}

/** Referral Request — ask happy customers to refer others */
export function makeReferralRequestTemplate(): EmailDocument {
  return {
    settings: { ...DEFAULT_SETTINGS, previewText: "Know someone who could use our help?" },
    blocks: [
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "logo", props: { src: "{{company_logo_url}}", alt: "{{company_name}}", width: 150, align: "center" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "heading", props: { text: "Spread the word", level: "h1", color: "#354f52", align: "center" } },
      { id: id(), type: "spacer", props: { size: "sm" } },
      { id: id(), type: "text", props: { text: "Hi {{customer_first_name}},\n\nThank you for being a valued customer of {{company_name}}. The best compliment we can receive is a referral from someone like you. If you know a friend, colleague, or family member who could benefit from working with {{professional_name}}, we'd be honored by the introduction.", fontSize: 16, color: "#2f3e46", align: "left", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "callout", props: { title: "Referral reward", text: "As a thank-you for every successful referral, you'll receive a special reward. It's our way of showing appreciation for your trust.", variant: "tip" } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "button-group", props: { buttons: [{ text: "Refer a Friend", href: "#", variant: "primary" }, { text: "Share via Email", href: "#", variant: "secondary" }], align: "center", stackOnMobile: true } },
      { id: id(), type: "spacer", props: { size: "md" } },
      { id: id(), type: "text", props: { text: "How it works: simply share your unique referral link or forward this email. When your referral becomes a customer, you'll both benefit.", fontSize: 14, color: "#52796f", align: "center", fontWeight: "normal" } },
      { id: id(), type: "spacer", props: { size: "lg" } },
    ],
  };
}

export interface StarterTemplate {
  name: string;
  description: string;
  category: string;
  subject: string;
  document: EmailDocument;
}

interface StarterTemplateConfig {
  name: string;
  description: string;
  category: string;
  subject: string;
  makeDocument: () => EmailDocument;
}

const STARTER_CONFIGS: StarterTemplateConfig[] = [
  {
    name: "Review Request",
    description: "Ask customers for a review after their experience",
    category: "review_request",
    subject: "{{customer_first_name}}, how was your experience?",
    makeDocument: makeReviewRequestTemplate,
  },
  {
    name: "Review Reminder",
    description: "Gentle follow-up for pending reviews",
    category: "review_reminder",
    subject: "Your feedback still matters, {{customer_first_name}}",
    makeDocument: makeReviewReminderTemplate,
  },
  {
    name: "Thank You",
    description: "Thank customers after they submit a review",
    category: "thank_you",
    subject: "Thank you for your feedback!",
    makeDocument: makeThankYouTemplate,
  },
  {
    name: "Welcome",
    description: "Onboarding welcome email for new contacts",
    category: "welcome",
    subject: "Welcome, {{customer_first_name}}!",
    makeDocument: makeWelcomeTemplate,
  },
  {
    name: "Campaign",
    description: "General-purpose campaign email with highlights",
    category: "campaign",
    subject: "Your monthly update from {{company_name}}",
    makeDocument: makeCampaignGenericTemplate,
  },
  {
    name: "Minimal",
    description: "Clean text-only email — no frills",
    category: "custom",
    subject: "A message from {{professional_name}}",
    makeDocument: makeMinimalTemplate,
  },
  {
    name: "Review Request — Branded",
    description: "Branded review request with social proof and header/footer",
    category: "review_request",
    subject: "{{company_name}} values your feedback, {{customer_first_name}}",
    makeDocument: makeReviewRequestBrandedTemplate,
  },
  {
    name: "Reminder — Final",
    description: "Last-chance reminder with urgency callout",
    category: "review_reminder",
    subject: "Last chance to share your thoughts, {{customer_first_name}}",
    makeDocument: makeReminderFinalTemplate,
  },
  {
    name: "Survey",
    description: "NPS-style survey with inline rating scale",
    category: "survey",
    subject: "Quick question, {{customer_first_name}}",
    makeDocument: makeSurveyTemplate,
  },
  {
    name: "Survey Follow-Up — Promoter",
    description: "Thank high scorers and ask for a public review",
    category: "survey_followup",
    subject: "Thanks for the great score, {{customer_first_name}}!",
    makeDocument: makeSurveyFollowUpPromoterTemplate,
  },
  {
    name: "Survey Follow-Up — Detractor",
    description: "Acknowledge low scores and invite further conversation",
    category: "survey_followup",
    subject: "We hear you, {{customer_first_name}}",
    makeDocument: makeSurveyFollowUpDetractorTemplate,
  },
  {
    name: "Video Testimonial Request",
    description: "Ask customers for a short video review",
    category: "review_request",
    subject: "Would you share a quick video, {{customer_first_name}}?",
    makeDocument: makeVideoTestimonialRequestTemplate,
  },
  {
    name: "Milestone / Anniversary",
    description: "Celebrate a customer milestone with stats and a hero section",
    category: "milestone",
    subject: "Happy {{milestone_text}}, {{customer_first_name}}!",
    makeDocument: makeMilestoneTemplate,
  },
  {
    name: "Personal Intro",
    description: "Professional introduction email with services overview",
    category: "introduction",
    subject: "Nice to meet you! I'm {{professional_name}}",
    makeDocument: makePersonalIntroTemplate,
  },
  {
    name: "Newsletter",
    description: "Multi-section newsletter with featured story and tips",
    category: "newsletter",
    subject: "{{company_name}} Newsletter — {{month_year}}",
    makeDocument: makeNewsletterTemplate,
  },
  {
    name: "Event Invitation",
    description: "Event invite with RSVP, logistics, and what to expect",
    category: "event",
    subject: "You're invited: {{event_name}}",
    makeDocument: makeEventInvitationTemplate,
  },
  {
    name: "We Miss You",
    description: "Re-engagement email to win back inactive contacts",
    category: "reengagement",
    subject: "We miss you, {{customer_first_name}}",
    makeDocument: makeReengagementTemplate,
  },
  {
    name: "Referral Request",
    description: "Ask happy customers to refer friends and colleagues",
    category: "referral",
    subject: "Know someone who could use our help, {{customer_first_name}}?",
    makeDocument: makeReferralRequestTemplate,
  },
];

/** Each access produces fresh block IDs */
export const STARTER_TEMPLATES: StarterTemplate[] = STARTER_CONFIGS.map((c) => ({
  name: c.name,
  description: c.description,
  category: c.category,
  subject: c.subject,
  get document() {
    return c.makeDocument();
  },
}));
