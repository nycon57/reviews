export interface PublicAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export function sanitizePublicAddress(address: PublicAddress | null): PublicAddress | null {
  if (!address || (!address.city && !address.state)) {
    return null;
  }

  return {
    city: address.city,
    state: address.state,
  };
}
