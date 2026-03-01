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
