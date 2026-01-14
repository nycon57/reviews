'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  getSocialConnections,
  initiateSocialOAuth,
  disconnectSocial,
  updateAutoPublishSettings,
} from '@/lib/social/actions';
import type { SocialPlatform } from '@/lib/social/types';

interface Connection {
  id: string;
  platform: SocialPlatform;
  platformUsername: string | null;
  platformDisplayName: string | null;
  platformAvatarUrl: string | null;
  pageName: string | null;
  isActive: boolean;
  autoPublishEnabled: boolean;
  autoPublishMinRating: number;
  postsCount: number;
  lastPostAt: string | null;
}

const PLATFORM_INFO: Record<
  SocialPlatform,
  { name: string; description: string; color: string }
> = {
  facebook: {
    name: 'Facebook',
    description: 'Share reviews on your Facebook Page',
    color: 'bg-blue-600',
  },
  twitter: {
    name: 'Twitter / X',
    description: 'Post reviews to your Twitter timeline',
    color: 'bg-black',
  },
  linkedin: {
    name: 'LinkedIn',
    description: 'Share professional testimonials on LinkedIn',
    color: 'bg-blue-700',
  },
  instagram: {
    name: 'Instagram',
    description: 'Create visual testimonial posts',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
};

function PlatformIcon({ platform, className = 'h-5 w-5' }: { platform: SocialPlatform; className?: string }) {
  switch (platform) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="currentColor">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.757-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
        </svg>
      );
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
}

export function SocialIntegrationCard() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle OAuth callback results
  useEffect(() => {
    const socialSuccess = searchParams.get('social_success');
    const socialError = searchParams.get('social_error');
    const platform = searchParams.get('platform');

    if (socialSuccess) {
      toast({
        title: `${PLATFORM_INFO[platform as SocialPlatform]?.name || 'Social'} Connected`,
        description: 'Your social account has been connected successfully.',
      });
      router.replace('/dashboard/settings');
    }

    if (socialError) {
      toast({
        title: 'Connection Failed',
        description: decodeURIComponent(socialError),
        variant: 'destructive',
      });
      router.replace('/dashboard/settings');
    }
  }, [searchParams, toast, router]);

  // Fetch connections
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const result = await getSocialConnections();

        if (result.success && result.data) {
          setConnections(
            result.data
              .filter((c) => c.isActive)
              .map((c) => ({
                id: c.id,
                platform: c.platform,
                platformUsername: c.platformUsername,
                platformDisplayName: c.platformDisplayName,
                platformAvatarUrl: c.platformAvatarUrl,
                pageName: c.pageName,
                isActive: c.isActive,
                autoPublishEnabled: c.autoPublishEnabled,
                autoPublishMinRating: c.autoPublishMinRating,
                postsCount: c.postsCount,
                lastPostAt: c.lastPostAt,
              }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch social connections:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleConnect = (platform: SocialPlatform) => {
    startTransition(async () => {
      const result = await initiateSocialOAuth(platform);
      if (result.success && result.data?.url) {
        window.location.href = result.data.url;
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to start OAuth flow',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDisconnect = async (connectionId: string) => {
    startTransition(async () => {
      const result = await disconnectSocial(connectionId);
      if (result.success) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
        toast({
          title: 'Disconnected',
          description: 'Social account has been disconnected.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to disconnect',
          variant: 'destructive',
        });
      }
    });
  };

  const handleAutoPublishToggle = async (connectionId: string, enabled: boolean, minRating: number) => {
    startTransition(async () => {
      const result = await updateAutoPublishSettings(connectionId, enabled, minRating);
      if (result.success) {
        setConnections((prev) =>
          prev.map((c) =>
            c.id === connectionId
              ? { ...c, autoPublishEnabled: enabled }
              : c
          )
        );
        toast({
          title: 'Settings Updated',
          description: enabled
            ? 'Auto-publish enabled for this account.'
            : 'Auto-publish disabled.',
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update settings',
          variant: 'destructive',
        });
      }
    });
  };

  const handleMinRatingChange = async (connectionId: string, minRating: number) => {
    const connection = connections.find((c) => c.id === connectionId);
    if (!connection) return;

    startTransition(async () => {
      const result = await updateAutoPublishSettings(
        connectionId,
        connection.autoPublishEnabled,
        minRating
      );
      if (result.success) {
        setConnections((prev) =>
          prev.map((c) =>
            c.id === connectionId
              ? { ...c, autoPublishMinRating: minRating }
              : c
          )
        );
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update settings',
          variant: 'destructive',
        });
      }
    });
  };

  const connectedPlatforms = new Set(connections.map((c) => c.platform));
  const availablePlatforms = (['facebook', 'twitter', 'linkedin'] as SocialPlatform[]).filter(
    (p) => !connectedPlatforms.has(p)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 4v16h16V4H4zm0 0l16 16M20 4L4 20" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <CardTitle>Social Media</CardTitle>
        </div>
        <CardDescription>
          Connect your social media accounts to automatically share approved reviews
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Connected accounts */}
            {connections.length > 0 && (
              <div className="space-y-4">
                <Label>Connected Accounts</Label>
                {connections.map((connection) => (
                  <div
                    key={connection.id}
                    className="rounded-lg border p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${PLATFORM_INFO[connection.platform].color} text-white`}>
                          <PlatformIcon platform={connection.platform} className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {PLATFORM_INFO[connection.platform].name}
                            </span>
                            {connection.autoPublishEnabled && (
                              <Badge variant="secondary">Auto-publish</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {connection.pageName ||
                              connection.platformDisplayName ||
                              connection.platformUsername ||
                              'Connected'}
                          </p>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            disabled={isPending}
                          >
                            Disconnect
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Disconnect {PLATFORM_INFO[connection.platform].name}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This will stop auto-publishing to this account.
                              Existing posts will not be deleted from the platform.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDisconnect(connection.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Disconnect
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* Auto-publish settings */}
                    <div className="flex flex-col sm:flex-row gap-4 pt-2 border-t">
                      <div className="flex items-center justify-between gap-4 flex-1">
                        <div className="space-y-0.5">
                          <Label htmlFor={`auto-publish-${connection.id}`}>
                            Auto-publish reviews
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Automatically share approved reviews
                          </p>
                        </div>
                        <Switch
                          id={`auto-publish-${connection.id}`}
                          checked={connection.autoPublishEnabled}
                          onCheckedChange={(checked) =>
                            handleAutoPublishToggle(
                              connection.id,
                              checked,
                              connection.autoPublishMinRating
                            )
                          }
                          disabled={isPending}
                        />
                      </div>
                      {connection.autoPublishEnabled && (
                        <div className="space-y-1">
                          <Label htmlFor={`min-rating-${connection.id}`}>
                            Minimum rating
                          </Label>
                          <Select
                            value={connection.autoPublishMinRating.toString()}
                            onValueChange={(value) =>
                              handleMinRatingChange(connection.id, parseInt(value))
                            }
                            disabled={isPending}
                          >
                            <SelectTrigger
                              id={`min-rating-${connection.id}`}
                              className="w-24"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5 stars</SelectItem>
                              <SelectItem value="4">4+ stars</SelectItem>
                              <SelectItem value="3">3+ stars</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
                      <span>{connection.postsCount} posts</span>
                      <span>Last post: {formatDate(connection.lastPostAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Connect new accounts */}
            {availablePlatforms.length > 0 && (
              <div className="space-y-4 rounded-lg border border-dashed p-4">
                <div className="space-y-2">
                  <Label>Connect a Social Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Add your social media accounts to share reviews automatically
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availablePlatforms.map((platform) => (
                    <Button
                      key={platform}
                      variant="outline"
                      onClick={() => handleConnect(platform)}
                      disabled={isPending}
                      className="gap-2"
                    >
                      <PlatformIcon platform={platform} className="h-4 w-4" />
                      {PLATFORM_INFO[platform].name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {connections.length === 0 && availablePlatforms.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                All available social platforms are connected.
              </p>
            )}

            {/* Info */}
            <p className="text-xs text-muted-foreground">
              When auto-publish is enabled, approved reviews meeting your rating
              threshold will be automatically shared to connected accounts. You can
              also manually create and schedule posts from the Reviews page.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
