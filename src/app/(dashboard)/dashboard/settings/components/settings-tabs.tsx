'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import {
  AccountSettingsPanel,
  type AccountSubTab,
} from '@/components/settings/account/account-settings-panel';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfileData } from '@/lib/auth/profile-schemas';

// Settings is personal-only (ADR 0007 "Me vs Us"). Org-scoped surfaces
// (billing, integrations, API keys, webhooks) moved to the Workspace and are
// redirected there in next.config. Only the personal account sub-tabs remain.
const ACCOUNT_SUB_TABS: AccountSubTab[] = ['profile', 'notifications', 'smart-links'];

function resolveSubTab(value: string | null): AccountSubTab {
  if (value && ACCOUNT_SUB_TABS.includes(value as AccountSubTab)) {
    return value as AccountSubTab;
  }
  return 'profile';
}

function TabSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

interface SettingsTabsProps {
  initialTab?: string;
  profile: UserProfileData;
}

export function SettingsTabs({ initialTab = 'profile', profile }: SettingsTabsProps) {
  const searchParams = useSearchParams();
  const subTab = resolveSubTab(searchParams.get('tab') ?? initialTab);

  return (
    <Suspense fallback={<TabSkeleton />}>
      <AccountSettingsPanel initialSubTab={subTab} profile={profile} />
    </Suspense>
  );
}
