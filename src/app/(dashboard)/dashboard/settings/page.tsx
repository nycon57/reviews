import { Suspense } from 'react';
import { Gear } from '@phosphor-icons/react/dist/ssr';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsTabs } from './components';
import { getUserProfile } from '@/lib/auth/profile-actions';
import { toUserProfileData } from '@/lib/auth/profile-schemas';

export const metadata = {
  title: 'Settings | RepWell',
  description: 'Manage your account settings and preferences',
};

function SettingsPageSkeleton() {
  return (
    <div className="flex-1 space-y-6">
      <div>
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <div className="flex gap-4 border-b border-border pb-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    </div>
  );
}

async function SettingsContent() {
  const raw = await getUserProfile();
  const profile = toUserProfileData(raw);

  return (
    <SettingsTabs initialTab="account" profile={profile} />
  );
}

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <Gear className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold leading-tight tracking-tight text-repwell-teal-500">Settings</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Settings content with tabs */}
      <Suspense fallback={<SettingsPageSkeleton />}>
        <SettingsContent />
      </Suspense>
    </div>
  );
}
