'use client';

import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowsClockwise,
  Warning,
  ShieldCheck,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface RegistrationStatusDashboardProps {
  registrationStatus: string;
  brandId: string | null;
  campaignId: string | null;
  brandName: string | null;
  brandFailureReason: string | null;
  campaignFailureReason: string | null;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

function getStatusDisplay(status: string): {
  label: string;
  color: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case 'fully_registered':
    case 'brand_approved':
    case 'campaign_approved':
      return {
        label: 'Approved',
        color: 'bg-repwell-sage-200/20 text-repwell-sage-200 border border-repwell-sage-200/30',
        icon: <CheckCircle weight="fill" className="h-4 w-4" />,
      };
    case 'brand_pending':
    case 'campaign_pending':
      return {
        label: 'Pending Review',
        color: 'bg-amber-50 text-amber-600 border border-amber-200',
        icon: <Clock weight="fill" className="h-4 w-4" />,
      };
    case 'rejected':
      return {
        label: 'Rejected',
        color: 'bg-red-50 text-red-600 border border-red-200',
        icon: <XCircle weight="fill" className="h-4 w-4" />,
      };
    default:
      return {
        label: 'Not Started',
        color: 'bg-gray-50 text-gray-500 border border-gray-200',
        icon: <Clock className="h-4 w-4" />,
      };
  }
}

function getBrandStatus(registrationStatus: string): string {
  if (registrationStatus === 'not_started') return 'not_started';
  if (registrationStatus === 'brand_pending') return 'brand_pending';
  if (registrationStatus === 'rejected') return 'rejected';
  return 'brand_approved';
}

function getCampaignStatus(registrationStatus: string): string {
  if (['not_started', 'brand_pending', 'brand_approved'].includes(registrationStatus)) {
    return 'not_started';
  }
  if (registrationStatus === 'campaign_pending') return 'campaign_pending';
  if (registrationStatus === 'rejected') return 'rejected';
  return 'fully_registered';
}

export function RegistrationStatusDashboard({
  registrationStatus,
  brandId,
  campaignId,
  brandName,
  brandFailureReason,
  campaignFailureReason,
  onRefresh,
  isRefreshing,
}: RegistrationStatusDashboardProps) {
  const brandStatus = getBrandStatus(registrationStatus);
  const campaignStatus = getCampaignStatus(registrationStatus);
  const brandDisplay = getStatusDisplay(brandStatus);
  const campaignDisplay = getStatusDisplay(campaignStatus);
  const isFullyRegistered = registrationStatus === 'fully_registered';
  const isRejected = registrationStatus === 'rejected';

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      {isFullyRegistered && (
        <div className="rounded-lg bg-repwell-sage-200/10 border border-repwell-sage-200/30 p-4 flex items-start gap-3">
          <ShieldCheck weight="duotone" className="h-5 w-5 text-repwell-sage-200 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-repwell-sage-200">
              10DLC Registration Complete
            </p>
            <p className="text-xs text-repwell-teal-300 mt-1">
              Your brand and campaign are fully registered. You can send A2P messages without carrier filtering.
            </p>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <Warning weight="fill" className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Registration Rejected</p>
            <p className="text-xs text-red-600 mt-1">
              Review the rejection reasons below and resubmit with corrected information.
            </p>
          </div>
        </div>
      )}

      {/* Brand Status Card */}
      <div className="rounded-lg border border-border/50 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-repwell-teal-500">Brand Registration</h4>
          <Badge className={brandDisplay.color}>
            {brandDisplay.icon}
            <span className="ml-1">{brandDisplay.label}</span>
          </Badge>
        </div>
        {brandId && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <span className="font-medium">Brand:</span> {brandName || 'N/A'}
            </p>
            <p>
              <span className="font-medium">Brand ID:</span>{' '}
              <code className="font-mono text-repwell-teal-400">{brandId}</code>
            </p>
          </div>
        )}
        {brandFailureReason && brandStatus === 'rejected' && (
          <div className="mt-2 rounded-md bg-red-50 p-3 text-xs text-red-700">
            <p className="font-medium">Rejection reason:</p>
            <p className="mt-1">{brandFailureReason}</p>
          </div>
        )}
        {brandStatus === 'brand_pending' && (
          <p className="text-xs text-muted-foreground">
            Brand review typically completes within 1-7 business days.
          </p>
        )}
      </div>

      {/* Campaign Status Card */}
      <div className="rounded-lg border border-border/50 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-repwell-teal-500">Campaign Registration</h4>
          <Badge className={campaignDisplay.color}>
            {campaignDisplay.icon}
            <span className="ml-1">{campaignDisplay.label}</span>
          </Badge>
        </div>
        {campaignId && (
          <div className="text-xs text-muted-foreground">
            <p>
              <span className="font-medium">Campaign ID:</span>{' '}
              <code className="font-mono text-repwell-teal-400">{campaignId}</code>
            </p>
          </div>
        )}
        {campaignFailureReason && campaignStatus === 'rejected' && (
          <div className="mt-2 rounded-md bg-red-50 p-3 text-xs text-red-700">
            <p className="font-medium">Rejection reason:</p>
            <p className="mt-1">{campaignFailureReason}</p>
          </div>
        )}
        {campaignStatus === 'not_started' && brandStatus !== 'brand_approved' && (
          <p className="text-xs text-muted-foreground">
            Campaign registration is available after brand approval.
          </p>
        )}
        {campaignStatus === 'campaign_pending' && (
          <p className="text-xs text-muted-foreground">
            Campaign review typically completes within 3-10 business days.
          </p>
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="text-repwell-teal-300 border-repwell-teal-300/30"
        >
          {isRefreshing ? (
            <>
              <ArrowsClockwise className="h-4 w-4 mr-2 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <ArrowsClockwise className="h-4 w-4 mr-2" />
              Check Status
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
