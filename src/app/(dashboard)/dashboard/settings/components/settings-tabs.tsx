'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserCircle,
  Link as Link2,
  Key,
  ChatTeardropDots,
  Plugs,
} from "@phosphor-icons/react";
import { cn } from '@/lib/utils';
import { IntegrationsTab } from './integrations-tab';
import { ApiTab } from './api-tab';
import { AccountSettingsPanel, type AccountSubTab } from '@/components/settings/account/account-settings-panel';
import { SmsSettingsPanel, type SmsSubTab } from '@/components/settings/sms/sms-settings-panel';
import { WebhookSettingsPanel, type WebhookSubTab } from '@/components/settings/webhooks/webhook-settings-panel';
import { Skeleton } from '@/components/ui/skeleton';

type SettingsTab = 'account' | 'integrations' | 'api' | 'sms' | 'webhooks';

const VALID_TABS: SettingsTab[] = ['account', 'integrations', 'api', 'sms', 'webhooks'];

// Backwards-compat: old tab URL params → consolidated tabs
const ACCOUNT_SUB_TAB_MAP: Record<string, AccountSubTab> = {
  'profile': 'profile',
  'billing': 'billing',
  'notifications': 'notifications',
  'smart-links': 'smart-links',
};

const SMS_SUB_TAB_MAP: Record<string, SmsSubTab> = {
  'sms-registration': 'registration',
  'sms-compliance': 'compliance',
  'sms-billing': 'billing',
  'sms-templates': 'templates',
};

const WEBHOOK_SUB_TAB_MAP: Record<string, WebhookSubTab> = {
  'webhook-logs': 'logs',
  'webhook-configs': 'configurations',
};

function resolveTab(value: string | null): { tab: SettingsTab; accountSubTab?: AccountSubTab; smsSubTab?: SmsSubTab; webhookSubTab?: WebhookSubTab } {
  if (!value) return { tab: 'account' };
  if (VALID_TABS.includes(value as SettingsTab)) return { tab: value as SettingsTab };
  if (value in ACCOUNT_SUB_TAB_MAP) return { tab: 'account', accountSubTab: ACCOUNT_SUB_TAB_MAP[value] };
  if (value in SMS_SUB_TAB_MAP) return { tab: 'sms', smsSubTab: SMS_SUB_TAB_MAP[value] };
  if (value in WEBHOOK_SUB_TAB_MAP) return { tab: 'webhooks', webhookSubTab: WEBHOOK_SUB_TAB_MAP[value] };
  return { tab: 'account' };
}

const tabs: { value: SettingsTab; label: string; icon: React.ElementType }[] = [
  { value: 'account', label: 'Account', icon: UserCircle },
  { value: 'integrations', label: 'Integrations', icon: Link2 },
  { value: 'sms', label: 'SMS', icon: ChatTeardropDots },
  { value: 'api', label: 'API', icon: Key },
  { value: 'webhooks', label: 'Webhooks', icon: Plugs },
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
  initialTab?: string;
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

export function SettingsTabs({
  initialTab = 'account',
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
}: SettingsTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab');
  const { tab: currentTab, accountSubTab, smsSubTab, webhookSubTab } = resolveTab(tabParam ?? initialTab);

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
        <TabsContent value="account" className="m-0 animate-fade-in">
          <Suspense fallback={<TabSkeleton />}>
            <AccountSettingsPanel
              initialSubTab={accountSubTab}
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
              userRole={userRole}
            />
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

        <TabsContent value="sms" className="m-0 animate-fade-in">
          <Suspense fallback={<TabSkeleton />}>
            <SmsSettingsPanel initialSubTab={smsSubTab} />
          </Suspense>
        </TabsContent>

        <TabsContent value="webhooks" className="m-0 animate-fade-in">
          <Suspense fallback={<TabSkeleton />}>
            <WebhookSettingsPanel initialSubTab={webhookSubTab} />
          </Suspense>
        </TabsContent>
      </div>
    </Tabs>
  );
}
