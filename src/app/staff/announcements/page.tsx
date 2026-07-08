import { Metadata } from "next";
import { requirePlatformAdmin } from "@/lib/auth/actions";
import { AnnouncementsClient } from "./announcements-client";

export const metadata: Metadata = {
  title: "Announcements | Staff | RepWell",
  description: "Create and send product announcements",
};

export default async function AnnouncementsPage() {
  await requirePlatformAdmin();

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <AnnouncementsClient />
    </div>
  );
}
