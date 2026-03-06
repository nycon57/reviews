'use client';

import { useState, useEffect } from 'react';
import { Prohibit, HandPalm } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveOptOutSettings, saveDoubleOptIn } from '@/lib/sms/compliance/actions';
import type { SmsSettings } from '@/lib/sms/types';

interface OptOutSettingsFormProps {
  settings: SmsSettings;
  onSaved: () => void;
}

export function OptOutSettingsForm({ settings, onSaved }: OptOutSettingsFormProps) {
  const { toast } = useToast();

  // Opt-out state
  const [stopResponse, setStopResponse] = useState(settings.stop_response);
  const [helpResponse, setHelpResponse] = useState(settings.help_response);
  const [isSavingOptOut, setIsSavingOptOut] = useState(false);
  const [isOptOutDirty, setIsOptOutDirty] = useState(false);

  // Double opt-in state
  const [doubleOptInEnabled, setDoubleOptInEnabled] = useState(settings.double_opt_in_enabled);
  const [doubleOptInMessage, setDoubleOptInMessage] = useState(settings.double_opt_in_message);
  const [isSavingOptIn, setIsSavingOptIn] = useState(false);
  const [isOptInDirty, setIsOptInDirty] = useState(false);

  useEffect(() => {
    setIsOptOutDirty(
      stopResponse !== settings.stop_response || helpResponse !== settings.help_response
    );
  }, [stopResponse, helpResponse, settings]);

  useEffect(() => {
    setIsOptInDirty(
      doubleOptInEnabled !== settings.double_opt_in_enabled ||
        doubleOptInMessage !== settings.double_opt_in_message
    );
  }, [doubleOptInEnabled, doubleOptInMessage, settings]);

  async function handleSaveOptOut() {
    setIsSavingOptOut(true);
    try {
      const result = await saveOptOutSettings({ stopResponse, helpResponse });
      if (result.success) {
        toast({ title: 'Opt-out settings saved' });
        onSaved();
        setIsOptOutDirty(false);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsSavingOptOut(false);
    }
  }

  async function handleSaveOptIn() {
    setIsSavingOptIn(true);
    try {
      const result = await saveDoubleOptIn({ doubleOptInEnabled, doubleOptInMessage });
      if (result.success) {
        toast({ title: 'Double opt-in settings saved' });
        onSaved();
        setIsOptInDirty(false);
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsSavingOptIn(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Opt-Out Settings */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-heading flex items-center gap-2">
            <Prohibit weight="duotone" className="h-5 w-5" />
            Opt-Out Settings
          </CardTitle>
          <CardDescription>
            Configure auto-response messages for STOP and HELP keywords.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* STOP Response */}
          <div>
            <Label className="text-sm font-medium text-heading-accent">
              STOP response message
            </Label>
            <Textarea
              value={stopResponse}
              onChange={(e) => setStopResponse(e.target.value)}
              placeholder="Enter STOP auto-response..."
              className="mt-1.5 min-h-[80px] text-sm"
              maxLength={320}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-muted-foreground">
                Sent automatically when a recipient texts STOP.
                Use {'{{company_name}}'} for your organization name.
              </p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {stopResponse.length}/320
              </span>
            </div>
          </div>

          {/* HELP Response */}
          <div>
            <Label className="text-sm font-medium text-heading-accent">
              HELP response message
            </Label>
            <Textarea
              value={helpResponse}
              onChange={(e) => setHelpResponse(e.target.value)}
              placeholder="Enter HELP auto-response..."
              className="mt-1.5 min-h-[80px] text-sm"
              maxLength={320}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-muted-foreground">
                Sent automatically when a recipient texts HELP.
              </p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {helpResponse.length}/320
              </span>
            </div>
          </div>

          {isOptOutDirty && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <Button
                onClick={handleSaveOptOut}
                disabled={isSavingOptOut}
                className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
              >
                {isSavingOptOut ? 'Saving...' : 'Save opt-out settings'}
              </Button>
              <p className="text-xs text-amber-600">You have unsaved changes</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Double Opt-In */}
      <Card className="border border-border/50 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg text-heading flex items-center gap-2">
                <HandPalm weight="duotone" className="h-5 w-5" />
                Double Opt-In
              </CardTitle>
              <CardDescription>
                Require recipients to confirm consent before receiving messages.
              </CardDescription>
            </div>
            <Switch
              checked={doubleOptInEnabled}
              onCheckedChange={setDoubleOptInEnabled}
              aria-label="Enable double opt-in"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset disabled={!doubleOptInEnabled} className={`border-0 p-0 m-0 ${!doubleOptInEnabled ? 'opacity-50' : ''}`}>
            <Label className="text-sm font-medium text-heading-accent">
              Confirmation message
            </Label>
            <Textarea
              value={doubleOptInMessage}
              onChange={(e) => setDoubleOptInMessage(e.target.value)}
              placeholder="Enter confirmation message..."
              className="mt-1.5 min-h-[80px] text-sm"
              maxLength={320}
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-muted-foreground">
                Sent after initial opt-in. Recipient must reply YES to confirm.
              </p>
              <span className="text-xs text-muted-foreground tabular-nums">
                {doubleOptInMessage.length}/320
              </span>
            </div>

            {/* Preview */}
            {doubleOptInEnabled && (
              <div className="mt-4 p-3 rounded-lg bg-repwell-sage-100/20 dark:bg-repwell-teal-300/10 border border-border/50">
                <p className="text-xs font-medium text-heading mb-1.5">Preview</p>
                <div className="bg-card rounded-lg p-3 shadow-sm border border-border/30">
                  <p className="text-sm text-label whitespace-pre-wrap">
                    {doubleOptInMessage.replace(/\{\{company_name\}\}/g, 'Your Company')}
                  </p>
                </div>
              </div>
            )}
          </fieldset>

          {isOptInDirty && (
            <div className="flex items-center gap-3 pt-2 border-t border-border/50">
              <Button
                onClick={handleSaveOptIn}
                disabled={isSavingOptIn}
                className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
              >
                {isSavingOptIn ? 'Saving...' : 'Save double opt-in settings'}
              </Button>
              <p className="text-xs text-amber-600">You have unsaved changes</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
