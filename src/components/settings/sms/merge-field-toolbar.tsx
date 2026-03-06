'use client';

import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SUPPORTED_MERGE_FIELDS } from '@/lib/sms/templates/merge-engine';
import { cn } from '@/lib/utils';

const MERGE_FIELD_LABELS: Record<string, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  lo_name: 'LO Name',
  lo_first_name: 'LO First',
  company_name: 'Company',
  review_link: 'Review Link',
  video_link: 'Video Link',
  branch_name: 'Branch',
  closing_date: 'Closing Date',
};

interface MergeFieldToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (field: string) => void;
  className?: string;
}

export function MergeFieldToolbar({
  textareaRef,
  onInsert,
  className,
}: MergeFieldToolbarProps) {
  const insertField = useCallback(
    (fieldName: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const tag = `{{${fieldName}}}`;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      const newValue = value.slice(0, start) + tag + value.slice(end);
      onInsert(newValue);

      // Restore cursor position after the inserted tag
      requestAnimationFrame(() => {
        textarea.focus();
        const newCursorPos = start + tag.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [textareaRef, onInsert]
  );

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      <span className="text-xs font-medium text-muted-foreground self-center mr-1">
        Merge fields:
      </span>
      <TooltipProvider delayDuration={300}>
        {SUPPORTED_MERGE_FIELDS.map((field) => (
          <Tooltip key={field}>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs font-mono border-dashed hover:border-repwell-teal-300 hover:text-repwell-teal-400 dark:hover:text-muted-foreground"
                onClick={() => insertField(field)}
              >
                {`{{${MERGE_FIELD_LABELS[field] ?? field}}}`}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Insert {`{{${field}}}`}
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  );
}
