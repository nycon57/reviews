import type { Metadata } from "next";
import { getContactByUnsubscribeToken } from "./actions";
import { ContactUnsubscribeContent } from "./contact-unsubscribe-content";
import { ContactUnsubscribeError } from "./contact-unsubscribe-error";

interface PageProps {
  params: Promise<{ token: string }>;
}

export const metadata: Metadata = {
  title: "Email Preferences",
  description: "Manage the emails you receive.",
  robots: { index: false, follow: false },
};

export default async function ContactUnsubscribePage({ params }: PageProps) {
  const { token } = await params;
  const result = await getContactByUnsubscribeToken(token);

  if (!result.success) {
    return <ContactUnsubscribeError message={result.error} />;
  }

  return <ContactUnsubscribeContent token={token} initial={result.data} />;
}
