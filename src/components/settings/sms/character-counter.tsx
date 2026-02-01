'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { calculateSegments } from '@/lib/sms/segment-calculator';
import { Warning } from '@phosphor-icons/react';

interface CharacterCounterProps {
  text: string;
  className?: string;
}

function segmentTextColor(segments: number): string {
  if (segments <= 1) return 'text-repwell-teal-300';
  if (segments <= 2) return 'text-amber-600';
  return 'text-red-600';
}

function segmentBarColor(segments: number): string {
  if (segments <= 1) return 'bg-repwell-teal-300';
  if (segments <= 2) return 'bg-amber-500';
  return 'bg-red-500';
}

export function CharacterCounter({ text, className }: CharacterCounterProps) {
  const info = useMemo(() => calculateSegments(text), [text]);

  const isUcs2 = info.encoding === 'UCS-2';
  const maxSingle = info.singleSegmentLimit;
  const maxMulti = info.multiSegmentLimit;
  const colorClass = segmentTextColor(info.segments);

  const barPercent = Math.min(
    (info.characterCount / (maxMulti * 3)) * 100,
    100
  );

  return (
    <div role="status" aria-live="polite" aria-atomic="true" className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-200', segmentBarColor(info.segments))}
          style={{ width: `${barPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        {/* Character count */}
        <span className={cn('font-medium tabular-nums', colorClass)}>
          {info.characterCount} / {maxSingle} chars
        </span>

        {/* Segment indicator */}
        <div className="flex items-center gap-2">
          {isUcs2 && (
            <span className="inline-flex items-center gap-1 text-amber-600">
              <Warning weight="fill" className="h-3 w-3" />
              UCS-2
            </span>
          )}
          <span className={cn('font-medium tabular-nums', colorClass)}>
            {info.segments} {info.segments === 1 ? 'segment' : 'segments'}
          </span>
        </div>
      </div>

      {/* UCS-2 warning */}
      {isUcs2 && (
        <p className="text-xs text-amber-600">
          Non-GSM characters detected (emoji or special chars). Segment limits
          reduced: {maxSingle} for 1, {maxMulti * 2} for 2, {maxMulti * 3} for 3.
        </p>
      )}
    </div>
  );
}
