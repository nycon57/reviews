import type { Metadata } from "next";
import { ContactPageClient } from "./contact-client";

export const metadata: Metadata = {
  title: "Contact Us | ReviewHub - Get in Touch",
  description:
    "Have questions about ReviewHub? Contact our team for sales inquiries, technical support, or partnership opportunities. We typically respond within one business day.",
  openGraph: {
    title: "Contact Us | ReviewHub",
    description:
      "Get in touch with our team for questions, support, or partnership opportunities.",
    type: "website",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
