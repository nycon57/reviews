'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Buildings,
  ChatCircleText,
  ChartBar,
  CheckCircle,
  Warning,
  ArrowLeft,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { fadeInUp, staggerContainer } from '@/lib/motion/variants';
import {
  getRegistrationStatus,
  registerBrand,
  registerCampaign,
  refreshRegistrationStatus,
} from '@/lib/sms/registration/actions';
import type { BrandRegistrationInput, CampaignRegistrationInput } from '@/lib/sms/registration/schemas';
import { BrandRegistrationForm } from './brand-registration-form';
import { CampaignRegistrationForm } from './campaign-registration-form';
import { RegistrationStatusDashboard } from './registration-status-dashboard';

type WizardStep = 1 | 2 | 3;

const STEPS = [
  { step: 1 as const, label: 'Brand Registration', icon: Buildings },
  { step: 2 as const, label: 'Campaign Registration', icon: ChatCircleText },
  { step: 3 as const, label: 'Verification Status', icon: ChartBar },
];

interface RegistrationState {
  registrationStatus: string;
  brandId: string | null;
  campaignId: string | null;
  brandName: string | null;
  messagingServiceSid: string | null;
  brandFailureReason: string | null;
  campaignFailureReason: string | null;
}

function determineActiveStep(state: RegistrationState): WizardStep {
  const { registrationStatus } = state;
  if (registrationStatus === 'brand_approved') return 2;
  if (['brand_pending', 'campaign_pending', 'campaign_approved', 'fully_registered'].includes(registrationStatus)) {
    return 3;
  }
  return 1;
}

function isStepComplete(step: WizardStep, state: RegistrationState): boolean {
  const { registrationStatus } = state;
  if (step === 1) {
    return !['not_started', 'rejected'].includes(registrationStatus);
  }
  if (step === 2) {
    return ['campaign_pending', 'campaign_approved', 'fully_registered'].includes(registrationStatus);
  }
  if (step === 3) {
    return registrationStatus === 'fully_registered';
  }
  return false;
}

function isStepAccessible(step: WizardStep, state: RegistrationState): boolean {
  const { registrationStatus } = state;
  if (step === 1) return true;
  if (step === 2) return registrationStatus === 'brand_approved';
  if (step === 3) return registrationStatus !== 'not_started';
  return false;
}

export function RegistrationWizard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [state, setState] = useState<RegistrationState>({
    registrationStatus: 'not_started',
    brandId: null,
    campaignId: null,
    brandName: null,
    messagingServiceSid: null,
    brandFailureReason: null,
    campaignFailureReason: null,
  });

  const loadStatus = useCallback(async () => {
    const result = await getRegistrationStatus();
    if (result.success && result.data) {
      setState(result.data);
      setCurrentStep(determineActiveStep(result.data));
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadStatus().finally(() => setIsLoading(false));
  }, [loadStatus]);

  async function handleBrandSubmit(data: BrandRegistrationInput) {
    setIsSubmitting(true);
    try {
      const result = await registerBrand(data);
      if (result.success) {
        toast({ title: 'Brand submitted', description: 'Your brand registration has been submitted to Twilio for review.' });
        await loadStatus();
      } else {
        toast({ title: 'Registration failed', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCampaignSubmit(data: CampaignRegistrationInput) {
    setIsSubmitting(true);
    try {
      const result = await registerCampaign(data);
      if (result.success) {
        toast({ title: 'Campaign submitted', description: 'Your campaign registration has been submitted to Twilio for review.' });
        await loadStatus();
      } else {
        toast({ title: 'Registration failed', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const result = await refreshRegistrationStatus();
      if (result.success) {
        await loadStatus();
        toast({ title: 'Status updated' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-muted rounded" />
        <div className="h-16 w-full bg-muted rounded-xl" />
        <div className="h-96 w-full bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={staggerContainer} className="space-y-6">
      {/* Warning Banner */}
      {state.registrationStatus !== 'fully_registered' && state.registrationStatus !== 'not_started' && (
        <motion.div variants={fadeInUp}>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex items-start gap-3">
            <Warning weight="fill" className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">
                10DLC registration is in progress
              </p>
              <p className="text-xs text-amber-700 mt-1">
                SMS sending is blocked until your brand and campaign registration are fully approved by carriers.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Progress Indicator */}
      <motion.div variants={fadeInUp}>
        <div className="flex items-center gap-2" role="group" aria-label="Registration steps">
          {STEPS.map((s, index) => {
            const StepIcon = s.icon;
            const complete = isStepComplete(s.step, state);
            const active = currentStep === s.step;
            const accessible = isStepAccessible(s.step, state);

            return (
              <div key={s.step} className="flex items-center gap-2 flex-1">
                <button
                  onClick={() => accessible && setCurrentStep(s.step)}
                  disabled={!accessible}
                  aria-label={`Step ${s.step}: ${s.label}${complete ? ' (completed)' : active ? ' (current)' : ''}`}
                  aria-current={active ? 'step' : undefined}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-lg transition-all w-full text-left ${
                    active
                      ? 'bg-repwell-teal-300/10 border border-repwell-teal-300/30 text-heading'
                      : complete
                        ? 'bg-repwell-sage-200/10 border border-repwell-sage-200/20 text-repwell-sage-200'
                        : 'bg-muted/30 border border-border/50 text-muted-foreground'
                  } ${accessible && !active ? 'cursor-pointer hover:bg-repwell-sage-100/30 dark:hover:bg-repwell-teal-300/10' : ''} ${!accessible ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      complete
                        ? 'bg-repwell-sage-200/20'
                        : active
                          ? 'bg-repwell-teal-300/20'
                          : 'bg-muted'
                    }`}
                  >
                    {complete ? (
                      <CheckCircle weight="fill" className="h-4 w-4 text-repwell-sage-200" />
                    ) : (
                      <StepIcon weight="duotone" className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium leading-none">Step {s.step}</p>
                    <p className="text-xs mt-0.5 truncate">{s.label}</p>
                  </div>
                </button>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-px w-4 flex-shrink-0 ${
                      complete ? 'bg-repwell-sage-200' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Step Content */}
      <motion.div variants={fadeInUp}>
        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-heading flex items-center gap-2">
              {currentStep === 1 && <Buildings weight="duotone" className="h-5 w-5" />}
              {currentStep === 2 && <ChatCircleText weight="duotone" className="h-5 w-5" />}
              {currentStep === 3 && <ChartBar weight="duotone" className="h-5 w-5" />}
              {STEPS[currentStep - 1].label}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 &&
                'Register your company as a brand with the 10DLC ecosystem. This is required for A2P SMS compliance.'}
              {currentStep === 2 &&
                'Register your messaging campaign (use case) with carriers. This describes how and why you send messages.'}
              {currentStep === 3 &&
                'Track the status of your brand and campaign registrations with Twilio and carriers.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              state.registrationStatus !== 'not_started' && state.registrationStatus !== 'rejected' ? (
                <div className="space-y-4">
                  <div className="rounded-lg bg-repwell-sage-200/10 border border-repwell-sage-200/30 p-4">
                    <p className="text-sm text-repwell-sage-200 font-medium">
                      Brand registration already submitted.
                    </p>
                    <p className="text-xs text-repwell-teal-300 mt-1">
                      Brand: {state.brandName || 'N/A'} ({state.brandId})
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(determineActiveStep(state))}
                    className="text-repwell-teal-300"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Go to current step
                  </Button>
                </div>
              ) : (
                <BrandRegistrationForm
                  onSubmit={handleBrandSubmit}
                  isSubmitting={isSubmitting}
                />
              )
            )}

            {currentStep === 2 && (
              state.registrationStatus !== 'brand_approved' ? (
                <div className="space-y-4">
                  {['campaign_pending', 'campaign_approved', 'fully_registered'].includes(
                    state.registrationStatus
                  ) ? (
                    <div className="rounded-lg bg-repwell-sage-200/10 border border-repwell-sage-200/30 p-4">
                      <p className="text-sm text-repwell-sage-200 font-medium">
                        Campaign registration already submitted.
                      </p>
                      <p className="text-xs text-repwell-teal-300 mt-1">
                        Campaign ID: {state.campaignId}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                      <p className="text-sm text-amber-800 font-medium">
                        Waiting for brand approval
                      </p>
                      <p className="text-xs text-amber-700 mt-1">
                        Campaign registration will be available after your brand is approved.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <CampaignRegistrationForm
                  onSubmit={handleCampaignSubmit}
                  isSubmitting={isSubmitting}
                  brandName={state.brandName}
                />
              )
            )}

            {currentStep === 3 && (
              <RegistrationStatusDashboard
                registrationStatus={state.registrationStatus}
                brandId={state.brandId}
                campaignId={state.campaignId}
                brandName={state.brandName}
                brandFailureReason={state.brandFailureReason}
                campaignFailureReason={state.campaignFailureReason}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
