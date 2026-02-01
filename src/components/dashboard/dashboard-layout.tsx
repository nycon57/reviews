"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNavTrigger } from "./mobile-nav";
import { cn } from "@/lib/utils";
import { PermissionProvider } from "@/lib/permissions/context";
import type { UserContext } from "@/lib/permissions";

interface User {
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  loanOfficerId?: string;
  slug?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  user?: User | null;
  userContext?: UserContext | null;
  onSignOut?: () => void;
}

export function DashboardLayout({ children, user, userContext, onSignOut }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  return (
    <PermissionProvider userContext={userContext || null}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header
            user={user}
            onSignOut={onSignOut}
            mobileMenuTrigger={<MobileNavTrigger />}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarCollapsedChange={setSidebarCollapsed}
          />

          {/* Page content */}
          <main
            className={cn(
              "flex-1 overflow-y-auto p-6",
              "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </PermissionProvider>
  );
}
