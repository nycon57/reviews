"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { IndustryConfig, IndustryType } from "./types";
import { getIndustryConfig, mortgageConfig } from "./configs";

/**
 * Industry context value
 */
interface IndustryContextValue {
  /** Current industry type */
  industry: IndustryType;
  /** Full industry configuration */
  config: IndustryConfig;
  /** Helper to get professional label (singular) */
  professionalLabel: string;
  /** Helper to get professional label (plural) */
  professionalLabelPlural: string;
  /** Helper to get customer label (singular) */
  customerLabel: string;
  /** Helper to get customer label (plural) */
  customerLabelPlural: string;
  /** Helper to get transaction label (singular) */
  transactionLabel: string;
  /** Helper to get transaction label (plural) */
  transactionLabelPlural: string;
  /** Check if a specific integration should be shown */
  hasIntegration: (integrationId: string) => boolean;
  /** Get review sources available for this industry */
  reviewSources: IndustryConfig["reviewSources"];
  /** Get credentials required for this industry */
  credentials: IndustryConfig["credentials"];
}

const IndustryContext = createContext<IndustryContextValue | null>(null);

interface IndustryProviderProps {
  children: ReactNode;
  /** Industry type - defaults to mortgage for backward compatibility */
  industry?: IndustryType;
  /** Alternative: pass the full config directly */
  config?: IndustryConfig;
}

/**
 * Provider component for industry context
 * Wraps the application to provide industry-specific configuration
 */
export function IndustryProvider({
  children,
  industry = "mortgage",
  config: providedConfig,
}: IndustryProviderProps) {
  const config = useMemo(
    () => providedConfig ?? getIndustryConfig(industry),
    [industry, providedConfig]
  );

  const value = useMemo<IndustryContextValue>(
    () => ({
      industry: config.type,
      config,
      professionalLabel: config.labels.professional,
      professionalLabelPlural: config.labels.professionalPlural,
      customerLabel: config.labels.customer,
      customerLabelPlural: config.labels.customerPlural,
      transactionLabel: config.labels.transaction,
      transactionLabelPlural: config.labels.transactionPlural,
      hasIntegration: (integrationId: string) =>
        config.integrations.some(
          (int) => int.id === integrationId && int.available
        ),
      reviewSources: config.reviewSources,
      credentials: config.credentials,
    }),
    [config]
  );

  return (
    <IndustryContext.Provider value={value}>
      {children}
    </IndustryContext.Provider>
  );
}

/**
 * Hook to access industry configuration
 * @throws Error if used outside of IndustryProvider
 */
export function useIndustry(): IndustryContextValue {
  const context = useContext(IndustryContext);
  if (!context) {
    throw new Error("useIndustry must be used within an IndustryProvider");
  }
  return context;
}

/**
 * Hook to safely access industry configuration
 * Returns default (mortgage) config if not in provider context
 */
export function useIndustrySafe(): IndustryContextValue {
  const context = useContext(IndustryContext);
  if (!context) {
    // Return default mortgage config for backward compatibility
    const config = mortgageConfig;
    return {
      industry: config.type,
      config,
      professionalLabel: config.labels.professional,
      professionalLabelPlural: config.labels.professionalPlural,
      customerLabel: config.labels.customer,
      customerLabelPlural: config.labels.customerPlural,
      transactionLabel: config.labels.transaction,
      transactionLabelPlural: config.labels.transactionPlural,
      hasIntegration: (integrationId: string) =>
        config.integrations.some(
          (int) => int.id === integrationId && int.available
        ),
      reviewSources: config.reviewSources,
      credentials: config.credentials,
    };
  }
  return context;
}

/**
 * Hook to check if within industry context
 */
export function useHasIndustryContext(): boolean {
  const context = useContext(IndustryContext);
  return context !== null;
}
