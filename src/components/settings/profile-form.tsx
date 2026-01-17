'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Loader2 } from 'lucide-react';
import { updateProfile, uploadAvatar } from '@/lib/auth/profile-actions';
import { AvatarUpload } from '@/components/shared/avatar-upload';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialName?: string;
  initialEmail?: string;
  initialAvatarUrl?: string | null;
}

export function ProfileForm({ initialName, initialEmail, initialAvatarUrl }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: initialName || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);

    const result = await updateProfile({
      fullName: data.fullName,
      avatarUrl: avatarUrl || undefined,
    });

    if (result.success) {
      setAvatarChanged(false);
      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully.',
      });
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update profile',
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  const handleAvatarUpload = async (file: File): Promise<{ success: boolean; url?: string; error?: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const result = await uploadAvatar(formData);

    if (result.success && result.url) {
      setAvatarUrl(result.url);
      setAvatarChanged(true);
      toast({
        title: 'Avatar updated',
        description: 'Your profile photo has been updated.',
      });
      return { success: true, url: result.url };
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to upload avatar',
        variant: 'destructive',
      });
      return { success: false, error: result.error || 'Failed to upload avatar' };
    }
  };

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-repwell-teal-400" />
          <CardTitle>Profile Information</CardTitle>
        </div>
        <CardDescription>
          Update your personal information and profile photo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-start gap-6">
            <AvatarUpload
              currentAvatarUrl={avatarUrl}
              onUpload={handleAvatarUpload}
              fallbackInitials={initialName?.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
            />
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="Enter your full name"
                  {...register('fullName')}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={initialEmail || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed here. Contact support if needed.
                </p>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || (!isDirty && !avatarChanged)}
            className="w-full sm:w-auto"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
