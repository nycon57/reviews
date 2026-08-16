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
  getGoogleConnections,
  disconnectGoogle,
  syncGoogleReviews,
  getProfessionalsForGoogle,
} from '@/lib/google/actions';
import type { GoogleConnection } from '@/lib/google/types';

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString();
}

function StatusBadge({ status }: { status: GoogleConnection['syncStatus'] }) {
  const variants: Record<
    GoogleConnection['syncStatus'],
    'default' | 'secondary' | 'outline' | 'destructive'
  > = {
    pending: 'secondary',
    syncing: 'default',
    completed: 'outline',
    failed: 'destructive',
  };

  return (
    <Badge variant={variants[status]}>
      {status === 'syncing' ? 'Syncing...' : status}
    </Badge>
  );
}

export function GoogleIntegrationCard() {
  const [connections, setConnections] = useState<GoogleConnection[]>([]);
  const [professionals, setProfessionals] = useState<
    { id: string; fullName: string }[]
  >([]);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('__all__');
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle OAuth callback results
  useEffect(() => {
    const googleSuccess = searchParams.get('google_success');
    const googleError = searchParams.get('google_error');

    if (googleSuccess) {
      toast({
        title: 'Google Connected',
        description: 'Your Google Business Profile has been connected successfully.',
      });
      // Clear the URL params
      router.replace('/dashboard/organization?tab=integrations');
    }

    if (googleError) {
      toast({
        title: 'Connection Failed',
        description: decodeURIComponent(googleError),
        variant: 'destructive',
      });
      router.replace('/dashboard/organization?tab=integrations');
    }
  }, [searchParams, toast, router]);

  // Fetch connections and professionals
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [connectionsResult, professionalsResult] = await Promise.all([
          getGoogleConnections(),
          getProfessionalsForGoogle(),
        ]);

        if (connectionsResult.success && connectionsResult.data) {
          setConnections(connectionsResult.data);
        }

        if (professionalsResult.success && professionalsResult.data) {
          setProfessionals(professionalsResult.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleConnect = () => {
    // Redirect to OAuth flow
    const url = selectedProfessional && selectedProfessional !== '__all__'
      ? `/api/auth/google/connect?user_id=${selectedProfessional}`
      : '/api/auth/google/connect';
    window.location.href = url;
  };

  const handleDisconnect = async (connectionId: string) => {
    startTransition(async () => {
      const result = await disconnectGoogle(connectionId);
      if (result.success) {
        setConnections((prev) => prev.filter((c) => c.id !== connectionId));
        toast({
          title: 'Disconnected',
          description: 'Google Business Profile has been disconnected.',
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

  const handleSync = async (connectionId: string) => {
    startTransition(async () => {
      toast({
        title: 'Syncing...',
        description: 'Fetching latest reviews from Google.',
      });

      const result = await syncGoogleReviews(connectionId, 'manual');

      if (result.success && result.data) {
        toast({
          title: 'Sync Complete',
          description: `Fetched ${result.data.reviewsFetched} reviews (${result.data.reviewsCreated} new, ${result.data.reviewsUpdated} updated)`,
        });

        // Refresh connections
        const connectionsResult = await getGoogleConnections();
        if (connectionsResult.success && connectionsResult.data) {
          setConnections(connectionsResult.data);
        }
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Failed to sync reviews',
          variant: 'destructive',
        });
      }
    });
  };

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
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.12.03-1.99 1.27-5.62 3.72-.53.36-1.01.54-1.44.53-.47-.01-1.38-.27-2.06-.49-.83-.27-1.49-.42-1.43-.89.03-.24.36-.49 1-.73 3.91-1.7 6.51-2.82 7.81-3.37 3.72-1.57 4.49-1.84 4.99-1.85.11 0 .36.03.52.17.13.12.17.28.18.44-.01.13-.02.3-.04.44z" />
          </svg>
          <CardTitle>Google Business Profile</CardTitle>
        </div>
        <CardDescription>
          Connect your Google Business Profile to sync reviews automatically
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* Existing connections */}
            {connections.filter((c) => c.isActive).length > 0 && (
              <div className="space-y-4">
                <Label>Connected Accounts</Label>
                {connections
                  .filter((c) => c.isActive)
                  .map((connection) => (
                    <div
                      key={connection.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {connection.locationName || connection.locationId}
                          </span>
                          <StatusBadge status={connection.syncStatus} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {connection.googleAccountEmail}
                        </p>
                        {connection.locationAddress && (
                          <p className="text-sm text-muted-foreground">
                            {connection.locationAddress}
                          </p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{connection.reviewsCount} reviews</span>
                          <span>
                            {connection.averageRating.toFixed(1)} avg rating
                          </span>
                          <span>Last sync: {formatDate(connection.lastSyncAt)}</span>
                        </div>
                        {connection.syncError && (
                          <p className="text-sm text-destructive">
                            Error: {connection.syncError}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSync(connection.id)}
                          disabled={
                            isPending || connection.syncStatus === 'syncing'
                          }
                        >
                          {connection.syncStatus === 'syncing'
                            ? 'Syncing...'
                            : 'Sync Now'}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive"
                            >
                              Disconnect
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Disconnect Google Business Profile?
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                This will stop syncing reviews from this location.
                                Existing reviews will not be deleted.
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
                    </div>
                  ))}
              </div>
            )}

            {/* Connect new account */}
            <div className="space-y-4 rounded-lg border border-dashed p-4">
              <div className="space-y-2">
                <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Connect Google Business Profile
                </div>
                <p className="text-sm text-muted-foreground">
                  Optionally assign to a specific team member
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="pro-select">Team Member (optional)</Label>
                  <Select
                    value={selectedProfessional}
                    onValueChange={setSelectedProfessional}
                  >
                    <SelectTrigger id="pro-select">
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">Organization-wide</SelectItem>
                      {professionals.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleConnect} disabled={isPending}>
                  <svg
                    viewBox="0 0 24 24"
                    className="mr-2 h-4 w-4"
                    fill="currentColor"
                  >
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Connect Google
                </Button>
              </div>
            </div>

            {/* Info about sync */}
            <p className="text-xs text-muted-foreground">
              Reviews are synced automatically every 24 hours. You can also trigger
              a manual sync anytime. Google reviews appear in your unified review
              feed with source marked as &quot;Google&quot;.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
