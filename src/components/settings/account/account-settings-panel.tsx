'use client';

import { useState } from 'react';
import { User, Bell, LinkSimple } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { ProfileTab } from '@/app/(dashboard)/dashboard/settings/components/profile-tab';
import { NotificationsTab } from '@/app/(dashboard)/dashboard/settings/components/notifications-tab';
import { SmartLinksTab } from '@/app/(dashboard)/dashboard/settings/components/smart-links-tab';
import type { UserProfileData } from '@/lib/auth/profile-schemas';

// Personal-only (ADR 0007 "Me vs Us"). Billing moved to Workspace.
export type AccountSubTab = 'profile' | 'notifications' | 'smart-links';

const subTabs: { value: AccountSubTab; label: string; icon: React.ElementType }[] = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'smart-links', label: 'Smart Links', icon: LinkSimple },
];

interface AccountSettingsPanelProps {
  initialSubTab?: AccountSubTab;
  profile: UserProfileData;
}

export function AccountSettingsPanel({
  initialSubTab = 'profile',
  profile,
}: AccountSettingsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<AccountSubTab>(initialSubTab);

  return (
    <div className="flex gap-6">
      <nav className="w-48 shrink-0 border-r border-border pr-4">
        <ul className="space-y-1">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.value;
            return (
              <li key={tab.value}>
                <button
                  onClick={() => setActiveSubTab(tab.value)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-sans transition-all duration-200',
                    isActive
                      ? 'bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-heading-accent font-semibold'
                      : 'text-repwell-teal-300 hover:text-repwell-teal-400 dark:hover:text-repwell-sage-100/80 hover:bg-repwell-sage-100/30 dark:hover:bg-repwell-teal-300/10'
                  )}
                >
                  <Icon
                    weight={isActive ? 'duotone' : 'regular'}
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-repwell-teal-300' : 'text-repwell-teal-300/50'
                    )}
                  />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex-1 min-w-0">
        {activeSubTab === 'profile' && (
          <ProfileTab
            profile={profile}
            isAdmin={profile.role === 'admin'}
          />
        )}
        {activeSubTab === 'notifications' && <NotificationsTab />}
        {activeSubTab === 'smart-links' && <SmartLinksTab />}
      </div>
    </div>
  );
}
