"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationCenter } from "@/components/notifications";
import { SearchDialog } from "@/components/dashboard/search-dialog";
import { InviteTeamDialog } from "@/components/dashboard/invite-team-dialog";
import {
  MagnifyingGlass as Search,
  SignOut as LogOut,
  Gear as Settings,
  CreditCard,
  UserPlus,
  Command,
  ArrowSquareOut as ExternalLink,
  SidebarSimple as PanelLeftClose,
  Sidebar as PanelLeft,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { usePermissions } from "@/lib/permissions/context";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

interface HeaderUser {
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  loanOfficerId?: string;
  slug?: string;
}

interface HeaderProps {
  className?: string;
  user?: HeaderUser | null;
  onSignOut?: () => void;
  impersonation?: {
    active: boolean;
    impersonatorId?: string | null;
    targetName?: string | null;
    targetEmail?: string | null;
    expiresAt?: string | null;
  } | null;
  onStopImpersonation?: () => void;
  isStoppingImpersonation?: boolean;
  mobileMenuTrigger?: React.ReactNode;
  sidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
}

export function Header({
  className,
  user,
  onSignOut,
  impersonation,
  onStopImpersonation,
  isStoppingImpersonation = false,
  mobileMenuTrigger,
  sidebarCollapsed,
  onSidebarCollapsedChange,
}: HeaderProps) {
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const { canInviteTeam, userContext } = usePermissions();

  // Keyboard shortcut: ⌘K to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const showInviteButton = canInviteTeam();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-background/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/80",
        className
      )}
    >
      {/* Mobile menu trigger */}
      {mobileMenuTrigger && (
        <div className="md:hidden">{mobileMenuTrigger}</div>
      )}

      {/* Sidebar collapse toggle - desktop only */}
      {onSidebarCollapsedChange && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:flex h-9 w-9 text-repwell-teal-400 dark:text-repwell-sage-100/80 hover:text-repwell-teal-500 dark:hover:text-repwell-sage-100 hover:bg-repwell-sage-100 dark:hover:bg-repwell-teal-300/10 transition-colors duration-150"
          onClick={() => onSidebarCollapsedChange(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      )}

      {/* Spacer - pushes actions to right */}
      <div className="flex-1" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Search button with keyboard shortcut hint */}
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 text-repwell-teal-400 dark:text-repwell-sage-100/80 hover:text-repwell-teal-500 dark:hover:text-repwell-sage-100 hover:bg-repwell-sage-100 dark:hover:bg-repwell-teal-300/10 gap-2 hidden sm:flex"
          aria-label="Search"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
          <span className="text-sm font-normal">Search</span>
          <kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-repwell-teal-400 dark:text-repwell-sage-100/80">
            <Command className="h-3 w-3" />K
          </kbd>
        </Button>

        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-repwell-teal-400 dark:text-repwell-sage-100/80 hover:text-repwell-teal-500 dark:hover:text-repwell-sage-100 hover:bg-repwell-sage-100 dark:hover:bg-repwell-teal-300/10 sm:hidden"
          aria-label="Search"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Divider */}
        <div className="hidden sm:block h-6 w-px bg-border mx-1" />

        {/* Invite Team button - Only for enterprise admins */}
        {showInviteButton && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 hidden md:flex"
            onClick={() => setInviteOpen(true)}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Team
          </Button>
        )}

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <NotificationCenter />

        {/* User menu */}
        {user && (
          <UserMenu
            user={user}
            onSignOut={onSignOut}
            impersonation={impersonation}
            onStopImpersonation={onStopImpersonation}
            isStoppingImpersonation={isStoppingImpersonation}
            role={userContext?.role}
            accountType={userContext?.accountType}
          />
        )}
      </div>

      {/* Dialogs */}
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      {showInviteButton && (
        <InviteTeamDialog open={inviteOpen} onOpenChange={setInviteOpen} />
      )}
    </header>
  );
}

interface UserMenuProps {
  user: HeaderUser;
  onSignOut?: () => void;
  impersonation?: {
    active: boolean;
    impersonatorId?: string | null;
    targetName?: string | null;
    targetEmail?: string | null;
    expiresAt?: string | null;
  } | null;
  onStopImpersonation?: () => void;
  isStoppingImpersonation?: boolean;
  role?: string | null;
  accountType?: string | null;
}

function getUserRoleLabel(role: string | null | undefined, accountType: string | null | undefined): string {
  if (accountType === "individual") {
    return "User";
  }
  if (accountType === "enterprise") {
    if (role === "admin") return "Enterprise Admin";
    if (role === "manager") return "Enterprise Manager";
    return "Enterprise User";
  }
  return "";
}

function UserMenu({
  user,
  onSignOut,
  impersonation,
  onStopImpersonation,
  isStoppingImpersonation = false,
  role,
  accountType,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full p-0 hover:ring-2 hover:ring-repwell-sage-100 dark:hover:ring-repwell-teal-300/20 hover:ring-offset-2 dark:ring-offset-background transition-all duration-150"
          aria-label="User menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-surface-soft text-repwell-teal-300 font-semibold text-sm">
              {user.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 border-border" align="end" forceMount>
        <DropdownMenuLabel className="font-normal p-3">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none text-heading-accent">{user.name}</p>
            <p className="text-xs leading-none text-repwell-teal-400 dark:text-repwell-sage-100/80">
              {user.email}
            </p>
            {(role || accountType) && (
              <p className="text-xs leading-none text-repwell-teal-300">
                {getUserRoleLabel(role, accountType)}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        {(user.slug || user.loanOfficerId) && (
          <DropdownMenuItem asChild className="text-repwell-teal-400 dark:text-repwell-sage-100/80 hover:text-repwell-teal-500 dark:hover:text-repwell-sage-100 hover:bg-repwell-sage-100 dark:hover:bg-repwell-teal-300/10 cursor-pointer">
            <Link href={`/pro/${user.slug || user.loanOfficerId}`} target="_blank" className="flex items-center">
              <ExternalLink className="mr-2 h-4 w-4" />
              <span>View Public Profile</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild className="text-repwell-teal-400 dark:text-repwell-sage-100/80 hover:text-repwell-teal-500 dark:hover:text-repwell-sage-100 hover:bg-repwell-sage-100 dark:hover:bg-repwell-teal-300/10 cursor-pointer">
          <Link href="/dashboard/settings" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="text-repwell-teal-400 dark:text-repwell-sage-100/80 hover:text-repwell-teal-500 dark:hover:text-repwell-sage-100 hover:bg-repwell-sage-100 dark:hover:bg-repwell-teal-300/10 cursor-pointer">
          <Link href="/dashboard/settings?tab=billing" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        {impersonation?.active && onStopImpersonation && (
          <DropdownMenuItem
            onClick={onStopImpersonation}
            disabled={isStoppingImpersonation}
            className="text-amber-700 dark:text-amber-400 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 cursor-pointer focus:text-amber-800 focus:bg-amber-50 dark:focus:bg-amber-950/30"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isStoppingImpersonation ? "Stopping..." : "Stop impersonating"}</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          onClick={onSignOut}
          className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
