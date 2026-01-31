'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Link as Link2,
  Key,
  Bell,
  CreditCard,
  ChatTeardropDots,
} from "@phosphor-icons/react";
import { cn } from '@/lib/utils';
import { ProfileTab } from './profile-tab';
import { IntegrationsTab } from './integrations-tab';
import { ApiTab } from './api-tab';
import { NotificationsTab } from './notifications-tab';
import { BillingTab } from './billing-tab';
import { SmsTab } from '@/components/settings/sms/sms-tab';
import { Skeleton } from '@/components/ui/skeleton';

type SettingsTab = 'profile' | 'integrations' | 'api' | 'notifications' | 'billing' | 'sms';

const VALID_TABS: SettingsTab[] = ['profile', 'integrations', 'api', 'notifications', 'billing', 'sms'];

function isSettingsTab(value: string | null): value is SettingsTab {
  return value !== null && VALID_TABS.includes(value as SettingsTab);
}

const tabs: { value: SettingsTab; label: string; icon: React.ElementType }[] = [
  { value: 'profile', label: 'Profile', icon: User },
  { value: 'billing', label: 'Billing', icon: CreditCard },
  { value: 'integrations', label: 'Integrations', icon: Link2 },
  { value: 'api', label: 'API', icon: Key },
  { value: 'notifications', label: 'Notifications', icon: Bell },
  { value: 'sms', label: 'SMS', icon: ChatTeardropDots },
];

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
  initialTab?: SettingsTab;
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
  userTimezone?: string | null;
  userSlug?: string | null;
  userBannerUrl?: string | null;
  userId?: string;
  userRole?: string | null;
}

export function SettingsTabs({
  initialTab = 'profile',
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
  userTimezone,
  userSlug,
  userBannerUrl,
  userId,
  userRole,
}: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const currentTab = isSettingsTab(tabParam) ? tabParam : initialTab;

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', value);
      router.push(`/dashboard/settings?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-0 overflow-x-auto flex-nowrap">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'relative px-4 py-3 text-sm font-medium',
                'text-muted-foreground hover:text-repwell-teal-400',
                'data-[state=active]:text-repwell-teal-300',
                'border-b-2 border-transparent',
                'data-[state=active]:border-repwell-teal-300',
                'rounded-none bg-transparent shadow-none',
                'transition-colors duration-200',
                'flex items-center gap-2 whitespace-nowrap'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          );
        })}
      </TabsList>

      <div className="mt-6">
        <TabsContent value="profile" className="m-0 animate-fade-in">
          <Suspense fallback={<TabSkeleton />}>
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
              userTimezone={userTimezone}
              userSlug={userSlug}
              userBannerUrl={userBannerUrl}
              userId={userId}
              isAdmin={userRole === 'admin'}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="billing" className="m-0 animate-fade-in">
          <Suspense fallback={<TabSkeleton />}>
            <BillingTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="integrations" className="m-0 animate-fade-in">
          <Suspense fallback={<TabSkeleton />}>
            <IntegrationsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="api" className="m-0 animate-fade-in">
          <Suspense fallback={<TabSkeleton />}>
            <ApiTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="notifications" className="m-0 animate-fade-in">
          <Suspense fallback={<TabSkeleton />}>
            <NotificationsTab />
          </Suspense>
        </TabsContent>

        <TabsContent value="sms" className="m-0 animate-fade-in">
          <Suspense fallback={<TabSkeleton />}>
            <SmsTab />
          </Suspense>
        </TabsContent>
      </div>
    </Tabs>
  );
}
