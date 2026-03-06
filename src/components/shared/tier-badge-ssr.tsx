import { SealCheck } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TierBadgeSSRProps {
  isEnterprise: boolean;
  isPro: boolean;
  size?: "sm" | "md";
}

const sizeConfig = {
  sm: { icon: "h-4 w-4", text: "text-[10px] px-1.5 py-0" },
  md: { icon: "h-5 w-5", text: "text-xs px-2 py-0.5" },
};

export function TierBadgeSSR({ isEnterprise, isPro, size = "sm" }: TierBadgeSSRProps) {
  const cfg = sizeConfig[size];

  if (isEnterprise) {
    return (
      <SealCheck
        weight="fill"
        className={cn(cfg.icon, "text-repwell-teal-300 shrink-0")}
        aria-label="Verified Enterprise"
      />
    );
  }

  if (isPro) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          cfg.text,
          "font-semibold bg-surface-soft text-label shrink-0"
        )}
      >
        Pro
      </Badge>
    );
  }

  return null;
}
