'use client';

import {
  ProfileForm,
  ChangePasswordForm,
  ProfileBanner,
  AccountDangerZone,
} from '@/components/settings';

interface ProfileTabProps {
  userEmail?: string;
  userName?: string;
  userAvatarUrl?: string | null;
  userTitle?: string | null;
  userBio?: string | null;
  userPhone?: string | null;
  userPersonalWebsiteUrl?: string | null;
  userLinkedinUrl?: string | null;
  userZillowProfileUrl?: string | null;
  userTimezone?: string | null;
}

export function ProfileTab({
  userEmail,
  userName,
  userAvatarUrl,
  userTitle,
  userBio,
  userPhone,
  userPersonalWebsiteUrl,
  userLinkedinUrl,
  userZillowProfileUrl,
  userTimezone,
}: ProfileTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-repwell-teal-500">
          Profile & Account
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your personal information and account settings.
        </p>
      </div>

      {/* Profile Completion Banner */}
      <ProfileBanner />

      {/* Profile Information Form */}
      <ProfileForm
        initialName={userName}
        initialEmail={userEmail}
        initialAvatarUrl={userAvatarUrl}
        initialTitle={userTitle}
        initialBio={userBio}
        initialPhone={userPhone}
        initialPersonalWebsiteUrl={userPersonalWebsiteUrl}
        initialLinkedinUrl={userLinkedinUrl}
        initialZillowProfileUrl={userZillowProfileUrl}
        initialTimezone={userTimezone}
      />

      {/* Change Password Form */}
      <ChangePasswordForm />

      {/* Account Danger Zone */}
      <AccountDangerZone />
    </div>
  );
}
