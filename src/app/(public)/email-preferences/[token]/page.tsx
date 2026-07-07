import type { Metadata } from "next";
import { getCommunicationPreferencesByToken } from "@/lib/email-preferences/actions";
import { EmailPreferencesContent } from "./email-preferences-content";

export const metadata: Metadata = {
  title: "Communication Preferences | RepWell",
  description: "Manage your RepWell email preferences",
  robots: { index: false, follow: false },
};

export default async function PublicEmailPreferencesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Resolve the token server-side so the first paint is the real UI, not a
  // blank spinner. Interactivity (toggles, save, resubscribe) stays client-side.
  let initialPreferences = null;
  let initialError: string | null = null;

  try {
    const prefs = await getCommunicationPreferencesByToken(token);
    if (prefs) {
      if (!prefs.is_valid) {
        initialError = "This link has expired. Please contact support for a new link.";
      } else {
        initialPreferences = prefs;
      }
    } else {
      initialError = "Invalid link. Please check your email for a valid link.";
    }
  } catch {
    initialError = "An unexpected error occurred. Please try again later.";
  }

  return (
    <EmailPreferencesContent
      token={token}
      initialPreferences={initialPreferences}
      initialError={initialError}
    />
  );
}
