import { Metadata } from "next";
import { EmailPreviewClient } from "./email-preview-client";

export const metadata: Metadata = {
  title: "Email Preview | Admin | Repwell",
  description: "Preview and test email templates",
};

export default function EmailPreviewPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <EmailPreviewClient />
    </div>
  );
}
