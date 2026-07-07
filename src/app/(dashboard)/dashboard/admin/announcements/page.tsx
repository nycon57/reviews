import { Metadata } from "next";
import { redirect } from "next/navigation";
import { checkAdminAccess } from "@/lib/auth/actions";
import { AnnouncementsClient } from "./announcements-client";

export const metadata: Metadata = {
  title: "Announcements | Admin | Repwell",
  description: "Create and send product announcements",
};

export default async function AnnouncementsPage() {
  const hasAccess = await checkAdminAccess();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <AnnouncementsClient />
    </div>
  );
}
