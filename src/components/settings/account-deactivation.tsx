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
  Info,
  SpinnerGap as Loader2,
  CreditCard,
  Database,
  Headset,
} from '@phosphor-icons/react';
import { signOut } from '@/lib/auth/auth-client';
import { deactivateIndividualAccount } from '@/lib/auth/profile-actions';

export function AccountDeactivation() {
  const [showDialog, setShowDialog] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDeactivate = async () => {
    if (confirmation !== 'DEACTIVATE') return;

    setIsDeactivating(true);

    const result = await deactivateIndividualAccount();

    if (result.success) {
      try {
        await signOut();
        toast({
          title: 'Account deactivated',
          description: 'Your account has been deactivated. You can reactivate by contacting support.',
        });
        router.push('/login?reason=deactivated');
      } catch {
        toast({
          title: 'Sign-out failed',
          description: 'Your account was deactivated but sign-out failed. Please close and reopen the browser.',
          variant: 'destructive',
        });
        router.push('/login?reason=deactivated');
      }
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to deactivate account',
        variant: 'destructive',
      });
      setIsDeactivating(false);
      setShowDialog(false);
      setConfirmation('');
    }
  };

  return (
    <Card className="border-amber-300/50 shadow-soft">
      <CardHeader className="bg-gradient-to-r from-amber-50/60 to-transparent dark:from-amber-950/30 dark:to-transparent border-b border-amber-200/30 dark:border-amber-800/30">
        <div className="flex items-center gap-2">
          <Info className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-800 dark:text-amber-200">Deactivate Account</CardTitle>
        </div>
        <CardDescription>
          Temporarily deactivate your account. This action is recoverable.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-800/30 p-3">
            <CreditCard className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Billing stops</p>
              <p className="text-xs text-muted-foreground">
                Your subscription will be cancelled at the end of the current billing period.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-800/30 p-3">
            <Database className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Data saved for 30 days</p>
              <p className="text-xs text-muted-foreground">
                Your surveys, reviews, and testimonials will be preserved for 30 days.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/20 dark:border-amber-800/30 p-3">
            <Headset className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Reactivate anytime</p>
              <p className="text-xs text-muted-foreground">
                Contact support within 30 days to reactivate your account and restore your data.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <Button
            variant="outline"
            className="border-amber-300 text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/30"
            onClick={() => setShowDialog(true)}
          >
            Deactivate Account
          </Button>
        </div>
      </CardContent>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Info className="h-5 w-5" />
              Deactivate Account
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Your account will be deactivated and your subscription cancelled at the end of
                the current billing period. Your data will be saved for 30 days.
              </p>
              <p>
                You can reactivate your account by contacting support within 30 days.
              </p>
              <div className="pt-2">
                <Label htmlFor="deactivateConfirm" className="text-sm font-medium">
                  Type <span className="font-mono text-amber-700 dark:text-amber-300">DEACTIVATE</span> to confirm
                </Label>
                <Input
                  id="deactivateConfirm"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="DEACTIVATE"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmation('')}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              disabled={confirmation !== 'DEACTIVATE' || isDeactivating}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {isDeactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Deactivate Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
