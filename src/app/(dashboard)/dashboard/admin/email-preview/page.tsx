import { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAdminAccess } from "@/lib/auth/actions";
import { EmailPreviewClient } from "./email-preview-client";

export const metadata: Metadata = {
  title: "Email Preview | Admin | Repwell",
  description: "Preview and test email templates",
};

export default async function EmailPreviewPage() {
  const hasAccess = await checkAdminAccess();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <EmailPreviewClient />
    </div>
  );
}
