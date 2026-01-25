'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  User,
  SpinnerGap as Loader2,
  Briefcase,
  Phone,
  Globe,
  LinkedinLogo as Linkedin,
  Clock,
  FileText,
  BuildingOffice as Building2,
  IdentificationBadge,
} from "@phosphor-icons/react";
import { updateProfile, uploadAvatar } from '@/lib/auth/profile-actions';
import { AvatarUpload } from '@/components/shared/avatar-upload';
import { updateProfileSchema } from '@/lib/auth/profile-schemas';

type ProfileFormData = z.infer<typeof updateProfileSchema>;

// Common timezones for US mortgage professionals
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
];

interface ProfileFormProps {
  initialName?: string;
  initialEmail?: string;
  initialAvatarUrl?: string | null;
  initialTitle?: string | null;
  initialNmlsId?: string | null;
  initialBio?: string | null;
  initialPhone?: string | null;
  initialPersonalWebsiteUrl?: string | null;
  initialLinkedinUrl?: string | null;
  initialZillowProfileUrl?: string | null;
  initialTimezone?: string | null;
}

export function ProfileForm({
  initialName,
  initialEmail,
  initialAvatarUrl,
  initialTitle,
  initialNmlsId,
  initialBio,
  initialPhone,
  initialPersonalWebsiteUrl,
  initialLinkedinUrl,
  initialZillowProfileUrl,
  initialTimezone,
}: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialAvatarUrl ?? null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: initialName || '',
      title: initialTitle || '',
      nmlsId: initialNmlsId || '',
      bio: initialBio || '',
      phone: initialPhone || '',
      personalWebsiteUrl: initialPersonalWebsiteUrl || '',
      linkedinUrl: initialLinkedinUrl || '',
      zillowProfileUrl: initialZillowProfileUrl || '',
      timezone: initialTimezone || '',
    },
  });

  const bioValue = watch('bio') || '';
  const timezoneValue = watch('timezone');

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);

    const result = await updateProfile({
      ...data,
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
    <Card className="border border-border shadow-soft overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <User className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <CardTitle className="text-lg">Profile Information</CardTitle>
            <CardDescription>
              Manage your personal and professional details
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Section 1: Photo & Basic Info */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-start gap-6">
              <AvatarUpload
                currentAvatarUrl={avatarUrl}
                onUpload={handleAvatarUpload}
                onRemove={() => {
                  setAvatarUrl(null);
                  setAvatarChanged(true);
                }}
                fallbackInitials={initialName?.trim().split(/\s+/).filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'}
              />
              <div className="flex-1 grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name
                  </Label>
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
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={initialEmail || ''}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Contact support to change your email
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Professional Details */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="h-4 w-4 text-repwell-teal-300" />
              <h3 className="text-sm font-semibold text-repwell-teal-500 uppercase tracking-wide">
                Professional Details
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Job Title
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Senior Professional"
                  {...register('title')}
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nmlsId" className="text-sm font-medium flex items-center gap-2">
                  <IdentificationBadge className="h-3.5 w-3.5 text-muted-foreground" />
                  License Number
                </Label>
                <Input
                  id="nmlsId"
                  placeholder="e.g., 123456"
                  {...register('nmlsId')}
                />
                {errors.nmlsId && (
                  <p className="text-xs text-destructive">{errors.nmlsId.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Your professional license or NMLS ID
                </p>
              </div>

              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bio" className="text-sm font-medium">
                    Professional Bio
                  </Label>
                  <span className="text-xs text-muted-foreground">
                    {bioValue.length}/500
                  </span>
                </div>
                <Textarea
                  id="bio"
                  placeholder="Tell clients about your experience and expertise..."
                  className="min-h-[100px] resize-none"
                  {...register('bio')}
                />
                {errors.bio && (
                  <p className="text-xs text-destructive">{errors.bio.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  This appears on your public profile and review request pages
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Contact & Social */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-4 w-4 text-repwell-teal-300" />
              <h3 className="text-sm font-semibold text-repwell-teal-500 uppercase tracking-wide">
                Contact & Social
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  {...register('phone')}
                />
                {errors.phone && (
                  <p className="text-xs text-destructive">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="personalWebsiteUrl" className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  Personal Website
                </Label>
                <Input
                  id="personalWebsiteUrl"
                  type="url"
                  placeholder="https://yoursite.com"
                  {...register('personalWebsiteUrl')}
                />
                {errors.personalWebsiteUrl && (
                  <p className="text-xs text-destructive">{errors.personalWebsiteUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedinUrl" className="text-sm font-medium flex items-center gap-2">
                  <Linkedin className="h-3.5 w-3.5 text-muted-foreground" />
                  LinkedIn Profile
                </Label>
                <Input
                  id="linkedinUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  {...register('linkedinUrl')}
                />
                {errors.linkedinUrl && (
                  <p className="text-xs text-destructive">{errors.linkedinUrl.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="zillowProfileUrl" className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  Zillow Profile
                </Label>
                <Input
                  id="zillowProfileUrl"
                  type="url"
                  placeholder="https://zillow.com/lender-profile/..."
                  {...register('zillowProfileUrl')}
                />
                {errors.zillowProfileUrl && (
                  <p className="text-xs text-destructive">{errors.zillowProfileUrl.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Preferences */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="h-4 w-4 text-repwell-teal-300" />
              <h3 className="text-sm font-semibold text-repwell-teal-500 uppercase tracking-wide">
                Preferences
              </h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="timezone" className="text-sm font-medium">
                  Timezone
                </Label>
                <Select
                  value={timezoneValue || ''}
                  onValueChange={(value) => setValue('timezone', value, { shouldDirty: true })}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for scheduling and notifications
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="p-6 bg-muted/30">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isDirty || avatarChanged ? 'You have unsaved changes' : 'All changes saved'}
              </p>
              <Button
                type="submit"
                disabled={isSubmitting || (!isDirty && !avatarChanged)}
                className="min-w-[140px]"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
