'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  getSalesforceConnection,
  disconnectSalesforce,
  syncSalesforceData,
  updateSalesforceSettings,
  getAvailableOpportunityStages,
  getSalesforceSyncLogs,
} from '@/lib/salesforce/actions';
import type { SalesforceConnection, SalesforceSyncLog } from '@/lib/salesforce/types';

// Salesforce cloud icon
function SalesforceIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="currentColor"
    >
      <path d="M20.2 11.8c1.6-1.7 3.8-2.8 6.3-2.8 3.4 0 6.4 2 7.9 4.9.5-.1 1-.2 1.5-.2 4.4 0 8 3.6 8 8s-3.6 8-8 8H10.5C6.4 29.7 3 26.3 3 22.2c0-3.7 2.8-6.8 6.4-7.2.5-3.7 3.7-6.5 7.5-6.5 1.2 0 2.4.3 3.3.8v2.5z" />
    </svg>
  );
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
}

function StatusBadge({ status }: { status: SalesforceConnection['syncStatus'] }) {
  const variants: Record<
    SalesforceConnection['syncStatus'],
    'default' | 'secondary' | 'outline' | 'destructive'
  > = {
    pending: 'secondary',
    syncing: 'default',
    completed: 'outline',
    failed: 'destructive',
  };

  return (
    <Badge variant={variants[status]}>
      {status === 'syncing' ? 'Syncing...' : status}
    </Badge>
  );
}

function SyncLogItem({ log }: { log: SalesforceSyncLog }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <div className="flex items-center gap-2">
        <Badge variant={log.status === 'completed' ? 'outline' : 'destructive'} className="text-xs">
          {log.status}
        </Badge>
        <span className="text-muted-foreground">
          {log.recordsFetched} fetched, {log.recordsCreated} new, {log.recordsUpdated} updated
        </span>
      </div>
      <span className="text-muted-foreground text-xs">
        {formatDate(log.startedAt)}
      </span>
    </div>
  );
}

export function SalesforceIntegrationCard() {
  const [connection, setConnection] = useState<SalesforceConnection | null>(null);
  const [syncLogs, setSyncLogs] = useState<SalesforceSyncLog[]>([]);
  const [opportunityStages, setOpportunityStages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle OAuth callback results
  useEffect(() => {
    const salesforceSuccess = searchParams.get('salesforce_success');
    const salesforceError = searchParams.get('salesforce_error');

    if (salesforceSuccess) {
      toast({
        title: 'Salesforce Connected',
        description: 'Your Salesforce account has been connected successfully.',
      });
      // Clear the URL params
      router.replace('/dashboard/settings');
      // Refresh connection data
      fetchData();
    }

    if (salesforceError) {
      toast({
        title: 'Connection Failed',
        description: decodeURIComponent(salesforceError),
        variant: 'destructive',
      });
      router.replace('/dashboard/settings');
    }
  }, [searchParams, toast, router]);

  // Fetch connection data
  async function fetchData() {
    setIsLoading(true);
    try {
      const result = await getSalesforceConnection();
      if (result.success && result.data) {
        setConnection(result.data);

        // Fetch sync logs
        const logsResult = await getSalesforceSyncLogs(result.data.id, 5);
        if (logsResult.success && logsResult.data) {
          setSyncLogs(logsResult.data);
        }

        // Fetch opportunity stages if connected
        const stagesResult = await getAvailableOpportunityStages(result.data.id);
        if (stagesResult.success && stagesResult.data) {
          setOpportunityStages(stagesResult.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Salesforce data:', error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const handleConnect = () => {
    window.location.href = '/api/auth/salesforce/connect';
  };

  const handleDisconnect = async () => {
    if (!connection) return;

    startTransition(async () => {
      const result = await disconnectSalesforce(connection.id);
      if (result.success) {
        setConnection(null);
        setSyncLogs([]);
        toast({
          title: 'Disconnected',
          description: 'Salesforce has been disconnected.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to disconnect',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSync = async () => {
    if (!connection) return;

    startTransition(async () => {
      toast({
        title: 'Syncing...',
        description: 'Fetching data from Salesforce.',
      });

      const result = await syncSalesforceData(connection.id, 'manual');

      if (result.success && result.data) {
        toast({
          title: 'Sync Complete',
          description: `Fetched ${result.data.recordsFetched} records (${result.data.recordsCreated} new, ${result.data.recordsUpdated} updated)`,
        });
        fetchData();
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Failed to sync data',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSettingsUpdate = async (
    key: keyof Pick<SalesforceConnection, 'syncContacts' | 'syncAccounts' | 'syncOpportunities' | 'autoCreateSurveys'>,
    value: boolean
  ) => {
    if (!connection) return;

    startTransition(async () => {
      const result = await updateSalesforceSettings(connection.id, {
        [key]: value,
      });

      if (result.success) {
        setConnection((prev) => prev ? { ...prev, [key]: value } : null);
        toast({
          title: 'Settings Updated',
          description: 'Salesforce settings have been updated.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update settings',
          variant: 'destructive',
        });
      }
    });
  };

  const handleStageTriggerUpdate = async (stage: string) => {
    if (!connection) return;

    startTransition(async () => {
      const result = await updateSalesforceSettings(connection.id, {
        opportunityStageTrigger: stage,
      });

      if (result.success) {
        setConnection((prev) => prev ? { ...prev, opportunityStageTrigger: stage } : null);
        toast({
          title: 'Settings Updated',
          description: `Survey trigger stage set to "${stage}".`,
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update settings',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <SalesforceIcon className="h-5 w-5 text-[#00A1E0]" />
          <CardTitle>Salesforce CRM</CardTitle>
        </div>
        <CardDescription>
          Connect your Salesforce CRM to sync contacts, accounts, and trigger surveys from opportunities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : connection ? (
          <>
            {/* Connection Info */}
            <div className="rounded-lg border p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {connection.salesforceUsername || 'Salesforce Account'}
                    </span>
                    <StatusBadge status={connection.syncStatus} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {connection.instanceUrl}
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{connection.contactsSynced} contacts</span>
                    <span>{connection.accountsSynced} accounts</span>
                    <span>{connection.opportunitiesSynced} opportunities</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last sync: {formatDate(connection.lastSyncAt)}
                  </p>
                  {connection.syncError && (
                    <p className="text-sm text-destructive">
                      Error: {connection.syncError}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSync}
                    disabled={isPending || connection.syncStatus === 'syncing'}
                  >
                    {connection.syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                      >
                        Disconnect
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Disconnect Salesforce?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will stop syncing data from Salesforce. Existing mappings and data will be preserved but no longer updated.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDisconnect}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            {/* Sync Settings */}
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="sync-settings">
                <AccordionTrigger>Sync Settings</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sync Contacts</Label>
                      <p className="text-xs text-muted-foreground">
                        Import contacts from Salesforce
                      </p>
                    </div>
                    <Switch
                      checked={connection.syncContacts}
                      onCheckedChange={(checked) =>
                        handleSettingsUpdate('syncContacts', checked)
                      }
                      disabled={isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sync Accounts</Label>
                      <p className="text-xs text-muted-foreground">
                        Import accounts from Salesforce
                      </p>
                    </div>
                    <Switch
                      checked={connection.syncAccounts}
                      onCheckedChange={(checked) =>
                        handleSettingsUpdate('syncAccounts', checked)
                      }
                      disabled={isPending}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Sync Opportunities</Label>
                      <p className="text-xs text-muted-foreground">
                        Import opportunities from Salesforce
                      </p>
                    </div>
                    <Switch
                      checked={connection.syncOpportunities}
                      onCheckedChange={(checked) =>
                        handleSettingsUpdate('syncOpportunities', checked)
                      }
                      disabled={isPending}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="survey-automation">
                <AccordionTrigger>Survey Automation</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-Create Surveys</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically create surveys when opportunities reach a specific stage
                      </p>
                    </div>
                    <Switch
                      checked={connection.autoCreateSurveys}
                      onCheckedChange={(checked) =>
                        handleSettingsUpdate('autoCreateSurveys', checked)
                      }
                      disabled={isPending}
                    />
                  </div>

                  {connection.autoCreateSurveys && (
                    <div className="space-y-2">
                      <Label>Trigger Stage</Label>
                      <Select
                        value={connection.opportunityStageTrigger}
                        onValueChange={handleStageTriggerUpdate}
                        disabled={isPending}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          {opportunityStages.length > 0 ? (
                            opportunityStages.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {stage}
                              </SelectItem>
                            ))
                          ) : (
                            <>
                              <SelectItem value="Closed Won">Closed Won</SelectItem>
                              <SelectItem value="Closed Lost">Closed Lost</SelectItem>
                              <SelectItem value="Negotiation/Review">Negotiation/Review</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        A survey will be sent to the primary contact when an opportunity reaches this stage
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              {syncLogs.length > 0 && (
                <AccordionItem value="sync-history">
                  <AccordionTrigger>Sync History</AccordionTrigger>
                  <AccordionContent className="pt-2">
                    <div className="divide-y">
                      {syncLogs.map((log) => (
                        <SyncLogItem key={log.id} log={log} />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>

            {/* Info */}
            <p className="text-xs text-muted-foreground">
              Data is synced automatically every 24 hours. Reviews and survey responses can be synced back to Salesforce as completed tasks on contact records.
            </p>
          </>
        ) : (
          /* Connect */
          <div className="space-y-4 rounded-lg border border-dashed p-4">
            <div className="space-y-2">
              <Label>Connect Salesforce</Label>
              <p className="text-sm text-muted-foreground">
                Link your Salesforce CRM to import contacts, track opportunities, and automate survey distribution based on deal stages.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Sync contacts and accounts
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Trigger surveys on opportunity close
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Log reviews as activities in Salesforce
                </li>
              </ul>
              <Button onClick={handleConnect} disabled={isPending} className="sm:ml-auto">
                <SalesforceIcon className="mr-2 h-4 w-4" />
                Connect Salesforce
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
