import { useEffect, useState, useRef, useCallback } from "react";
import type { PublicWidgetConfig, ReviewsResponse, PublicReview } from "../types";

interface UseWidgetConfigOptions {
  widgetId?: string;
  config?: PublicWidgetConfig;
  reviews?: PublicReview[];
  apiBaseUrl: string;
}

interface UseWidgetConfigResult {
  config: PublicWidgetConfig | null;
  reviews: PublicReview[];
  loading: boolean;
  error: string | null;
}

const configCache = new Map<string, { data: PublicWidgetConfig; ts: number }>();
const reviewsCache = new Map<string, { data: PublicReview[]; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached<T>(cache: Map<string, { data: T; ts: number }>, key: string): T | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

/**
 * Fetches widget configuration and reviews from the RepWell API.
 * Caches results in memory for 5 minutes. Skips fetch when inline data is provided.
 */
export function useWidgetConfig(options: UseWidgetConfigOptions): UseWidgetConfigResult {
  const { widgetId, config: inlineConfig, reviews: inlineReviews, apiBaseUrl } = options;
  const [config, setConfig] = useState<PublicWidgetConfig | null>(inlineConfig ?? null);
  const [reviews, setReviews] = useState<PublicReview[]>(inlineReviews ?? []);
  const [loading, setLoading] = useState(!inlineConfig && !!widgetId);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    if (!widgetId || inlineConfig) return;

    // Check cache first
    const cachedConfig = getCached(configCache, widgetId);
    const cachedReviews = inlineReviews ?? getCached(reviewsCache, widgetId);
    if (cachedConfig && cachedReviews) {
      setConfig(cachedConfig);
      setReviews(cachedReviews);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const base = apiBaseUrl.replace(/\/$/, "");
      const configUrl = `${base}/api/v1/widgets/${encodeURIComponent(widgetId)}/config`;
      const reviewsUrl = `${base}/api/v1/widgets/${encodeURIComponent(widgetId)}/reviews`;

      const [configRes, reviewsRes] = await Promise.all([
        fetch(configUrl, { signal: controller.signal }),
        inlineReviews
          ? Promise.resolve(null)
          : fetch(reviewsUrl, { signal: controller.signal }),
      ]);

      if (!configRes.ok) {
        throw new Error(`Failed to load widget: ${configRes.status}`);
      }

      const configData = (await configRes.json()) as PublicWidgetConfig;
      configCache.set(widgetId, { data: configData, ts: Date.now() });
      setConfig(configData);

      if (reviewsRes) {
        if (reviewsRes.ok) {
          const reviewsData = (await reviewsRes.json()) as ReviewsResponse;
          reviewsCache.set(widgetId, { data: reviewsData.reviews, ts: Date.now() });
          setReviews(reviewsData.reviews);
        }
      } else if (inlineReviews) {
        setReviews(inlineReviews);
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load widget");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [widgetId, inlineConfig, inlineReviews, apiBaseUrl]);

  useEffect(() => {
    fetchData();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchData]);

  // Update if inline data changes
  useEffect(() => {
    if (inlineConfig) {
      setConfig(inlineConfig);
      setLoading(false);
    }
  }, [inlineConfig]);

  useEffect(() => {
    if (inlineReviews) {
      setReviews(inlineReviews);
    }
  }, [inlineReviews]);

  return { config, reviews, loading, error };
}
