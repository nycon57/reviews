'use client';

import { useState, Suspense } from 'react';
import {
  ChatTeardropDots,
  ShieldCheck,
  Scales,
  CurrencyDollar,
  FileText,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { SmsTab } from './sms-tab';
import { RegistrationTab } from './registration-tab';
import { ComplianceTab } from './compliance-tab';
import { SmsBillingTab } from './billing-tab';
import { SmsTemplatesTab } from './templates-tab';
import { Skeleton } from '@/components/ui/skeleton';

export type SmsSubTab = 'setup' | 'registration' | 'compliance' | 'billing' | 'templates';

const subTabs: { value: SmsSubTab; label: string; icon: React.ElementType }[] = [
  { value: 'setup', label: 'SMS Setup', icon: ChatTeardropDots },
  { value: 'registration', label: '10DLC', icon: ShieldCheck },
  { value: 'compliance', label: 'Compliance', icon: Scales },
  { value: 'billing', label: 'SMS Billing', icon: CurrencyDollar },
  { value: 'templates', label: 'Templates', icon: FileText },
];

function SubTabSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

interface SmsSettingsPanelProps {
  initialSubTab?: SmsSubTab;
}

export function SmsSettingsPanel({ initialSubTab = 'setup' }: SmsSettingsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<SmsSubTab>(initialSubTab);

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
                    'flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex-1 min-w-0">
        <Suspense fallback={<SubTabSkeleton />}>
          {activeSubTab === 'setup' && <SmsTab />}
          {activeSubTab === 'registration' && <RegistrationTab />}
          {activeSubTab === 'compliance' && <ComplianceTab />}
          {activeSubTab === 'billing' && <SmsBillingTab />}
          {activeSubTab === 'templates' && <SmsTemplatesTab />}
        </Suspense>
      </div>
    </div>
  );
}
