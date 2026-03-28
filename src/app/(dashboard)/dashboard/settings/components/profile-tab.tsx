'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  PencilSimple,
  Key,
  BuildingOffice,
  SpinnerGap as Loader2,
  Check,
} from '@phosphor-icons/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  ProfileForm,
  ChangePasswordForm,
  ProfileBanner,
  AccountDeactivation,
} from '@/components/settings';
import { fadeInUp, staggerContainer } from '@/lib/motion/variants';
import { updateOwnOrgFields } from '@/lib/auth/profile-actions';
import type { UserProfileData } from '@/lib/auth/profile-schemas';
import Link from 'next/link';

interface ProfileTabProps {
  profile: UserProfileData;
  isAdmin?: boolean;
}

interface QuickActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickActionButton({ icon, title, description, onClick }: QuickActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 dark:bg-repwell-teal-300/10 hover:bg-repwell-sage-100/50 dark:hover:bg-repwell-teal-300/10 transition-colors text-left group"
    >
      <div className="p-2 rounded-lg bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 group-hover:bg-repwell-sage-200/50 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-heading-accent">{title}</p>
        <p className="text-xs text-repwell-teal-300 truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-repwell-teal-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </button>
  );
}

function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm rounded-md border bg-muted/50 px-3 py-2">
        {value != null && value !== '' ? value : <span className="text-muted-foreground italic">Not set</span>}
      </p>
    </div>
  );
}

function IndividualOrgFieldsForm({ profile }: { profile: UserProfileData }) {
  const [ctaButtonText, setCtaButtonText] = useState(profile.ctaButtonText || '');
  const [ctaButtonUrl, setCtaButtonUrl] = useState(profile.ctaButtonUrl || '');
  const [hireDate, setHireDate] = useState(profile.hireDate || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { toast } = useToast();

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const result = await updateOwnOrgFields({
      ctaButtonText: ctaButtonText || undefined,
      ctaButtonUrl: ctaButtonUrl || undefined,
      hireDate: hireDate || undefined,
    });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      toast({ title: 'Settings saved', description: 'Your business fields have been updated.' });
      setTimeout(() => setSaved(false), 2500);
    } else {
      toast({ title: 'Error', description: result.error || 'Failed to save', variant: 'destructive' });
    }
  }

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <BuildingOffice className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <CardTitle className="text-lg">Business Settings</CardTitle>
            <CardDescription>
              Your call-to-action and business details shown on your public profile.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="orgCtaText">CTA Button Text</Label>
            <Input id="orgCtaText" placeholder='e.g. "Apply Now"' value={ctaButtonText} onChange={(e) => setCtaButtonText(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgCtaUrl">CTA Button URL</Label>
            <Input id="orgCtaUrl" type="url" placeholder="https://yourwebsite.com/apply" value={ctaButtonUrl} onChange={(e) => setCtaButtonUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="orgHireDate">Hire Date</Label>
            <Input id="orgHireDate" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="min-w-[120px]">
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : saved ? (
              <><Check className="mr-2 h-4 w-4" weight="bold" />Saved</>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileTab({
  profile,
  isAdmin,
}: ProfileTabProps) {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp}>
        <h2 className="font-display text-2xl font-bold text-heading-accent tracking-tight">
          Profile & Account
        </h2>
        <p className="text-repwell-teal-300 mt-1">
          Manage your personal information and account settings.
        </p>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Banner */}
          <motion.div variants={fadeInUp} id="profile-banner">
            <ProfileBanner />
          </motion.div>

          {/* Profile Form */}
          <motion.div variants={fadeInUp} id="profile-form">
            <ProfileForm
              profile={profile}
              isAdmin={isAdmin}
              accountType={profile.accountType}
            />
          </motion.div>

          {/* Organization-Managed Fields — context-aware */}
          <motion.div variants={fadeInUp} id="admin-fields">
            {profile.accountType === 'individual' ? (
              <IndividualOrgFieldsForm profile={profile} />
            ) : (
              <Card className="border border-border shadow-soft">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                      <BuildingOffice className="h-5 w-5 text-repwell-teal-300" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">Organization-Managed Fields</CardTitle>
                        <Badge variant="secondary" className="text-xs gap-1">
                          <ShieldCheck className="h-3 w-3" />
                          Admin-managed
                        </Badge>
                      </div>
                      <CardDescription>
                        {isAdmin
                          ? 'Manage these fields from the Team Settings page.'
                          : 'These fields are set by your organization admin.'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ReadOnlyField label="CTA Button Text" value={profile.ctaButtonText} />
                    <ReadOnlyField label="CTA Button URL" value={profile.ctaButtonUrl} />
                    <ReadOnlyField label="Hire Date" value={profile.hireDate} />
                    <ReadOnlyField label="Industry" value={profile.industry} />
                  </div>
                  {isAdmin && profile.id ? (
                    <p className="text-xs text-muted-foreground mt-4">
                      <Link href={`/dashboard/organization/users/${profile.id}`} className="text-repwell-teal-300 hover:underline">
                        Edit in Team Settings &rarr;
                      </Link>
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-4">
                      Contact your organization admin to update these fields.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Change Password Form */}
          <motion.div variants={fadeInUp} id="password-form">
            <ChangePasswordForm />
          </motion.div>
        </div>

        {/* Right Column - Quick Actions */}
        <motion.div variants={fadeInUp}>
          <Card className="h-fit border-border/50 sticky top-6">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-semibold text-heading-accent">Quick Actions</h4>

              <div className="space-y-3">
                <QuickActionButton
                  icon={<PencilSimple weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="Edit Profile"
                  description="Update your information"
                  onClick={() => scrollToSection('profile-form')}
                />

                <QuickActionButton
                  icon={<Key weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="Change Password"
                  description="Update your credentials"
                  onClick={() => scrollToSection('password-form')}
                />

              </div>

              {/* Security Tips */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-repwell-sage-100/20 dark:bg-repwell-teal-300/10">
                  <Lock weight="duotone" className="h-5 w-5 text-repwell-teal-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-heading-accent">Security Tip</p>
                    <p className="text-xs text-repwell-teal-300 mt-0.5">
                      Use a strong, unique password and enable two-factor authentication for better security.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Account Deactivation - Individual users only */}
      {profile.accountType === 'individual' && (
        <motion.div variants={fadeInUp}>
          <AccountDeactivation />
        </motion.div>
      )}
    </motion.div>
  );
}
