"use client";

import { useRouter } from "next/navigation";
import {
  Code2,
  Star,
  Building2,
  User,
  LayoutGrid,
  Video,
  Columns3,
  TrendingUp,
  Megaphone,
  Badge as BadgeIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { WidgetConfig, WidgetType } from "@/lib/widgets/types";
import { WIDGET_TYPE_LABELS } from "@/lib/widgets/constants";

const TYPE_ICONS: Record<WidgetType, React.ComponentType<{ size?: number; className?: string }>> = {
  lo_review: User,
  branch_review: Building2,
  company_review: Building2,
  review_carousel: Columns3,
  star_rating_badge: Star,
  video_testimonial: Video,
  review_wall: LayoutGrid,
  nps_score_badge: TrendingUp,
  social_proof_banner: Megaphone,
};

interface WidgetCardProps {
  widget: WidgetConfig;
}

export function WidgetCard({ widget }: WidgetCardProps) {
  const router = useRouter();
  const { toast } = useToast();

  const Icon = TYPE_ICONS[widget.widget_type as WidgetType] ?? BadgeIcon;
  const typeLabel = WIDGET_TYPE_LABELS[widget.widget_type as WidgetType] ?? widget.widget_type;

  const handleCustomize = () => {
    router.push(`/dashboard/widgets/${widget.id}`);
  };

  const handleCopyEmbed = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = `<script src="${window.location.origin}/embed.js" async></script>\n<div data-repwell-widget="${widget.widget_id}"></div>`;
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Embed code copied", description: "Paste it into your website." });
    } catch {
      toast({ title: "Copy failed", description: "Could not copy to clipboard.", variant: "destructive" });
    }
  };

  return (
    <div
      className="group relative bg-white border border-border rounded-xl p-5 shadow-sm
        hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      {/* Top row: icon */}
      <div className="flex items-start mb-3">
        <div className="w-10 h-10 rounded-lg bg-repwell-sage-100/50 flex items-center justify-center text-repwell-teal-400">
          <Icon size={20} />
        </div>
      </div>

      {/* Type label */}
      <h3 className="text-sm font-semibold text-repwell-teal-500 truncate mb-1">
        {typeLabel}
      </h3>

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        <Button
          size="sm"
          onClick={handleCustomize}
          className="flex-1 gap-1.5 bg-repwell-teal-300 hover:bg-repwell-teal-400 text-xs"
        >
          Customize
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyEmbed}
          className="gap-1.5 text-xs"
        >
          <Code2 size={14} />
          Copy Embed
        </Button>
      </div>
    </div>
  );
}
