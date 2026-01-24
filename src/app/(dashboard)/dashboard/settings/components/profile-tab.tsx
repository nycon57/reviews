'use client';

import { motion } from 'framer-motion';
import {
  Lock,
  ShieldCheck,
  ArrowRight,
  PencilSimple,
  Key,
} from '@phosphor-icons/react';
import { Card, CardContent } from '@/components/ui/card';
import {
  ProfileForm,
  ChangePasswordForm,
  ProfileBanner,
  AccountDangerZone,
} from '@/components/settings';
import { fadeInUp, staggerContainer } from '@/lib/motion/variants';

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

interface QuickActionButtonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function QuickActionButton({ icon, title, description, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg bg-repwell-sage-100/30 hover:bg-repwell-sage-100/50 transition-colors text-left group"
    >
      <div className="p-2 rounded-lg bg-repwell-sage-100/50 group-hover:bg-repwell-sage-200/50 transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-repwell-teal-500">{title}</p>
        <p className="text-xs text-repwell-teal-300 truncate">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-repwell-teal-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
    </button>
  );
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
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
        <h2 className="font-display text-2xl font-bold text-repwell-teal-500 tracking-tight">
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
              <h4 className="font-semibold text-repwell-teal-500">Quick Actions</h4>

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

                <QuickActionButton
                  icon={<ShieldCheck weight="duotone" className="h-4 w-4 text-repwell-teal-300" />}
                  title="Security Settings"
                  description="Manage account security"
                  onClick={() => scrollToSection('danger-zone')}
                />
              </div>

              {/* Security Tips */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-repwell-sage-100/20">
                  <Lock weight="duotone" className="h-5 w-5 text-repwell-teal-300 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-repwell-teal-500">Security Tip</p>
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

      {/* Account Danger Zone - Full Width */}
      <motion.div variants={fadeInUp} id="danger-zone">
        <AccountDangerZone />
      </motion.div>
    </motion.div>
  );
}
