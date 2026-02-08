/**
 * Branch Types
 * Types for branch management
 */

export interface BranchAddress {
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  globalSlug: string | null;
  address: BranchAddress | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
  managerId: string | null;
  managerName: string | null;
  managerEmail: string | null;
  region: string | null;
  description: string | null;
  photoUrl: string | null;
  coverImageUrl: string | null;
  hoursOfOperation: Record<string, unknown> | null;
  isActive: boolean;
  isPublic: boolean;
  averageRating: number | null;
  totalReviews: number;
  totalMembers: number;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBranchInput {
  name: string;
  slug?: string;
  address?: BranchAddress;
  phone?: string;
  email?: string;
  websiteUrl?: string;
  googlePlaceId?: string;
  managerId?: string;
  managerName?: string;
  managerEmail?: string;
  region?: string;
  description?: string;
}

export interface UpdateBranchInput {
  name?: string;
  address?: BranchAddress;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  googlePlaceId?: string | null;
  managerId?: string | null;
  managerName?: string | null;
  managerEmail?: string | null;
  region?: string | null;
  description?: string | null;
  isActive?: boolean;
  isPublic?: boolean;
}

export interface BranchFilters {
  isActive?: boolean;
  region?: string;
  search?: string;
}

export interface BranchWithTeamMembers extends Branch {
  teamMembers: {
    id: string;
    fullName: string;
    email: string;
    title: string | null;
    photoUrl: string | null;
    averageRating: number | null;
    totalReviews: number;
  }[];
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
