import { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/actions";
import { EmailPreviewClient } from "./email-preview-client";

export const metadata: Metadata = {
  title: "Email Preview | Staff | RepWell",
  description: "Preview and test email templates",
};

export default async function EmailPreviewPage() {
  await requirePlatformAdmin();

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <EmailPreviewClient />
    </div>
  );
}
