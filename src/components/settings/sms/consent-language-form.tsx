'use client';

import { useState } from 'react';
import { TextAlignLeft } from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { saveConsentLanguage } from '@/lib/sms/compliance/actions';
import type { SmsSettings } from '@/lib/sms/types';

interface ConsentLanguageFormProps {
  settings: SmsSettings;
  onSaved: () => void;
}

export function ConsentLanguageForm({ settings, onSaved }: ConsentLanguageFormProps) {
  const { toast } = useToast();
  const [consentText, setConsentText] = useState(settings.consent_language_text);
  const [isSaving, setIsSaving] = useState(false);
  const isDirty = consentText !== settings.consent_language_text;

  async function handleSave() {
    setIsSaving(true);
    try {
      const result = await saveConsentLanguage({ consentLanguageText: consentText });
      if (result.success) {
        toast({ title: 'Consent language saved' });
        onSaved();
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
        <CardTitle className="text-lg text-repwell-teal-500 flex items-center gap-2">
          <TextAlignLeft weight="duotone" className="h-5 w-5" />
          Consent Language
        </CardTitle>
        <CardDescription>
          Define the opt-in consent text displayed on web forms and survey pages.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-repwell-teal-500">
            Consent text
          </Label>
          <Textarea
            value={consentText}
            onChange={(e) => setConsentText(e.target.value)}
            placeholder="Enter consent language..."
            className="mt-1.5 min-h-[100px] text-sm"
            maxLength={1000}
          />
          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-muted-foreground">
              Displayed below phone number fields on web forms. Use {'{{company_name}}'} for your
              organization name.
            </p>
            <span className="text-xs text-muted-foreground tabular-nums">
              {consentText.length}/1000
            </span>
          </div>
        </div>

        {/* Preview */}
        <div className="p-4 rounded-lg bg-repwell-sage-100/20 border border-border/50">
          <p className="text-xs font-medium text-repwell-teal-500 mb-2">Form preview</p>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-border/30 space-y-3">
            <div>
              <label className="block text-sm font-medium text-repwell-teal-500 mb-1">
                Phone number
              </label>
              <div className="h-9 rounded-md border border-border bg-muted/30 px-3 flex items-center">
                <span className="text-sm text-muted-foreground">(555) 123-4567</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {consentText.replace(/\{\{company_name\}\}/g, 'Your Company')}
            </p>
          </div>
        </div>

        {isDirty && (
          <div className="flex items-center gap-3 pt-2 border-t border-border/50">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
            >
              {isSaving ? 'Saving...' : 'Save consent language'}
            </Button>
            <p className="text-xs text-amber-600">You have unsaved changes</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
