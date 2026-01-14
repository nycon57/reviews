import {
  Users,
  Lightbulb,
  Rocket,
  GraduationCap,
  Heart,
  Star,
  Smile,
  Shield,
  Award,
  MessageSquare,
  TrendingUp,
  ClipboardList,
  FileText,
} from "lucide-react";

// Icon mapping for recognition badges
export const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  Users,
  Lightbulb,
  Rocket,
  GraduationCap,
  Heart,
  Star,
  Smile,
  Shield,
  Award,
};

// Icon mapping for feedback types
export const FEEDBACK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Star,
  MessageSquare,
  TrendingUp,
  ClipboardList,
  FileText,
};
