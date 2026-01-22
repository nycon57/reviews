import { Metadata } from "next";
import { AnnouncementsClient } from "./announcements-client";

export const metadata: Metadata = {
  title: "Announcements | Admin | Repwell",
  description: "Create and send product announcements",
};

export default function AnnouncementsPage() {
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <AnnouncementsClient />
    </div>
  );
}
