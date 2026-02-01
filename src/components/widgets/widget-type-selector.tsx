"use client";

import {
  Star,
  Building2,
  User,
  LayoutGrid,
  Video,
  Columns3,
  TrendingUp,
  Megaphone,
} from "lucide-react";
import type { WidgetType } from "@/lib/widgets/types";

const WIDGET_TYPE_OPTIONS: {
  type: WidgetType;
  label: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}[] = [
  {
    type: "lo_review",
    label: "Loan Officer Reviews",
    description: "Display reviews for an individual loan officer with profile header",
    icon: User,
  },
  {
    type: "branch_review",
    label: "Branch Reviews",
    description: "Aggregate reviews for a branch location",
    icon: Building2,
  },
  {
    type: "company_review",
    label: "Company Reviews",
    description: "Organization-level reviews with rating distribution",
    icon: Building2,
  },
  {
    type: "review_carousel",
    label: "Review Carousel",
    description: "Rotating display of reviews with auto-play",
    icon: Columns3,
  },
  {
    type: "star_rating_badge",
    label: "Star Rating Badge",
    description: "Compact inline or floating rating badge",
    icon: Star,
  },
  {
    type: "video_testimonial",
    label: "Video Testimonial",
    description: "Video testimonial player with transcript",
    icon: Video,
  },
  {
    type: "review_wall",
    label: "Review Wall",
    description: "Grid layout showcasing multiple reviews",
    icon: LayoutGrid,
  },
  {
    type: "nps_score_badge",
    label: "NPS Score Badge",
    description: "Display Net Promoter Score with visual gauge",
    icon: TrendingUp,
  },
  {
    type: "social_proof_banner",
    label: "Social Proof Banner",
    description: "Dismissible banner with social proof messaging",
    icon: Megaphone,
  },
];

interface WidgetTypeSelectorProps {
  value: WidgetType | null;
  onChange: (type: WidgetType) => void;
}

export function WidgetTypeSelector({ value, onChange }: WidgetTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {WIDGET_TYPE_OPTIONS.map((option) => {
        const Icon = option.icon;
        const isSelected = value === option.type;

        return (
          <button
            key={option.type}
            type="button"
            onClick={() => onChange(option.type)}
            className={`
              group relative flex items-start gap-3 p-4 rounded-xl border text-left
              transition-all duration-200
              ${
                isSelected
                  ? "border-repwell-teal-300 bg-repwell-sage-100/30 ring-2 ring-repwell-teal-300/20"
                  : "border-border bg-white hover:border-repwell-sage-200 hover:shadow-sm"
              }
            `}
          >
            <div
              className={`
                flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                transition-colors duration-200
                ${
                  isSelected
                    ? "bg-repwell-teal-300 text-white"
                    : "bg-repwell-sage-100/50 text-repwell-teal-400 group-hover:bg-repwell-sage-100"
                }
              `}
            >
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`text-sm font-semibold ${
                  isSelected ? "text-repwell-teal-300" : "text-repwell-teal-500"
                }`}
              >
                {option.label}
              </div>
              <div className="text-xs text-repwell-teal-400/70 mt-0.5 leading-relaxed">
                {option.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export { WIDGET_TYPE_OPTIONS };
