import {
  House,
  Star,
  FileText,
  PaperPlaneRight,
  Quotes,
  ChatCircle,
  Medal,
  ChartBar,
  TrendUp,
  Trophy,
  Sparkle,
  Eye,
  SquaresFour,
  Users,
  ClipboardText,
  Envelope,
  Buildings,
  Gear,
  Question,
  AddressBook,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

/**
 * Maps PascalCase icon names from NavConfig → Phosphor icon components.
 * Keeps config serializable (no JSX in config.ts).
 */
export const ICON_MAP: Record<string, Icon> = {
  House,
  Star,
  FileText,
  PaperPlaneRight,
  Quotes,
  ChatCircle,
  Medal,
  ChartBar,
  TrendUp,
  Trophy,
  Sparkle,
  Eye,
  SquaresFour,
  Users,
  ClipboardText,
  Envelope,
  Buildings,
  Gear,
  Question,
  AddressBook,
};
