"use client";

import { SmartLinksTable } from "@/components/share-studio/smart-links-table";

interface SmartLink {
  id: string;
  slug: string;
  title: string | null;
  published: boolean;
  created_at: string;
  updated_at: string | null;
  destination_url: string | null;
}

interface SmartLinksTabContentProps {
  links: SmartLink[];
}

export function SmartLinksTabContent({ links }: SmartLinksTabContentProps) {
  return <SmartLinksTable links={links} />;
}
