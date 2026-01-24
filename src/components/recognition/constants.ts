import {
  Users,
  Lightbulb,
  Rocket,
  GraduationCap,
  Heart,
  Star,
  Smiley,
  Shield,
  Medal,
  Chats,
  TrendUp,
  ClipboardText,
  FileText,
  type IconProps,
} from "@phosphor-icons/react";

type PhosphorIcon = React.ComponentType<IconProps & { style?: React.CSSProperties }>;

// Icon mapping for recognition badges
export const BADGE_ICONS: Record<string, PhosphorIcon> = {
  Users,
  Lightbulb,
  Rocket,
  GraduationCap,
  Heart,
  Star,
  Smile: Smiley,
  Shield,
  Award: Medal,
};

// Icon mapping for feedback types
export const FEEDBACK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Star,
  MessageSquare: Chats,
  TrendingUp: TrendUp,
  ClipboardList: ClipboardText,
  FileText,
};
