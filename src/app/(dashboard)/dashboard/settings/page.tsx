import { Suspense } from 'react';
import { Gear } from '@phosphor-icons/react/dist/ssr';
import { Skeleton } from '@/components/ui/skeleton';
import { SettingsTabs } from './components';
import { getUserProfile } from '@/lib/auth/profile-actions';

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
  const profile = await getUserProfile();

  return (
    <SettingsTabs
      initialTab="account"
      userEmail={profile?.email}
      userName={profile?.full_name ?? undefined}
      userAvatarUrl={profile?.avatar_url}
      userTitle={profile?.title}
      userNmlsId={profile?.nmls_id}
      userBio={profile?.bio}
      userPhone={profile?.phone}
      userPersonalWebsiteUrl={profile?.personal_website_url}
      userLinkedinUrl={profile?.linkedin_url}
      userZillowProfileUrl={profile?.zillow_profile_url}
      userFacebookUrl={profile?.facebook_url}
      userInstagramUrl={profile?.instagram_url}
      userTwitterUrl={profile?.twitter_url}
      userTimezone={profile?.timezone}
      userSlug={profile?.slug}
      userBannerUrl={profile?.banner_url}
      userId={profile?.id}
      userRole={profile?.role}
    />
  );
}

export default function SettingsPage() {
  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Gear className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
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
