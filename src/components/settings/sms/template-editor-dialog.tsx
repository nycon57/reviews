'use client';

import { useState, useRef, useCallback, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createSmsTemplate, updateSmsTemplate } from '@/lib/sms/templates/actions';
import type { SmsTemplate, SmsTemplateCategory } from '@/lib/sms/types';
import { MergeFieldToolbar } from './merge-field-toolbar';
import { CharacterCounter } from './character-counter';
import { TemplatePreview } from './template-preview';
import { SpinnerGap } from '@phosphor-icons/react';

const CATEGORY_OPTIONS: { value: SmsTemplateCategory; label: string }[] = [
  { value: 'review_request', label: 'Review Request' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'thank_you', label: 'Thank You' },
  { value: 'video_request', label: 'Video Request' },
  { value: 'custom', label: 'Custom' },
];

interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: SmsTemplate | null;
  onSaved: () => void;
}

export function TemplateEditorDialog({
  open,
  onOpenChange,
  template,
  onSaved,
}: TemplateEditorDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isEditing = !!template;
  const isReadOnly = template?.is_locked ?? false;

  const [name, setName] = useState(template?.name ?? '');
  const [category, setCategory] = useState<SmsTemplateCategory>(
    template?.category ?? 'review_request'
  );
  const [body, setBody] = useState(template?.body ?? '');

  // Reset form when dialog opens with a (possibly different) template
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setName(template?.name ?? '');
        setCategory(template?.category ?? 'review_request');
        setBody(template?.body ?? '');
      }
      onOpenChange(nextOpen);
    },
    [template, onOpenChange]
  );

  const handleMergeFieldInsert = useCallback((newValue: string) => {
    setBody(newValue);
  }, []);

  const handleSave = useCallback(() => {
    if (!name.trim()) {
      toast({ title: 'Validation error', description: 'Template name is required.', variant: 'destructive' });
      return;
    }
    if (!body.trim()) {
      toast({ title: 'Validation error', description: 'Template body is required.', variant: 'destructive' });
      return;
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateSmsTemplate({ id: template.id, name, category, body })
        : await createSmsTemplate({ name, category, body });

      if (result.success) {
        toast({
          title: isEditing ? 'Template updated' : 'Template created',
          description: `"${name}" has been ${isEditing ? 'updated' : 'created'}.`,
        });
        onSaved();
        onOpenChange(false);
      } else {
        toast({
          title: 'Error',
          description: result.error ?? 'Failed to save template.',
          variant: 'destructive',
        });
      }
    });
  }, [name, category, body, isEditing, template, toast, onSaved, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-repwell-teal-500">
            {isReadOnly
              ? 'View Template'
              : isEditing
                ? 'Edit Template'
                : 'Create Template'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left column: Editor */}
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="template-name">Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Review Request v2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isReadOnly}
                maxLength={100}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label htmlFor="template-category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as SmsTemplateCategory)}
                disabled={isReadOnly}
              >
                <SelectTrigger id="template-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Merge field toolbar */}
            {!isReadOnly && (
              <MergeFieldToolbar
                textareaRef={textareaRef}
                onInsert={handleMergeFieldInsert}
              />
            )}

            {/* Body */}
            <div className="space-y-1.5">
              <Label htmlFor="template-body">Message Body</Label>
              <Textarea
                ref={textareaRef}
                id="template-body"
                placeholder="Hi {{first_name}}, thanks for working with {{lo_name}}..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={isReadOnly}
                rows={6}
                maxLength={480}
                className="font-mono text-sm resize-none"
              />
              <CharacterCounter text={body} />
            </div>
          </div>

          {/* Right column: Preview */}
          <div className="space-y-2">
            <Label>Live Preview</Label>
            <TemplatePreview body={body} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isReadOnly ? 'Close' : 'Cancel'}
          </Button>
          {!isReadOnly && (
            <Button
              onClick={handleSave}
              disabled={isPending || !name.trim() || !body.trim()}
              className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
            >
              {isPending && (
                <SpinnerGap className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? 'Save Changes' : 'Create Template'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
