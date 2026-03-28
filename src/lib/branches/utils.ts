import type { BranchAddress } from './types';

/**
 * Generate a URL-safe slug from a branch name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface BranchPublicSlugInput {
  name: string;
  slug?: string | null;
  global_slug?: string | null;
  globalSlug?: string | null;
}

/**
 * Generate the canonical public slug for a branch.
 * This mirrors org/pro URLs by using the branch name directly.
 */
export function generatePublicBranchSlug(name: string): string {
  return generateSlug(name);
}

/**
 * Resolve the public-facing slug for a branch without falling back to its UUID.
 */
export function getBranchPublicSlug(branch: BranchPublicSlugInput): string {
  return (
    branch.global_slug ||
    branch.globalSlug ||
    branch.slug ||
    generatePublicBranchSlug(branch.name)
  );
}

export function getBranchPublicPath(branch: BranchPublicSlugInput): string {
  return `/branch/${getBranchPublicSlug(branch)}`;
}

/**
 * Geocode a branch address and return coordinates
 */
export async function geocodeBranchAddress(
  address: BranchAddress | undefined
): Promise<{ latitude: number; longitude: number } | null> {
  if (!address) return null;

  const { geocodeAddressWithFallback } = await import('@/lib/directory/geocoding');

  return geocodeAddressWithFallback(
    address.street,
    address.city,
    address.state,
    address.postal_code
  );
}
