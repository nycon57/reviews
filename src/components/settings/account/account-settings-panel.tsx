'use client';

import { useState } from 'react';
import { User, CreditCard, Bell, LinkSimple } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { ProfileTab } from '@/app/(dashboard)/dashboard/settings/components/profile-tab';
import { BillingTab } from '@/app/(dashboard)/dashboard/settings/components/billing-tab';
import { NotificationsTab } from '@/app/(dashboard)/dashboard/settings/components/notifications-tab';
import { SmartLinksTab } from '@/app/(dashboard)/dashboard/settings/components/smart-links-tab';

export type AccountSubTab = 'profile' | 'billing' | 'notifications' | 'smart-links';

const subTabs: { value: AccountSubTab; label: string; icon: React.ElementType }[] = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'billing', label: 'Billing', icon: CreditCard },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'smart-links', label: 'Smart Links', icon: LinkSimple },
];

interface AccountSettingsPanelProps {
  initialSubTab?: AccountSubTab;
  userEmail?: string;
  userName?: string;
  userAvatarUrl?: string | null;
  userTitle?: string | null;
  userNmlsId?: string | null;
  userBio?: string | null;
  userPhone?: string | null;
  userPersonalWebsiteUrl?: string | null;
  userLinkedinUrl?: string | null;
  userZillowProfileUrl?: string | null;
  userFacebookUrl?: string | null;
  userInstagramUrl?: string | null;
  userTwitterUrl?: string | null;
  userTimezone?: string | null;
  userSlug?: string | null;
  userBannerUrl?: string | null;
  userId?: string;
  userRole?: string | null;
}

export function AccountSettingsPanel({
  initialSubTab = 'profile',
  userEmail,
  userName,
  userAvatarUrl,
  userTitle,
  userNmlsId,
  userBio,
  userPhone,
  userPersonalWebsiteUrl,
  userLinkedinUrl,
  userZillowProfileUrl,
  userFacebookUrl,
  userInstagramUrl,
  userTwitterUrl,
  userTimezone,
  userSlug,
  userBannerUrl,
  userId,
  userRole,
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
                      ? 'bg-repwell-sage-100/50 text-repwell-teal-500 font-semibold'
                      : 'text-repwell-teal-300 hover:text-repwell-teal-400 hover:bg-repwell-sage-100/30'
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
            userEmail={userEmail}
            userName={userName}
            userAvatarUrl={userAvatarUrl}
            userTitle={userTitle}
            userNmlsId={userNmlsId}
            userBio={userBio}
            userPhone={userPhone}
            userPersonalWebsiteUrl={userPersonalWebsiteUrl}
            userLinkedinUrl={userLinkedinUrl}
            userZillowProfileUrl={userZillowProfileUrl}
            userFacebookUrl={userFacebookUrl}
            userInstagramUrl={userInstagramUrl}
            userTwitterUrl={userTwitterUrl}
            userTimezone={userTimezone}
            userSlug={userSlug}
            userBannerUrl={userBannerUrl}
            userId={userId}
            isAdmin={userRole === 'admin'}
          />
        )}
        {activeSubTab === 'billing' && <BillingTab />}
        {activeSubTab === 'notifications' && <NotificationsTab />}
        {activeSubTab === 'smart-links' && <SmartLinksTab />}
      </div>
    </div>
  );
}
