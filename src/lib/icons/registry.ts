/**
 * Centralized Phosphor icon registry.
 *
 * Single source of truth for all config-driven icon lookups.
 * Feature components can still import icons directly from @phosphor-icons/react —
 * this registry is for dynamic lookups where icon names come from config/data.
 */

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
  EnvelopeSimple,
  Buildings,
  Code,
  Gear,
  Question,
  AddressBook,
  Lightning,
  Plus,
  Lock,
  Crown,
  Shield,
  Heart,
  Fire,
  ThumbsUp,
  Images,
  ShareNetwork,
} from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";

// ---------------------------------------------------------------------------
// Canonical registry — PascalCase Phosphor names
// ---------------------------------------------------------------------------

const ICON_REGISTRY: Record<string, Icon> = {
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
  EnvelopeSimple,
  Buildings,
  Code,
  Gear,
  Question,
  AddressBook,
  Lightning,
  Plus,
  Lock,
  Crown,
  Shield,
  Heart,
  Fire,
  ThumbsUp,
  Images,
  ShareNetwork,
};

// ---------------------------------------------------------------------------
// Aliases — map common alternative names to canonical icons
// ---------------------------------------------------------------------------

const ALIASES: Record<string, Icon> = {
  // kebab-case alternatives
  "bar-chart": ChartBar,
  "trending-up": TrendUp,
  "file-text": FileText,
  "thumbs-up": ThumbsUp,
  "mail-check": EnvelopeSimple,
  // semantic alternatives
  send: PaperPlaneRight,
  settings: Gear,
  award: Medal,
  flame: Fire,
  home: House,
};

// ---------------------------------------------------------------------------
// Normalized lookup table (built once at module load)
// ---------------------------------------------------------------------------

function normalize(name: string): string {
  return name.toLowerCase().replace(/[-_\s]/g, "");
}

const LOOKUP: Record<string, Icon> = {};

// Add canonical entries (normalized PascalCase)
for (const [name, icon] of Object.entries(ICON_REGISTRY)) {
  LOOKUP[normalize(name)] = icon;
}

// Add aliases (normalized)
for (const [alias, icon] of Object.entries(ALIASES)) {
  const key = normalize(alias);
  if (!LOOKUP[key]) {
    LOOKUP[key] = icon;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up a Phosphor icon by name. Normalizes input (lowercases, strips
 * hyphens/underscores/spaces) so PascalCase, kebab-case, and snake_case
 * all resolve correctly.
 *
 * Returns `undefined` if the name is not in the registry.
 */
export function getIcon(name: string | null | undefined): Icon | undefined {
  if (!name) return undefined;
  return LOOKUP[normalize(name)];
}

/**
 * Same as `getIcon` but returns a fallback icon when the name is missing
 * or unrecognized. Defaults to `ChartBar` if no fallback is specified.
 */
export function getIconOrDefault(
  name: string | null | undefined,
  fallback: Icon = ChartBar
): Icon {
  return getIcon(name) ?? fallback;
}

/**
 * The full icon registry for cases that need to iterate all available icons
 * (e.g. icon pickers). Keyed by PascalCase Phosphor name.
 */
export { ICON_REGISTRY };
