'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { calculateSegments } from '@/lib/sms/segment-calculator';
import { Warning } from '@phosphor-icons/react';

interface CharacterCounterProps {
  text: string;
  className?: string;
}

export function CharacterCounter({ text, className }: CharacterCounterProps) {
  const info = useMemo(() => calculateSegments(text), [text]);

  const isUcs2 = info.encoding === 'UCS-2';
  const maxSingle = info.singleSegmentLimit;
  const maxMulti = info.multiSegmentLimit;

  // Determine segment boundary thresholds for color coding
  const segmentColor =
    info.segments <= 1
      ? 'text-repwell-teal-300'
      : info.segments <= 2
        ? 'text-amber-600'
        : 'text-red-600';

  const barPercent = Math.min(
    (info.characterCount / (maxMulti * 3)) * 100,
    100
  );

  const barColor =
    info.segments <= 1
      ? 'bg-repwell-teal-300'
      : info.segments <= 2
        ? 'bg-amber-500'
        : 'bg-red-500';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-200', barColor)}
          style={{ width: `${barPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        {/* Character count */}
        <span className={cn('font-medium tabular-nums', segmentColor)}>
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
          <span className={cn('font-medium tabular-nums', segmentColor)}>
            {info.segments} {info.segments === 1 ? 'segment' : 'segments'}
          </span>
        </div>
      </div>

      {/* UCS-2 warning */}
      {isUcs2 && (
        <p className="text-xs text-amber-600">
          Non-GSM characters detected (emoji or special chars). Limits reduced
          to {maxSingle}/{maxMulti * 2}/{maxMulti * 3} per 1/2/3 segments.
        </p>
      )}
    </div>
  );
}
