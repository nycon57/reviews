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
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { NotificationCenter } from "@/components/notifications";
import { Search, LogOut, User as UserIcon, Settings, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderUser {
  name: string;
  email: string;
  avatar?: string;
  initials: string;
}

interface HeaderProps {
  className?: string;
  user?: HeaderUser | null;
  onSignOut?: () => void;
  mobileMenuTrigger?: React.ReactNode;
}

export function Header({ className, user, onSignOut, mobileMenuTrigger }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      {/* Mobile menu trigger */}
      {mobileMenuTrigger && (
        <div className="md:hidden">{mobileMenuTrigger}</div>
      )}

      {/* Breadcrumbs */}
      <div className="hidden flex-1 md:block">
        <Breadcrumbs />
      </div>

      {/* Mobile spacer */}
      <div className="flex-1 md:hidden" />

      {/* Right side actions */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Notifications */}
        <NotificationCenter />

        {/* Theme toggle */}
        <ThemeToggle className="h-9 w-9" />

        {/* User menu */}
        {user && (
          <UserMenu user={user} onSignOut={onSignOut} />
        )}
      </div>
    </header>
  );
}

interface UserMenuProps {
  user: HeaderUser;
  onSignOut?: () => void;
}

function UserMenu({ user, onSignOut }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full"
          aria-label="User menu"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user.initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings/billing">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onSignOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
