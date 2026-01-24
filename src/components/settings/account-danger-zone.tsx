'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Warning as AlertTriangle,
  SignOut as LogOut,
  Trash as Trash2,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { createClient } from '@/lib/supabase/client';
import { deleteAccount } from '@/lib/auth/profile-actions';

export function AccountDangerZone() {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOutAllDevices = async () => {
    setIsSigningOut(true);

    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: 'global' });

      toast({
        title: 'Signed out',
        description: 'You have been signed out from all devices.',
      });

      router.push('/login');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to sign out from all devices',
        variant: 'destructive',
      });
    }

    setIsSigningOut(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;

    setIsDeleting(true);

    const result = await deleteAccount();

    if (result.success) {
      toast({
        title: 'Account deleted',
        description: 'Your account has been deactivated.',
      });
      router.push('/');
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to delete account',
        variant: 'destructive',
      });
    }

    setIsDeleting(false);
    setShowDeleteDialog(false);
    setDeleteConfirmation('');
  };

  return (
    <Card className="border-destructive/50 shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </div>
        <CardDescription>
          Irreversible and destructive actions for your account
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sign out all devices */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <h4 className="text-sm font-medium">Sign out all devices</h4>
            <p className="text-xs text-muted-foreground">
              Sign out from all devices where you are currently logged in
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSignOutAllDevices}
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign Out All
          </Button>
        </div>

        {/* Delete account */}
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div>
            <h4 className="text-sm font-medium text-destructive">Delete account</h4>
            <p className="text-xs text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Account
          </Button>
        </div>
      </CardContent>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                This action cannot be undone. This will permanently deactivate your
                account and remove access to all your data.
              </p>
              <p>
                All your surveys, reviews, testimonials, and settings will be
                inaccessible.
              </p>
              <div className="pt-2">
                <Label htmlFor="deleteConfirm" className="text-sm font-medium">
                  Type <span className="font-mono text-destructive">DELETE</span> to
                  confirm
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder="DELETE"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmation !== 'DELETE' || isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
