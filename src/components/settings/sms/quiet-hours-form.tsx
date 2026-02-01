'use client';

import { useState, useEffect } from 'react';
import { Clock, Info } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { saveQuietHours } from '@/lib/sms/compliance/actions';
import type { SmsSettings } from '@/lib/sms/types';

const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
];

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = i % 2 === 0 ? '00' : '30';
  const hh = String(h).padStart(2, '0');
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { value: `${hh}:${m}`, label: `${displayH}:${m} ${period}` };
});

interface QuietHoursFormProps {
  settings: SmsSettings;
  onSaved: () => void;
}

export function QuietHoursForm({ settings, onSaved }: QuietHoursFormProps) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(settings.quiet_hours_enabled);
  const [startTime, setStartTime] = useState(settings.quiet_hours_start);
  const [endTime, setEndTime] = useState(settings.quiet_hours_end);
  const [timezone, setTimezone] = useState(settings.quiet_hours_timezone);
  const [useRecipient, setUseRecipient] = useState(settings.use_recipient_timezone);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const dirty =
      enabled !== settings.quiet_hours_enabled ||
      startTime !== settings.quiet_hours_start ||
      endTime !== settings.quiet_hours_end ||
      timezone !== settings.quiet_hours_timezone ||
      useRecipient !== settings.use_recipient_timezone;
    setIsDirty(dirty);
  }, [enabled, startTime, endTime, timezone, useRecipient, settings]);

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await saveQuietHours({
        quietHoursEnabled: enabled,
        quietHoursStart: startTime,
        quietHoursEnd: endTime,
        quietHoursTimezone: timezone,
        useRecipientTimezone: useRecipient,
      });

      if (result.success) {
        toast({ title: 'Quiet hours saved', description: 'Your quiet hours settings have been updated.' });
        onSaved();
        setIsDirty(false);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="border border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-repwell-teal-500 flex items-center gap-2">
              <Clock weight="duotone" className="h-5 w-5" />
              Quiet Hours
            </CardTitle>
            <CardDescription>
              Block SMS sends during specified hours to comply with TCPA regulations.
            </CardDescription>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-label="Enable quiet hours"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <fieldset disabled={!enabled} className={`border-0 p-0 m-0 ${!enabled ? 'opacity-50' : ''}`}>
          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-repwell-teal-500">Start time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select start time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={`start-${t.value}`} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-repwell-teal-500">End time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select end time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((t) => (
                    <SelectItem key={`end-${t.value}`} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timezone */}
          <div className="mt-4">
            <Label className="text-sm font-medium text-repwell-teal-500">Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {US_TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Timezone Toggle */}
          <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-lg bg-repwell-sage-100/20">
            <div className="flex items-center gap-2">
              <Label htmlFor="use-recipient-tz" className="text-sm text-repwell-teal-400 cursor-pointer">
                Use recipient&apos;s timezone
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info weight="fill" className="h-3.5 w-3.5 text-repwell-teal-300 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    When enabled, quiet hours are enforced based on each recipient&apos;s local timezone
                    instead of your organization&apos;s timezone. This provides better TCPA compliance
                    for recipients in different time zones.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              id="use-recipient-tz"
              checked={useRecipient}
              onCheckedChange={setUseRecipient}
            />
          </div>

          {/* TCPA Note */}
          <p className="mt-3 text-xs text-muted-foreground">
            TCPA default: 9:00 PM to 8:00 AM local time. Messages queued during quiet hours will be sent
            when quiet hours end.
          </p>
        </fieldset>

        {/* Save Button */}
        {isDirty && (
          <div className="flex items-center gap-3 pt-2 border-t border-border/50">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
            >
              {isSaving ? 'Saving...' : 'Save quiet hours'}
            </Button>
            <p className="text-xs text-amber-600">You have unsaved changes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
