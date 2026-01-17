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
}

export function ProfileTab({ userEmail, userName, userAvatarUrl }: ProfileTabProps) {
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
      />

      {/* Change Password Form */}
      <ChangePasswordForm />

      {/* Account Danger Zone */}
      <AccountDangerZone />
    </div>
  );
}
