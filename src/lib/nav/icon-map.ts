import { ICON_REGISTRY } from "@/lib/icons/registry";

/**
 * Maps PascalCase icon names from NavConfig → Phosphor icon components.
 * Keeps config serializable (no JSX in config.ts).
 *
 * Delegates to the centralized icon registry.
 */
export const ICON_MAP = ICON_REGISTRY;
