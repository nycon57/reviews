import { Metadata } from "next";
import { EmailPreferencesContent } from "./email-preferences-content";

export const metadata: Metadata = {
  title: "Email Preferences | RepWell",
  description: "Manage your email notification preferences",
};

export default function EmailPreferencesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-repwell-teal-500">
          Email Preferences
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Control which emails you receive and how often.
        </p>
      </div>
      <EmailPreferencesContent />
    </div>
  );
}
