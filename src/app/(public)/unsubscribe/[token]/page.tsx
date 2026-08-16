import type { Metadata } from "next";
import { getEmailPreferencesByToken } from "@/lib/email-preferences/actions";
import { UnsubscribeContent } from "./unsubscribe-content";

export const metadata: Metadata = {
  title: "Unsubscribe | RepWell",
  description: "Unsubscribe from RepWell emails",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Resolve the token server-side so the first paint is the real UI, not a
  // blank spinner. The unsubscribe action stays client-side.
  let initialPreferences = null;
  let initialError: string | null = null;

  try {
    const prefs = await getEmailPreferencesByToken(token);
    if (prefs) {
      if (!prefs.is_valid) {
        initialError = "This unsubscribe link has expired. Please contact support for assistance.";
      } else {
        initialPreferences = prefs;
      }
    } else {
      initialError = "Invalid unsubscribe link. Please check your email for a valid link.";
    }
  } catch {
    initialError = "An unexpected error occurred. Please try again later.";
  }

  return (
    <UnsubscribeContent
      token={token}
      initialPreferences={initialPreferences}
      initialError={initialError}
    />
  );
}
