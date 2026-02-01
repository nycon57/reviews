'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ChatTeardropDots,
  Phone,
  CheckCircle,
  XCircle,
  Warning,
  Copy,
  Check,
  ArrowRight,
  Eye,
  EyeSlash,
  Plus,
  Trash,
  ArrowsClockwise,
  Plugs,
  Globe,
  ShieldCheck,
} from '@phosphor-icons/react';
import { BrandedDomainSetup } from './branded-domain-setup';
import { AuditLogViewer } from './audit-log-viewer';
import { LoPhoneAssignment } from '@/components/organization/lo-phone-assignment';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { fadeInUp, staggerContainer } from '@/lib/motion/variants';
import {
  getSmsSettings,
  getSmsPhoneNumbers,
  saveTwilioCredentials,
  testTwilioConnection,
  setDefaultFromNumber,
  releasePhoneNumber,
  getWebhookUrls,
} from '@/lib/sms/settings/actions';
import type { SmsSettings, SmsPhoneNumber } from '@/lib/sms/types';
import { formatForDisplay } from '@/lib/sms/phone-utils';
import { AddPhoneNumberDialog } from './add-phone-number-dialog';

function maskValue(value: string, showLast = 4): string {
  if (value.length <= showLast) return value;
  return '•'.repeat(value.length - showLast) + value.slice(-showLast);
}

type ConnectionStatus = 'connected' | 'disconnected' | 'checking' | 'unknown';

function getConnectionHeading(status: ConnectionStatus, hasCredentials: boolean): string {
  switch (status) {
    case 'connected':
      return 'Active & Ready';
    case 'disconnected':
      return 'Connection Failed';
    default:
      return hasCredentials ? 'Verifying...' : 'Not Configured';
  }
}

function getPhoneNumberStatusClass(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-repwell-sage-200/20 text-repwell-sage-200 border border-repwell-sage-200/30';
    case 'pending':
      return 'bg-amber-50 text-amber-600 border border-amber-200';
    default:
      return 'bg-gray-50 text-gray-500 border border-gray-200';
  }
}

export function SmsTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<SmsPhoneNumber[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('unknown');
  const [webhookUrls, setWebhookUrls] = useState<{ statusCallback: string; inboundSms: string } | null>(null);

  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [messagingServiceSid, setMessagingServiceSid] = useState('');
  const [showAuthToken, setShowAuthToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const hasExistingCredentials = Boolean(settings?.twilio_account_sid);

  const [releaseTarget, setReleaseTarget] = useState<SmsPhoneNumber | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showAddNumber, setShowAddNumber] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [settingsResult, numbersResult, webhooksResult] = await Promise.all([
        getSmsSettings(),
        getSmsPhoneNumbers(),
        getWebhookUrls(),
      ]);

      if (settingsResult.success && settingsResult.data) {
        setSettings(settingsResult.data);
        setAccountSid(settingsResult.data.twilio_account_sid || '');
        setMessagingServiceSid(settingsResult.data.messaging_service_sid || '');
        // Auth token is not returned (encrypted) - leave blank
        setAuthToken('');
      }

      if (numbersResult.success && numbersResult.data) {
        setPhoneNumbers(numbersResult.data.filter((n) => n.status !== 'released'));
      }

      if (webhooksResult.success && webhooksResult.data) {
        setWebhookUrls(webhooksResult.data);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load SMS settings', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const checkConnection = useCallback(async () => {
    setConnectionStatus('checking');
    const result = await testTwilioConnection();
    if (result.success && result.data?.connected) {
      setConnectionStatus('connected');
    } else {
      setConnectionStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    if (settings?.twilio_account_sid) {
      checkConnection();
    }
  }, [settings?.twilio_account_sid, checkConnection]);

  async function handleSaveCredentials() {
    setIsSaving(true);
    try {
      const result = await saveTwilioCredentials({
        accountSid,
        authToken,
        messagingServiceSid: messagingServiceSid || undefined,
      });

      if (result.success) {
        toast({ title: 'Credentials saved', description: 'Twilio credentials verified and saved.' });
        setIsEditing(false);
        setAuthToken('');
        await loadData();
        await checkConnection();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSetDefaultNumber(phoneNumber: string) {
    startTransition(async () => {
      const result = await setDefaultFromNumber({ phoneNumber });
      if (result.success) {
        toast({ title: 'Default number updated' });
        await loadData();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    });
  }

  async function handleReleaseNumber() {
    if (!releaseTarget) return;
    setIsReleasing(true);
    try {
      const result = await releasePhoneNumber({ phoneNumberId: releaseTarget.id });
      if (result.success) {
        toast({ title: 'Number released', description: `${formatForDisplay(releaseTarget.phone_number)} has been released.` });
        setReleaseTarget(null);
        await loadData();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsReleasing(false);
    }
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function getStatusBadge(status: ConnectionStatus) {
    switch (status) {
      case 'connected':
        return (
          <Badge className="bg-repwell-sage-200/20 text-repwell-sage-200 border border-repwell-sage-200/30">
            <CheckCircle weight="fill" className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        );
      case 'disconnected':
        return (
          <Badge variant="destructive" className="bg-red-50 text-red-600 border border-red-200">
            <XCircle weight="fill" className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        );
      case 'checking':
        return (
          <Badge variant="secondary" className="bg-amber-50 text-amber-600 border border-amber-200">
            <ArrowsClockwise weight="bold" className="h-3 w-3 mr-1 animate-spin" />
            Checking
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-gray-50 text-gray-500 border border-gray-200">
            Not configured
          </Badge>
        );
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-40 w-full bg-muted rounded-xl" />
        <div className="h-64 w-full bg-muted rounded-xl" />
      </div>
    );
  }

  const registrationIncomplete =
    settings &&
    settings.registration_status !== 'fully_registered' &&
    settings.twilio_account_sid;

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-8">
      {/* 10DLC Registration Warning */}
      {registrationIncomplete && (
        <motion.div variants={fadeInUp}>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <Warning weight="fill" className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-800">
                Complete 10DLC registration to send messages
              </p>
              <p className="text-xs text-amber-700 mt-1">
                A2P 10DLC registration is required by carriers before you can send SMS messages. Messages will be blocked until registration is complete.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/settings?tab=sms-registration')}
              className="text-amber-700 border-amber-300 hover:bg-amber-100 flex-shrink-0"
            >
              Register Now
            </Button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h2 className="font-display text-2xl font-bold text-repwell-teal-500 tracking-tight">
          SMS Configuration
        </h2>
        <p className="text-repwell-teal-300 mt-1">
          Configure Twilio credentials, manage phone numbers, and set up your messaging service.
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Connection Status Hero */}
          <motion.div variants={fadeInUp}>
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-repwell-sage-200 to-repwell-teal-300 px-6 py-8 text-white">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <ChatTeardropDots weight="duotone" className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">Twilio Connection</p>
                        <h3 className="text-2xl font-bold">
                          {getConnectionHeading(connectionStatus, hasExistingCredentials)}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getStatusBadge(connectionStatus)}
                      {phoneNumbers.length > 0 && (
                        <Badge className="bg-white/20 text-white border-white/30 border">
                          <Phone weight="bold" className="h-3 w-3 mr-1" />
                          {phoneNumbers.length} number{phoneNumbers.length !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <p className="mt-6 text-white/90 text-sm">
                  {connectionStatus === 'connected'
                    ? 'Your Twilio account is connected and ready to send SMS messages.'
                    : 'Enter your Twilio credentials to start sending SMS review requests.'}
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Twilio Credentials Card */}
          <motion.div variants={fadeInUp}>
            <Card className="border border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-repwell-teal-500 flex items-center gap-2">
                      <Plugs weight="duotone" className="h-5 w-5" />
                      Twilio Credentials
                    </CardTitle>
                    <CardDescription>
                      Your Account SID and Auth Token from the Twilio Console.
                    </CardDescription>
                  </div>
                  {hasExistingCredentials && !isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-repwell-teal-300 border-repwell-teal-300/30"
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {hasExistingCredentials && !isEditing ? (
                  // Display masked credentials
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-repwell-teal-500">Account SID</Label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono text-repwell-teal-400">
                          {maskValue(settings?.twilio_account_sid || '')}
                        </code>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-repwell-teal-500">Auth Token</Label>
                      <div className="mt-1.5 flex items-center gap-2">
                        <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono text-repwell-teal-400">
                          {'•'.repeat(32)}
                        </code>
                      </div>
                    </div>
                    {settings?.messaging_service_sid && (
                      <div>
                        <Label className="text-sm font-medium text-repwell-teal-500">
                          Messaging Service SID
                        </Label>
                        <div className="mt-1.5 flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono text-repwell-teal-400">
                            {maskValue(settings.messaging_service_sid)}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Edit / Create form
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="accountSid" className="text-sm font-medium text-repwell-teal-500">
                        Account SID
                      </Label>
                      <Input
                        id="accountSid"
                        value={accountSid}
                        onChange={(e) => setAccountSid(e.target.value)}
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="mt-1.5 font-mono text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="authToken" className="text-sm font-medium text-repwell-teal-500">
                        Auth Token
                      </Label>
                      <div className="relative mt-1.5">
                        <Input
                          id="authToken"
                          type={showAuthToken ? 'text' : 'password'}
                          value={authToken}
                          onChange={(e) => setAuthToken(e.target.value)}
                          placeholder={hasExistingCredentials ? 'Enter new token to update' : 'Your Twilio Auth Token'}
                          className="font-mono text-sm pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowAuthToken(!showAuthToken)}
                          aria-label={showAuthToken ? 'Hide auth token' : 'Show auth token'}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-repwell-teal-400 transition-colors"
                        >
                          {showAuthToken ? (
                            <EyeSlash className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="messagingServiceSid" className="text-sm font-medium text-repwell-teal-500">
                        Messaging Service SID{' '}
                        <span className="text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <Input
                        id="messagingServiceSid"
                        value={messagingServiceSid}
                        onChange={(e) => setMessagingServiceSid(e.target.value)}
                        placeholder="MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className="mt-1.5 font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Required for A2P 10DLC compliance. Create one in your Twilio Console.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        onClick={handleSaveCredentials}
                        disabled={isSaving || !accountSid || !authToken}
                        className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
                      >
                        {isSaving ? (
                          <>
                            <ArrowsClockwise className="h-4 w-4 mr-2 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Save & Verify'
                        )}
                      </Button>
                      {isEditing && (
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setIsEditing(false);
                            setAccountSid(settings?.twilio_account_sid || '');
                            setMessagingServiceSid(settings?.messaging_service_sid || '');
                            setAuthToken('');
                          }}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Phone Numbers Card */}
          <motion.div variants={fadeInUp}>
            <Card className="border border-border/50 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg text-repwell-teal-500 flex items-center gap-2">
                      <Phone weight="duotone" className="h-5 w-5" />
                      Phone Numbers
                    </CardTitle>
                    <CardDescription>Manage your Twilio phone numbers for sending SMS.</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowAddNumber(true)}
                    disabled={!hasExistingCredentials || connectionStatus !== 'connected'}
                    size="sm"
                    className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Number
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {phoneNumbers.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="mx-auto w-12 h-12 rounded-full bg-repwell-sage-100/50 flex items-center justify-center">
                      <Phone weight="duotone" className="h-6 w-6 text-repwell-teal-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-repwell-teal-500">No phone numbers</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {hasExistingCredentials
                          ? 'Add a phone number to start sending SMS messages.'
                          : 'Configure your Twilio credentials first, then add a phone number.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Default From Number */}
                    <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                      <Label className="text-sm font-medium text-repwell-teal-500 whitespace-nowrap">
                        Default From:
                      </Label>
                      <Select
                        value={settings?.default_from_number || ''}
                        onValueChange={handleSetDefaultNumber}
                        disabled={isPending}
                      >
                        <SelectTrigger className="w-full max-w-xs">
                          <SelectValue placeholder="Select default number" />
                        </SelectTrigger>
                        <SelectContent>
                          {phoneNumbers.map((n) => (
                            <SelectItem key={n.id} value={n.phone_number}>
                              {formatForDisplay(n.phone_number)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Phone Numbers Table */}
                    <div className="rounded-lg border border-border/50 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="text-repwell-teal-500 font-semibold">Number</TableHead>
                            <TableHead className="text-repwell-teal-500 font-semibold">Type</TableHead>
                            <TableHead className="text-repwell-teal-500 font-semibold">Status</TableHead>
                            <TableHead className="text-repwell-teal-500 font-semibold">Capabilities</TableHead>
                            <TableHead className="text-repwell-teal-500 font-semibold text-right">Cost/mo</TableHead>
                            <TableHead className="w-[60px]" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {phoneNumbers.map((num) => (
                            <TableRow key={num.id} className="hover:bg-muted/20">
                              <TableCell className="font-mono text-sm text-repwell-teal-400">
                                {formatForDisplay(num.phone_number)}
                                {settings?.default_from_number === num.phone_number && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    Default
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize text-xs">
                                  {num.number_type.replace('_', ' ')}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={getPhoneNumberStatusClass(num.status)}>
                                  {num.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  {num.capabilities?.sms && (
                                    <Badge variant="secondary" className="text-xs">SMS</Badge>
                                  )}
                                  {num.capabilities?.mms && (
                                    <Badge variant="secondary" className="text-xs">MMS</Badge>
                                  )}
                                  {num.capabilities?.voice && (
                                    <Badge variant="secondary" className="text-xs">Voice</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm text-repwell-teal-400">
                                ${(num.monthly_cost_cents / 100).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReleaseTarget(num)}
                                  aria-label={`Release ${formatForDisplay(num.phone_number)}`}
                                  className="text-muted-foreground hover:text-red-500 h-8 w-8 p-0"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Webhook URLs Card */}
          {webhookUrls && hasExistingCredentials && (
            <motion.div variants={fadeInUp}>
              <Card className="border border-border/50 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-repwell-teal-500 flex items-center gap-2">
                    <Globe weight="duotone" className="h-5 w-5" />
                    Webhook URLs
                  </CardTitle>
                  <CardDescription>
                    Configure these URLs in your Twilio Console for message status updates and inbound messages.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <WebhookUrlRow
                    label="Status Callback URL"
                    url={webhookUrls.statusCallback}
                    field="statusCallback"
                    copiedField={copiedField}
                    onCopy={copyToClipboard}
                  />
                  <WebhookUrlRow
                    label="Inbound SMS URL"
                    url={webhookUrls.inboundSms}
                    field="inboundSms"
                    copiedField={copiedField}
                    onCopy={copyToClipboard}
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column - Quick Actions & Info */}
        <motion.div variants={fadeInUp}>
          <Card className="h-fit border-border/50 sticky top-6">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-repwell-teal-500">Setup Guide</h4>

              <div className="space-y-3">
                <SetupStep
                  number={1}
                  title="Add Twilio Credentials"
                  description="Enter your Account SID and Auth Token"
                  completed={hasExistingCredentials && connectionStatus === 'connected'}
                />
                <SetupStep
                  number={2}
                  title="Add a Phone Number"
                  description="Purchase or add an existing number"
                  completed={phoneNumbers.length > 0}
                />
                <SetupStep
                  number={3}
                  title="Set Default Number"
                  description="Choose the default sender number"
                  completed={Boolean(settings?.default_from_number)}
                />
                <SetupStep
                  number={4}
                  title="Configure Webhooks"
                  description="Set callback URLs in Twilio Console"
                  completed={false}
                />
              </div>

              {/* Security Info */}
              <div className="pt-4 border-t border-border/50 space-y-3">
                <p className="text-xs font-medium text-repwell-teal-500">Security</p>
                <ul className="space-y-2">
                  {[
                    'Auth tokens are encrypted at rest',
                    'Credentials validated before saving',
                    'Admin/manager access only',
                    'Webhook signatures verified',
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs text-repwell-teal-300">
                      <ShieldCheck
                        weight="duotone"
                        className="h-4 w-4 text-repwell-sage-200 flex-shrink-0 mt-0.5"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Add Phone Number Dialog */}
      <AddPhoneNumberDialog
        open={showAddNumber}
        onOpenChange={setShowAddNumber}
        onSuccess={() => {
          setShowAddNumber(false);
          loadData();
        }}
      />

      {/* Release Confirmation Dialog */}
      <AlertDialog open={Boolean(releaseTarget)} onOpenChange={() => setReleaseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning weight="fill" className="h-5 w-5 text-amber-500" />
              Release Phone Number
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                Are you sure you want to release{' '}
                <strong>{releaseTarget ? formatForDisplay(releaseTarget.phone_number) : ''}</strong>?
              </span>
              <span className="block text-amber-600 text-sm">
                This will remove the number from your Twilio account. Any active SMS campaigns using
                this number will be affected. This action cannot be undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReleasing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReleaseNumber}
              disabled={isReleasing}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isReleasing ? 'Releasing...' : 'Release Number'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enterprise Features */}
      <motion.div variants={fadeInUp} className="space-y-6">
        <BrandedDomainSetup />
        <LoPhoneAssignment />
        <AuditLogViewer />
      </motion.div>
    </motion.div>
  );
}

function WebhookUrlRow({
  label,
  url,
  field,
  copiedField,
  onCopy,
}: {
  label: string;
  url: string;
  field: string;
  copiedField: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <div>
      <Label className="text-sm font-medium text-repwell-teal-500">{label}</Label>
      <div className="mt-1.5 flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-muted rounded-lg text-sm font-mono text-repwell-teal-400 truncate">
          {url}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopy(url, field)}
          className="h-9 w-9 p-0 flex-shrink-0"
        >
          {copiedField === field ? (
            <Check className="h-4 w-4 text-repwell-sage-200" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

function SetupStep({
  number,
  title,
  description,
  completed,
}: {
  number: number;
  title: string;
  description: string;
  completed: boolean;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-repwell-sage-100/30">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
          completed
            ? 'bg-repwell-sage-200/20 text-repwell-sage-200'
            : 'bg-repwell-teal-300/10 text-repwell-teal-300'
        }`}
      >
        {completed ? <CheckCircle weight="fill" className="h-4 w-4" /> : number}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${completed ? 'text-repwell-sage-200' : 'text-repwell-teal-500'}`}>
          {title}
        </p>
        <p className="text-xs text-repwell-teal-300 truncate">{description}</p>
      </div>
      {completed && <ArrowRight className="h-4 w-4 text-repwell-sage-200 flex-shrink-0" />}
    </div>
  );
}
