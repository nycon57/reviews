'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import {
  ExternalLink,
  RefreshCw,
  Link as LinkIcon,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
} from 'lucide-react';
import {
  type DirectoryConnection,
  type DirectoryPlatform,
  PLATFORM_INFO,
} from '@/lib/listings/types';
import {
  connectDirectory,
  disconnectDirectory,
  syncDirectory,
} from '@/lib/listings/actions';

interface DirectoryConnectionCardProps {
  connection: DirectoryConnection;
  onUpdate?: (connection: DirectoryConnection) => void;
}

function getPlatformIcon(platform: DirectoryPlatform): React.ReactNode {
  const platformIconClasses = 'h-5 w-5';

  switch (platform) {
    case 'google':
      return (
        <svg viewBox="0 0 24 24" className={platformIconClasses} fill="currentColor">
          <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
        </svg>
      );
    case 'yelp':
      return (
        <svg viewBox="0 0 24 24" className={platformIconClasses} fill="currentColor">
          <path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308c.376-.558 1.304-.448 1.403.21l.863 5.862c.063.432-.35.707-.687.433h-.313zm-8.282-7.358l1.655 5.058c.31.968-.813 1.654-1.582 1.003L7.25 7.456c-.513-.434-.293-1.27.373-1.42l5.133-1.195c.436-.102.842.273.752.714l.37-.32zM12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-.176 21.238c-.152-.003-.303-.01-.454-.02l-.89-4.602c-.16-.828.797-1.387 1.46-.886l3.862 2.848c.305.224.345.65.087.93-1.095 1.183-2.53 1.76-4.065 1.73z" />
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={platformIconClasses} fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    default:
      return <LinkIcon className={platformIconClasses} />;
  }
}

function getSyncStatusIcon(status: DirectoryConnection['syncStatus']) {
  switch (status) {
    case 'synced':
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'syncing':
      return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case 'error':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <LinkIcon className="h-4 w-4 text-gray-400" />;
  }
}

export function DirectoryConnectionCard({ connection, onUpdate }: DirectoryConnectionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [directoryUrl, setDirectoryUrl] = useState(connection.directoryUrl || '');
  const { toast } = useToast();

  const platformInfo = PLATFORM_INFO[connection.platform];

  const handleConnect = () => {
    startTransition(async () => {
      const result = await connectDirectory(connection.id, directoryUrl);
      if (result.success && result.data) {
        onUpdate?.(result.data);
        setIsConnectOpen(false);
        toast({
          title: 'Directory Connected',
          description: `Successfully connected to ${platformInfo.name}`,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: result.error || 'Failed to connect to directory',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDisconnect = () => {
    startTransition(async () => {
      const result = await disconnectDirectory(connection.id);
      if (result.success && result.data) {
        onUpdate?.(result.data);
        toast({
          title: 'Directory Disconnected',
          description: `Disconnected from ${platformInfo.name}`,
        });
      } else {
        toast({
          title: 'Disconnect Failed',
          description: result.error || 'Failed to disconnect from directory',
          variant: 'destructive',
        });
      }
    });
  };

  const handleSync = () => {
    startTransition(async () => {
      const result = await syncDirectory(connection.id);
      if (result.success && result.data) {
        onUpdate?.(result.data);
        toast({
          title: 'Sync Complete',
          description: `Successfully synced with ${platformInfo.name}`,
        });
      } else {
        toast({
          title: 'Sync Failed',
          description: result.error || 'Failed to sync with directory',
          variant: 'destructive',
        });
      }
    });
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-4">
        {/* Platform icon */}
        <div className={`p-2.5 rounded-lg ${platformInfo.color} text-white`}>
          {getPlatformIcon(connection.platform)}
        </div>

        {/* Info */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{platformInfo.name}</span>
            {connection.isConnected && (
              <Badge
                variant={connection.isVerified ? 'default' : 'secondary'}
                className="text-xs"
              >
                {connection.isVerified ? 'Verified' : 'Connected'}
              </Badge>
            )}
            {connection.hasConflicts && (
              <Badge variant="destructive" className="text-xs gap-1">
                <AlertTriangle className="h-3 w-3" />
                Conflicts
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{platformInfo.description}</p>
          {connection.isConnected && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {getSyncStatusIcon(connection.syncStatus)}
                <span className="capitalize">{connection.syncStatus.replace('_', ' ')}</span>
              </div>
              {connection.lastSyncAt && (
                <span>Last sync: {new Date(connection.lastSyncAt).toLocaleDateString()}</span>
              )}
              {connection.napMatchScore > 0 && (
                <span>NAP Match: {connection.napMatchScore}%</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {connection.isConnected ? (
          <>
            {connection.directoryUrl && (
              <Button
                variant="ghost"
                size="sm"
                asChild
              >
                <a
                  href={connection.directoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={isPending || connection.syncStatus === 'syncing'}
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${connection.syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive" disabled={isPending}>
                  <Unlink className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect {platformInfo.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will stop syncing your business information with {platformInfo.name}.
                    Your listing on the platform will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisconnect}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : (
          <>
            {platformInfo.claimUrl && (
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={platformInfo.claimUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Claim
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </Button>
            )}
            <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={isPending}>
                  <LinkIcon className="h-4 w-4 mr-1" />
                  Connect
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect to {platformInfo.name}</DialogTitle>
                  <DialogDescription>
                    Enter the URL of your business listing on {platformInfo.name} to track and sync your information.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="directoryUrl">Listing URL</Label>
                    <Input
                      id="directoryUrl"
                      placeholder={`https://${connection.platform}.com/your-business`}
                      value={directoryUrl}
                      onChange={(e) => setDirectoryUrl(e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll periodically check this listing to ensure your NAP information is consistent.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsConnectOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleConnect} disabled={!directoryUrl || isPending}>
                    {isPending ? 'Connecting...' : 'Connect'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}

// Grid view of all directory connections
interface DirectoryConnectionsGridProps {
  connections: DirectoryConnection[];
  onUpdate?: (connection: DirectoryConnection) => void;
}

export function DirectoryConnectionsGrid({ connections, onUpdate }: DirectoryConnectionsGridProps) {
  // Sort connections: connected first, then by platform name
  const sortedConnections = [...connections].sort((a, b) => {
    if (a.isConnected !== b.isConnected) {
      return a.isConnected ? -1 : 1;
    }
    return PLATFORM_INFO[a.platform].name.localeCompare(PLATFORM_INFO[b.platform].name);
  });

  const connectedCount = connections.filter((c) => c.isConnected).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Directory Connections</CardTitle>
            <CardDescription>
              Manage your business listings across online directories
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {connectedCount} / {connections.length} connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedConnections.map((connection) => (
            <DirectoryConnectionCard
              key={connection.id}
              connection={connection}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
