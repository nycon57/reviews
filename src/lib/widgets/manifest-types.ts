/**
 * Shared types for the embed.js build manifest.
 * Used by build-embed.ts, deploy-embed.ts, and the health check API route.
 */

export interface ManifestEntry {
  version: string;
  hash: string;
  filename: string;
  size: number;
  gzipSize: number;
  brotliSize: number;
  buildTimestamp: string;
}

export interface EmbedManifest {
  current: ManifestEntry;
  previous: ManifestEntry[];
}
