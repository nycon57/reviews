"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Warning as AlertTriangle,
  Clock,
  CreditCard,
  Lightning as Zap,
  X,
} from "@phosphor-icons/react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { checkSubscriptionAccess } from "@/lib/stripe";
import { cn } from "@/lib/utils";

interface SubscriptionBannerProps {
  className?: string;
}

type BannerType = "trial" | "past_due" | "canceled" | "none";

interface BannerConfig {
  type: BannerType;
  variant: "default" | "destructive" | "warning";
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

const BANNER_CONFIGS: Record<string, BannerConfig> = {
  trialing: {
    type: "trial",
    variant: "default",
    icon: <Zap className="h-4 w-4" />,
    title: "Trial Period",
    description: "Your trial is active. Upgrade to keep all features after it ends.",
    action: {
      label: "View Plans",
      href: "/pricing",
    },
  },
  past_due: {
    type: "past_due",
    variant: "destructive",
    icon: <AlertTriangle className="h-4 w-4" />,
    title: "Payment Past Due",
    description: "Please update your payment method to avoid service interruption.",
    action: {
      label: "Update Payment",
      href: "/dashboard/settings?tab=billing",
    },
  },
  canceled: {
    type: "canceled",
    variant: "warning",
    icon: <Clock className="h-4 w-4" />,
    title: "Subscription Cancelled",
    description: "Your subscription has been cancelled. Renew to regain access to premium features.",
    action: {
      label: "Resubscribe",
      href: "/pricing",
    },
  },
  unpaid: {
    type: "past_due",
    variant: "destructive",
    icon: <CreditCard className="h-4 w-4" />,
    title: "Payment Failed",
    description: "Your last payment failed. Please update your payment method.",
    action: {
      label: "Update Payment",
      href: "/dashboard/settings?tab=billing",
    },
  },
};

export function SubscriptionBanner({ className }: SubscriptionBannerProps) {
  const [config, setConfig] = useState<BannerConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkStatus() {
      try {
        const result = await checkSubscriptionAccess();

        if (mounted && result.status && BANNER_CONFIGS[result.status]) {
          setConfig(BANNER_CONFIGS[result.status]);
        }
      } catch (error) {
        console.error("Error checking subscription:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkStatus();

    return () => {
      mounted = false;
    };
  }, []);

  // Check if dismissed in session storage
  useEffect(() => {
    if (config) {
      const dismissedKey = `subscription_banner_dismissed_${config.type}`;
      const wasDismissed = sessionStorage.getItem(dismissedKey) === "true";
      setDismissed(wasDismissed);
    }
  }, [config]);

  const handleDismiss = () => {
    if (config) {
      const dismissedKey = `subscription_banner_dismissed_${config.type}`;
      sessionStorage.setItem(dismissedKey, "true");
      setDismissed(true);
    }
  };

  if (loading || !config || dismissed) {
    return null;
  }

  return (
    <Alert
      variant={config.variant === "warning" ? "default" : config.variant}
      className={cn(
        "relative",
        config.variant === "warning" && "border-orange-500 bg-orange-50 text-orange-900 [&>svg]:text-orange-600",
        className
      )}
    >
      {config.icon}
      <AlertTitle className="pr-8">{config.title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between gap-4">
        <span>{config.description}</span>
        {config.action && (
          <Button size="sm" variant="outline" asChild>
            <Link href={config.action.href}>{config.action.label}</Link>
          </Button>
        )}
      </AlertDescription>
      {config.type !== "past_due" && (
        <button
          onClick={handleDismiss}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Alert>
  );
}
