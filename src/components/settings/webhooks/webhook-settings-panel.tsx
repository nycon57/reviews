'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import {
  Gear,
  BuildingOffice,
  TestTube,
  Pulse,
  Book,
  SpinnerGap,
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { WebhookConfigManager } from '@/components/distribution';
import { WebhookTester } from '@/components/webhooks/webhook-tester';
import { WebhookLogsViewer } from '@/components/webhooks/webhook-logs-viewer';
import { WebhookDocumentation } from '@/components/webhooks/webhook-documentation';
import { MilestoneMappingForm } from '@/components/webhooks/milestone-mapping-form';
import { getWebhookConfigs, type WebhookConfig } from '@/lib/distribution';

export type WebhookSubTab = 'configurations' | 'encompass' | 'tester' | 'logs' | 'docs';

const subTabs: { value: WebhookSubTab; label: string; icon: React.ElementType }[] = [
  { value: 'configurations', label: 'Configurations', icon: Gear },
  { value: 'encompass', label: 'Encompass', icon: BuildingOffice },
  { value: 'tester', label: 'Test', icon: TestTube },
  { value: 'logs', label: 'Logs', icon: Pulse },
  { value: 'docs', label: 'Docs', icon: Book },
];

interface WebhookSettingsPanelProps {
  initialSubTab?: WebhookSubTab;
}

export function WebhookSettingsPanel({ initialSubTab = 'configurations' }: WebhookSettingsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<WebhookSubTab>(initialSubTab);
  const [webhookConfigs, setWebhookConfigs] = useState<WebhookConfig[] | null>(null);
  const [_isPending, startTransition] = useTransition();
  const loadStarted = useRef(false);

  useEffect(() => {
    if (!loadStarted.current) {
      loadStarted.current = true;
      startTransition(async () => {
        const result = await getWebhookConfigs();
        if (result.success && result.data) {
          setWebhookConfigs(result.data);
        } else {
          setWebhookConfigs([]);
        }
      });
    }
  }, []);

  if (webhookConfigs === null) {
    return (
      <div className="flex items-center justify-center py-12">
        <SpinnerGap className="h-8 w-8 animate-spin text-repwell-teal-300" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-repwell-teal-500 tracking-tight">
          Webhooks
        </h2>
        <p className="text-repwell-teal-300 mt-1">
          Manage webhook endpoints, test integrations, and view delivery logs.
        </p>
      </div>
    <div className="flex gap-6">
      <nav className="w-48 shrink-0 border-r border-border pr-4">
        <ul className="space-y-1" role="tablist" aria-orientation="vertical">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.value;
            return (
              <li key={tab.value} role="presentation">
                <button
                  role="tab"
                  id={`tab-${tab.value}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.value}`}
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

      <div className="flex-1 min-w-0 animate-fade-in">
        {subTabs.map((tab) => (
          <div
            key={tab.value}
            role="tabpanel"
            id={`panel-${tab.value}`}
            aria-labelledby={`tab-${tab.value}`}
            hidden={activeSubTab !== tab.value}
          >
            {tab.value === 'configurations' && <WebhookConfigManager />}
            {tab.value === 'encompass' && <MilestoneMappingForm />}
            {tab.value === 'tester' && <WebhookTester webhookConfigs={webhookConfigs} />}
            {tab.value === 'logs' && <WebhookLogsViewer />}
            {tab.value === 'docs' && <WebhookDocumentation />}
          </div>
        ))}
      </div>
    </div>
    </div>
  );
}
