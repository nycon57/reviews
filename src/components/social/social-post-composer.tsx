'use client';

import { useState, useEffect, useTransition, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  getSocialConnections,
  getSocialPostTemplates,
  generatePostPreview,
  createSocialPost,
  publishSocialPost,
} from '@/lib/social/actions';
import { PLATFORM_LIMITS } from '@/lib/social/types';
import type { SocialPlatform, SocialPostTemplate } from '@/lib/social/types';

interface Connection {
  id: string;
  platform: SocialPlatform;
  platformDisplayName: string | null;
  pageName: string | null;
  isActive: boolean;
}

interface SocialPostComposerProps {
  reviewId: string;
  reviewRating: number;
  reviewText: string | null;
  customerName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PLATFORM_INFO: Record<SocialPlatform, { name: string; icon: ReactNode }> = {
  facebook: {
    name: 'Facebook',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  twitter: {
    name: 'Twitter / X',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  linkedin: {
    name: 'LinkedIn',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  instagram: {
    name: 'Instagram',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
      </svg>
    ),
  },
};

export function SocialPostComposer({
  reviewId,
  reviewRating,
  reviewText: _reviewText,
  customerName,
  open,
  onOpenChange,
  onSuccess,
}: SocialPostComposerProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [templates, setTemplates] = useState<SocialPostTemplate[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [content, setContent] = useState('');
  const [useSchedule, setUseSchedule] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const selectedConnection = connections.find((c) => c.id === selectedConnectionId);
  const platform = selectedConnection?.platform;
  const maxLength = platform ? PLATFORM_LIMITS[platform] : undefined;
  const characterCount = content.length;
  const isOverLimit = maxLength ? characterCount > maxLength : false;

  // Load connections and templates
  useEffect(() => {
    if (!open) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const [connectionsResult, templatesResult] = await Promise.all([
          getSocialConnections(),
          getSocialPostTemplates(),
        ]);

        if (connectionsResult.success && connectionsResult.data) {
          const activeConnections = connectionsResult.data
            .filter((c) => c.isActive)
            .map((c) => ({
              id: c.id,
              platform: c.platform,
              platformDisplayName: c.platformDisplayName,
              pageName: c.pageName,
              isActive: c.isActive,
            }));
          setConnections(activeConnections);

          if (activeConnections.length > 0 && !selectedConnectionId) {
            setSelectedConnectionId(activeConnections[0].id);
          }
        }

        if (templatesResult.success && templatesResult.data) {
          setTemplates(templatesResult.data);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [open, selectedConnectionId]);

  // Load preview when template or connection changes
  useEffect(() => {
    if (!selectedTemplateId || !reviewId) return;

    async function loadPreview() {
      const result = await generatePostPreview(reviewId, selectedTemplateId);
      if (result.success && result.data) {
        setContent(result.data.content);
      }
    }

    loadPreview();
  }, [selectedTemplateId, reviewId]);

  // Filter templates by selected platform
  const filteredTemplates = platform
    ? templates.filter((t) => t.platform === platform)
    : [];

  // Auto-select default template when platform changes
  useEffect(() => {
    if (filteredTemplates.length > 0) {
      const defaultTemplate = filteredTemplates.find((t) => t.isDefault);
      if (defaultTemplate) {
        setSelectedTemplateId(defaultTemplate.id);
      } else if (!selectedTemplateId || !filteredTemplates.find((t) => t.id === selectedTemplateId)) {
        setSelectedTemplateId(filteredTemplates[0].id);
      }
    }
  }, [platform, filteredTemplates, selectedTemplateId]);

  const handlePublish = () => {
    if (!selectedConnectionId || !content) return;

    startTransition(async () => {
      let scheduledFor: string | undefined;
      if (useSchedule && scheduledDate && scheduledTime) {
        scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      const createResult = await createSocialPost({
        connectionId: selectedConnectionId,
        reviewId,
        templateId: selectedTemplateId || undefined,
        content,
        scheduledFor,
      });

      if (!createResult.success) {
        toast({
          title: 'Error',
          description: createResult.error || 'Failed to create post',
          variant: 'destructive',
        });
        return;
      }

      if (useSchedule) {
        toast({
          title: 'Post Scheduled',
          description: `Your post will be published at the scheduled time.`,
        });
        onOpenChange(false);
        onSuccess?.();
        return;
      }

      // Publish immediately
      const publishResult = await publishSocialPost(createResult.data!.id);

      if (publishResult.success) {
        toast({
          title: 'Published!',
          description: `Your post has been published to ${PLATFORM_INFO[platform!].name}.`,
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: 'Publishing Failed',
          description: publishResult.error || 'Failed to publish post',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSaveDraft = () => {
    if (!selectedConnectionId || !content) return;

    startTransition(async () => {
      const result = await createSocialPost({
        connectionId: selectedConnectionId,
        reviewId,
        templateId: selectedTemplateId || undefined,
        content,
      });

      if (result.success) {
        toast({
          title: 'Draft Saved',
          description: 'Your post has been saved as a draft.',
        });
        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save draft',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share to Social Media</DialogTitle>
          <DialogDescription>
            Create a social media post from this {reviewRating}-star review
            {customerName ? ` by ${customerName}` : ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : connections.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">
              No social media accounts connected.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                window.location.href = '/dashboard/settings';
              }}
            >
              Connect Accounts
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Platform Selection */}
            <div className="space-y-2">
              <Label>Post to</Label>
              <Tabs
                value={selectedConnectionId}
                onValueChange={setSelectedConnectionId}
              >
                <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${connections.length}, 1fr)` }}>
                  {connections.map((conn) => (
                    <TabsTrigger
                      key={conn.id}
                      value={conn.id}
                      className="flex items-center gap-2"
                    >
                      {PLATFORM_INFO[conn.platform].icon}
                      <span className="hidden sm:inline">
                        {PLATFORM_INFO[conn.platform].name}
                      </span>
                    </TabsTrigger>
                  ))}
                </TabsList>
                {connections.map((conn) => (
                  <TabsContent key={conn.id} value={conn.id} className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Posting to: {conn.pageName || conn.platformDisplayName || PLATFORM_INFO[conn.platform].name}
                    </p>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Template Selection */}
            {filteredTemplates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select
                  value={selectedTemplateId}
                  onValueChange={setSelectedTemplateId}
                >
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                        {template.isDefault && ' (Default)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Content Editor */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="content">Post Content</Label>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs ${
                      isOverLimit ? 'text-destructive font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    {characterCount}
                    {maxLength && ` / ${maxLength}`}
                  </span>
                  {isOverLimit && (
                    <Badge variant="destructive" className="text-xs">
                      Over limit
                    </Badge>
                  )}
                </div>
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content..."
                className="min-h-[150px] resize-y"
              />
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 rounded-full bg-primary/10 p-2">
                    {platform && PLATFORM_INFO[platform].icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">Your Page Name</p>
                    <p className="text-xs text-muted-foreground">Just now</p>
                    <p className="mt-2 text-sm whitespace-pre-wrap break-words">
                      {content || 'Your post will appear here...'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Option */}
            <div className="space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="schedule-toggle">Schedule for later</Label>
                  <p className="text-xs text-muted-foreground">
                    Choose when to publish this post
                  </p>
                </div>
                <Switch
                  id="schedule-toggle"
                  checked={useSchedule}
                  onCheckedChange={setUseSchedule}
                />
              </div>

              {useSchedule && (
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="schedule-date">Date</Label>
                    <Input
                      id="schedule-date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="schedule-time">Time</Label>
                    <Input
                      id="schedule-time"
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {connections.length > 0 && (
            <>
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
                disabled={isPending || !content || isOverLimit}
              >
                Save Draft
              </Button>
              <Button
                onClick={handlePublish}
                disabled={
                  isPending ||
                  !content ||
                  isOverLimit ||
                  (useSchedule && (!scheduledDate || !scheduledTime))
                }
              >
                {isPending
                  ? 'Processing...'
                  : useSchedule
                  ? 'Schedule Post'
                  : 'Publish Now'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
