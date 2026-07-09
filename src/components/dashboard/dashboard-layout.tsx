"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNavTrigger } from "./mobile-nav";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cn } from "@/lib/utils";
import { PermissionProvider } from "@/lib/permissions/context";
import type { UserContext } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { stopUserImpersonation } from "@/lib/organization";
import { SpinnerGap as Loader2, SignOut as SignOutIcon, WarningCircle } from "@phosphor-icons/react";

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
  impersonation?: {
    active: boolean;
    impersonatorId?: string | null;
    targetName?: string | null;
    targetEmail?: string | null;
    expiresAt?: string | null;
  } | null;
  onSignOut?: () => void;
  initialSidebarCollapsed?: boolean;
}

export function DashboardLayout({
  children,
  user,
  userContext,
  impersonation,
  onSignOut,
  initialSidebarCollapsed = false,
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(initialSidebarCollapsed);
  const [isStoppingImpersonation, startStopTransition] = React.useTransition();
  const router = useRouter();
  const { toast } = useToast();

  React.useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousHtmlOverscrollBehavior = html.style.overscrollBehavior;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscrollBehavior = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      html.style.overscrollBehavior = previousHtmlOverscrollBehavior;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscrollBehavior;
    };
  }, []);

  const handleStopImpersonation = React.useCallback(() => {
    startStopTransition(async () => {
      const result = await stopUserImpersonation();
      if (result.error) {
        toast({
          title: "Unable to stop impersonation",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Impersonation ended",
        description: "Your admin session has been restored.",
      });
      router.refresh();
    });
  }, [router, toast]);

  const handleSidebarCollapsedChange = React.useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
    document.cookie = [
      `repwell_sidebar_collapsed=${collapsed ? "true" : "false"}`,
      "Path=/dashboard",
      "Max-Age=31536000",
      "SameSite=Lax",
    ].join("; ");
  }, []);

  return (
    <PermissionProvider userContext={userContext || null}>
      <div className="flex h-dvh overflow-hidden bg-background">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <Sidebar
            collapsed={sidebarCollapsed}
          />
        </div>

        {/* Main content area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Header */}
          <Header
            user={user}
            onSignOut={onSignOut}
            impersonation={impersonation}
            onStopImpersonation={handleStopImpersonation}
            isStoppingImpersonation={isStoppingImpersonation}
            mobileMenuTrigger={<MobileNavTrigger />}
            sidebarCollapsed={sidebarCollapsed}
            onSidebarCollapsedChange={handleSidebarCollapsedChange}
          />

          {impersonation?.active && (
            <div className="border-b border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-2 md:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200">
                  <WarningCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-sm">
                    Impersonating{" "}
                    <span className="font-semibold">
                      {impersonation.targetName || impersonation.targetEmail}
                    </span>
                    {impersonation.targetName && impersonation.targetName !== impersonation.targetEmail && impersonation.targetEmail
                      ? ` (${impersonation.targetEmail})`
                      : ""}
                    .
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 border-amber-300 bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 hover:bg-amber-200"
                  onClick={handleStopImpersonation}
                  disabled={isStoppingImpersonation}
                >
                  {isStoppingImpersonation ? (
                    <>
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      Restoring...
                    </>
                  ) : (
                    <>
                      <SignOutIcon className="mr-2 h-3.5 w-3.5" />
                      Stop impersonation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Page content */}
          <main
            className={cn(
              "min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6",
              "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border"
            )}
          >
            <Breadcrumbs className="mb-4" />
            {children}
          </main>
        </div>
      </div>
    </PermissionProvider>
  );
}
