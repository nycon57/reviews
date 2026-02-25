import { requireEnterpriseManager } from "@/lib/access";
import { ContactsPageClient } from "./contacts-page-client";

export const metadata = {
  title: "Contacts | RepWell",
  description: "Manage your organization's employee directory",
};

export default async function ContactsPage() {
  await requireEnterpriseManager();

  return <ContactsPageClient />;
}
