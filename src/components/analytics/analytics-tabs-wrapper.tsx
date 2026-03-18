"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  teamMembers: { id: string; fullName: string; email: string }[];
  userRole: "admin" | "manager" | "user";
}

export function AnalyticsTabsWrapper({ children }: Props) {
  return <>{children}</>;
}
