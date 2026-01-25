import { Metadata } from "next";
import { MemberAnalyticsContent } from "./member-analytics-content";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Team Member Analytics | RepWell",
    description: "View analytics and performance metrics for team member",
  };
}

export default async function MemberAnalyticsPage({ params }: PageProps) {
  const { id } = await params;
  return <MemberAnalyticsContent memberId={id} />;
}
