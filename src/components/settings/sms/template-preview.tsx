'use client';

import { useMemo } from 'react';
import { renderTemplatePreview } from '@/lib/sms/templates/merge-engine';
import { CheckCircle, Warning } from '@phosphor-icons/react';
import { OPT_OUT_PATTERN } from '@/lib/sms/templates/merge-engine';
import { RESPA_PROHIBITED_PATTERNS } from '@/lib/sms/templates/validators';
import { cn } from '@/lib/utils';

interface TemplatePreviewProps {
  body: string;
  className?: string;
}

export function TemplatePreview({ body, className }: TemplatePreviewProps) {
  const preview = useMemo(() => {
    if (!body.trim()) return null;
    return renderTemplatePreview(body);
  }, [body]);

  const hasOptOut = useMemo(() => OPT_OUT_PATTERN.test(body), [body]);

  const respaViolations = useMemo(() => {
    const violations: string[] = [];
    for (const pattern of RESPA_PROHIBITED_PATTERNS) {
      const match = pattern.exec(body);
      if (match) violations.push(match[0]);
    }
    return violations;
  }, [body]);

  if (!preview) {
    return (
      <div className={cn('rounded-xl border border-dashed border-border p-6 text-center', className)}>
        <p className="text-sm text-muted-foreground">
          Start typing to see a live preview with sample data.
        </p>
      </div>
    );
  }

  return (
    <div role="region" aria-live="polite" aria-label="Template preview" className={cn('space-y-3', className)}>
      {/* Phone mockup preview */}
      <div className="rounded-xl border border-border bg-background-subtle p-4">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Preview with sample data
        </div>
        <div className="bg-card rounded-lg p-3 shadow-sm border border-border">
          <p className="text-sm text-heading whitespace-pre-wrap break-words leading-relaxed">
            {preview.body}
          </p>
        </div>
        {preview.optOutAppended && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            Opt-out language auto-appended at send time.
          </p>
        )}
      </div>

      {/* Compliance indicators */}
      <div className="space-y-1.5">
        {/* Opt-out check */}
        <div className="flex items-center gap-2 text-xs">
          {hasOptOut ? (
            <>
              <CheckCircle weight="fill" className="h-4 w-4 text-repwell-sage-200" />
              <span className="text-label">Opt-out language detected</span>
            </>
          ) : (
            <>
              <Warning weight="fill" className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600">
                No opt-out language — will be auto-appended
              </span>
            </>
          )}
        </div>

        {/* RESPA check */}
        {respaViolations.length > 0 && (
          <div className="flex items-start gap-2 text-xs">
            <Warning weight="fill" className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <span className="text-red-600 dark:text-red-400">
              RESPA violation: {respaViolations.map((v) => `"${v}"`).join(', ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
