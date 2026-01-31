'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ChatCircleText,
  TextAa,
  ArrowRight,
  ArrowsClockwise,
  Info,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  campaignRegistrationSchema,
  type CampaignRegistrationInput,
  OPT_IN_METHODS,
  DEFAULT_OPT_OUT_KEYWORDS,
  DEFAULT_HELP_KEYWORDS,
  DEFAULT_OPT_IN_KEYWORDS,
} from '@/lib/sms/registration/schemas';

interface CampaignRegistrationFormProps {
  onSubmit: (data: CampaignRegistrationInput) => Promise<void>;
  isSubmitting: boolean;
  brandName: string | null;
}

export function CampaignRegistrationForm({
  onSubmit,
  isSubmitting,
  brandName,
}: CampaignRegistrationFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<CampaignRegistrationInput>({
    resolver: zodResolver(campaignRegistrationSchema),
    defaultValues: {
      campaignDescription: `${brandName || 'Our company'} sends SMS messages to customers who have completed a transaction, requesting a brief review of their experience. Messages include a link to a review form. This is a review solicitation service for customer feedback.`,
      messageSample: `Hi {CustomerName}, thank you for choosing ${brandName || 'us'}! We'd love your feedback. Please leave a quick review here: {ReviewLink}. Reply STOP to opt out.`,
      messageFlowDescription: `Customers opt in to receive a review request after completing a mortgage transaction. They provide their phone number during the application process and consent to receiving a follow-up SMS. Only one message is sent per transaction unless the customer opts in to a follow-up reminder.`,
      optInDescription: `Customers provide consent during the loan application process by checking a box to receive a post-closing follow-up SMS requesting a review of their experience.`,
      optInKeywords: DEFAULT_OPT_IN_KEYWORDS,
      optOutKeywords: DEFAULT_OPT_OUT_KEYWORDS,
      helpKeywords: DEFAULT_HELP_KEYWORDS,
      subscriberOptInMethods: ['WEB_FORM'],
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Campaign Description */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-repwell-teal-500">
          <ChatCircleText weight="duotone" className="h-4 w-4" />
          Campaign Details
        </div>

        <div>
          <Label htmlFor="campaignDescription" className="text-sm font-medium text-repwell-teal-500">
            Campaign Description
          </Label>
          <Textarea
            id="campaignDescription"
            {...register('campaignDescription')}
            rows={4}
            className="mt-1.5 text-sm"
            placeholder="Describe what your campaign does and why you send messages..."
          />
          {errors.campaignDescription && (
            <p className="text-xs text-red-500 mt-1">{errors.campaignDescription.message}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Describe why and how you send SMS messages. Minimum 40 characters.
          </p>
        </div>

        <div>
          <Label htmlFor="messageSample" className="text-sm font-medium text-repwell-teal-500">
            Message Sample
          </Label>
          <Textarea
            id="messageSample"
            {...register('messageSample')}
            rows={3}
            className="mt-1.5 text-sm"
            placeholder="Example message you will send to customers..."
          />
          {errors.messageSample && (
            <p className="text-xs text-red-500 mt-1">{errors.messageSample.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="messageFlowDescription" className="text-sm font-medium text-repwell-teal-500">
            Message Flow
          </Label>
          <Textarea
            id="messageFlowDescription"
            {...register('messageFlowDescription')}
            rows={3}
            className="mt-1.5 text-sm"
            placeholder="Describe the end-to-end message flow from opt-in to delivery..."
          />
          {errors.messageFlowDescription && (
            <p className="text-xs text-red-500 mt-1">{errors.messageFlowDescription.message}</p>
          )}
        </div>
      </div>

      {/* Opt-in / Opt-out */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-repwell-teal-500">
          <TextAa weight="duotone" className="h-4 w-4" />
          Consent &amp; Keywords
        </div>

        <div>
          <Label htmlFor="optInDescription" className="text-sm font-medium text-repwell-teal-500">
            Opt-in Description
          </Label>
          <Textarea
            id="optInDescription"
            {...register('optInDescription')}
            rows={3}
            className="mt-1.5 text-sm"
            placeholder="Describe how customers consent to receive messages..."
          />
          {errors.optInDescription && (
            <p className="text-xs text-red-500 mt-1">{errors.optInDescription.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="optInKeywords" className="text-sm font-medium text-repwell-teal-500">
              Opt-in Keywords
            </Label>
            <Input
              id="optInKeywords"
              {...register('optInKeywords')}
              className="mt-1.5 text-sm"
            />
            {errors.optInKeywords && (
              <p className="text-xs text-red-500 mt-1">{errors.optInKeywords.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="optOutKeywords" className="text-sm font-medium text-repwell-teal-500">
              Opt-out Keywords
            </Label>
            <Input
              id="optOutKeywords"
              {...register('optOutKeywords')}
              className="mt-1.5 text-sm"
            />
            {errors.optOutKeywords && (
              <p className="text-xs text-red-500 mt-1">{errors.optOutKeywords.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="helpKeywords" className="text-sm font-medium text-repwell-teal-500">
              Help Keywords
            </Label>
            <Input
              id="helpKeywords"
              {...register('helpKeywords')}
              className="mt-1.5 text-sm"
            />
            {errors.helpKeywords && (
              <p className="text-xs text-red-500 mt-1">{errors.helpKeywords.message}</p>
            )}
          </div>
        </div>

        <div className="bg-repwell-sage-100/30 rounded-lg p-3 flex gap-2 text-xs text-repwell-teal-300">
          <Info weight="fill" className="h-4 w-4 flex-shrink-0 mt-0.5" />
          Default keywords are pre-filled based on industry standards. Carriers require STOP/HELP support.
        </div>
      </div>

      {/* Opt-in Methods */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-repwell-teal-500">
          Subscriber Opt-in Methods
        </Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <Controller
            name="subscriberOptInMethods"
            control={control}
            render={({ field }) => (
              <>
                {OPT_IN_METHODS.map((method) => {
                  const checked = field.value?.includes(method.value) ?? false;
                  return (
                    <label
                      key={method.value}
                      className="flex items-center gap-3 p-3 rounded-lg border border-border/50 hover:border-repwell-teal-300/30 transition-colors cursor-pointer"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(c) => {
                          const current = field.value || [];
                          if (c) {
                            field.onChange([...current, method.value]);
                          } else {
                            field.onChange(current.filter((v) => v !== method.value));
                          }
                        }}
                      />
                      <span className="text-sm text-repwell-teal-400">{method.label}</span>
                    </label>
                  );
                })}
              </>
            )}
          />
        </div>
        {errors.subscriberOptInMethods && (
          <p className="text-xs text-red-500">{errors.subscriberOptInMethods.message}</p>
        )}
      </div>

      <div className="flex justify-end pt-4 border-t border-border/50">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
        >
          {isSubmitting ? (
            <>
              <ArrowsClockwise className="h-4 w-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit Campaign Registration
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
