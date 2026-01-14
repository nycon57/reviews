/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type {
  ActionResult,
  BusinessListing,
  DirectoryConnection,
  DirectoryPlatform,
  ListingAlert,
  ListingSyncLog,
  ListingAccuracyHistory,
} from './types';

// Transform database row to BusinessListing
function transformListing(row: Record<string, unknown>): BusinessListing {
  return {
    id: row.id as string,
    organizationId: row.organization_id as string,
    branchId: row.branch_id as string | null,
    businessName: row.business_name as string,
    businessPhone: row.business_phone as string | null,
    businessEmail: row.business_email as string | null,
    businessWebsite: row.business_website as string | null,
    streetAddress: row.street_address as string | null,
    streetAddress2: row.street_address_2 as string | null,
    city: row.city as string | null,
    state: row.state as string | null,
    postalCode: row.postal_code as string | null,
    country: row.country as string,
    businessDescription: row.business_description as string | null,
    businessCategories: (row.business_categories as string[]) || [],
    businessKeywords: (row.business_keywords as string[]) || [],
    hoursOfOperation: (row.hours_of_operation as BusinessListing['hoursOfOperation']) || {},
    logoUrl: row.logo_url as string | null,
    coverPhotoUrl: row.cover_photo_url as string | null,
    photos: (row.photos as string[]) || [],
    socialLinks: (row.social_links as BusinessListing['socialLinks']) || {},
    accuracyScore: row.accuracy_score as number,
    lastAccuracyCheck: row.last_accuracy_check as string | null,
    napConsistencyStatus: row.nap_consistency_status as BusinessListing['napConsistencyStatus'],
    potentialDuplicates: (row.potential_duplicates as string[]) || [],
    isPrimary: row.is_primary as boolean,
    mergedFrom: row.merged_from as string | null,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Transform database row to DirectoryConnection
function transformConnection(row: Record<string, unknown>): DirectoryConnection {
  return {
    id: row.id as string,
    listingId: row.listing_id as string,
    organizationId: row.organization_id as string,
    platform: row.platform as DirectoryPlatform,
    directoryListingId: row.directory_listing_id as string | null,
    directoryUrl: row.directory_url as string | null,
    directoryUsername: row.directory_username as string | null,
    accessToken: row.access_token as string | null,
    refreshToken: row.refresh_token as string | null,
    tokenExpiresAt: row.token_expires_at as string | null,
    isConnected: row.is_connected as boolean,
    isVerified: row.is_verified as boolean,
    syncStatus: row.sync_status as DirectoryConnection['syncStatus'],
    lastSyncAt: row.last_sync_at as string | null,
    syncError: row.sync_error as string | null,
    remoteNapData: (row.remote_nap_data as DirectoryConnection['remoteNapData']) || {},
    napMatchScore: row.nap_match_score as number,
    hasConflicts: row.has_conflicts as boolean,
    conflicts: (row.conflicts as DirectoryConnection['conflicts']) || {},
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// Get all listings for organization
export async function getListings(): Promise<ActionResult<BusinessListing[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('business_listings')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch listings:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data || []).map(transformListing),
    };
  } catch (error) {
    console.error('Error in getListings:', error);
    return { success: false, error: 'Failed to fetch listings' };
  }
}

// Get single listing
export async function getListing(listingId: string): Promise<ActionResult<BusinessListing>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('business_listings')
      .select('*')
      .eq('id', listingId)
      .single();

    if (error) {
      console.error('Failed to fetch listing:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: transformListing(data),
    };
  } catch (error) {
    console.error('Error in getListing:', error);
    return { success: false, error: 'Failed to fetch listing' };
  }
}

// Create new listing
export async function createListing(
  listingData: Partial<BusinessListing>
): Promise<ActionResult<BusinessListing>> {
  try {
    const supabase = await createClient();

    // Get user's organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('organization_id')
      .single();

    if (userError || !userData?.organization_id) {
      return { success: false, error: 'User organization not found' };
    }

    const { data, error } = await supabase
      .from('business_listings')
      .insert({
        organization_id: userData.organization_id,
        branch_id: listingData.branchId || null,
        business_name: listingData.businessName,
        business_phone: listingData.businessPhone || null,
        business_email: listingData.businessEmail || null,
        business_website: listingData.businessWebsite || null,
        street_address: listingData.streetAddress || null,
        street_address_2: listingData.streetAddress2 || null,
        city: listingData.city || null,
        state: listingData.state || null,
        postal_code: listingData.postalCode || null,
        country: listingData.country || 'US',
        business_description: listingData.businessDescription || null,
        business_categories: listingData.businessCategories || [],
        business_keywords: listingData.businessKeywords || [],
        hours_of_operation: listingData.hoursOfOperation || {},
        logo_url: listingData.logoUrl || null,
        cover_photo_url: listingData.coverPhotoUrl || null,
        photos: listingData.photos || [],
        social_links: listingData.socialLinks || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create listing:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/listings');
    return {
      success: true,
      data: transformListing(data),
    };
  } catch (error) {
    console.error('Error in createListing:', error);
    return { success: false, error: 'Failed to create listing' };
  }
}

// Update listing
export async function updateListing(
  listingId: string,
  listingData: Partial<BusinessListing>
): Promise<ActionResult<BusinessListing>> {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};

    if (listingData.businessName !== undefined) updateData.business_name = listingData.businessName;
    if (listingData.businessPhone !== undefined) updateData.business_phone = listingData.businessPhone;
    if (listingData.businessEmail !== undefined) updateData.business_email = listingData.businessEmail;
    if (listingData.businessWebsite !== undefined) updateData.business_website = listingData.businessWebsite;
    if (listingData.streetAddress !== undefined) updateData.street_address = listingData.streetAddress;
    if (listingData.streetAddress2 !== undefined) updateData.street_address_2 = listingData.streetAddress2;
    if (listingData.city !== undefined) updateData.city = listingData.city;
    if (listingData.state !== undefined) updateData.state = listingData.state;
    if (listingData.postalCode !== undefined) updateData.postal_code = listingData.postalCode;
    if (listingData.country !== undefined) updateData.country = listingData.country;
    if (listingData.businessDescription !== undefined) updateData.business_description = listingData.businessDescription;
    if (listingData.businessCategories !== undefined) updateData.business_categories = listingData.businessCategories;
    if (listingData.businessKeywords !== undefined) updateData.business_keywords = listingData.businessKeywords;
    if (listingData.hoursOfOperation !== undefined) updateData.hours_of_operation = listingData.hoursOfOperation;
    if (listingData.logoUrl !== undefined) updateData.logo_url = listingData.logoUrl;
    if (listingData.coverPhotoUrl !== undefined) updateData.cover_photo_url = listingData.coverPhotoUrl;
    if (listingData.photos !== undefined) updateData.photos = listingData.photos;
    if (listingData.socialLinks !== undefined) updateData.social_links = listingData.socialLinks;
    if (listingData.branchId !== undefined) updateData.branch_id = listingData.branchId;

    const { data, error } = await supabase
      .from('business_listings')
      .update(updateData)
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update listing:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/listings');
    revalidatePath(`/dashboard/listings/${listingId}`);
    return {
      success: true,
      data: transformListing(data),
    };
  } catch (error) {
    console.error('Error in updateListing:', error);
    return { success: false, error: 'Failed to update listing' };
  }
}

// Delete listing (soft delete)
export async function deleteListing(listingId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('business_listings')
      .update({ is_active: false })
      .eq('id', listingId);

    if (error) {
      console.error('Failed to delete listing:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/listings');
    return { success: true };
  } catch (error) {
    console.error('Error in deleteListing:', error);
    return { success: false, error: 'Failed to delete listing' };
  }
}

// Get directory connections for a listing
export async function getDirectoryConnections(
  listingId: string
): Promise<ActionResult<DirectoryConnection[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('directory_connections')
      .select('*')
      .eq('listing_id', listingId)
      .order('platform');

    if (error) {
      console.error('Failed to fetch directory connections:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: (data || []).map(transformConnection),
    };
  } catch (error) {
    console.error('Error in getDirectoryConnections:', error);
    return { success: false, error: 'Failed to fetch directory connections' };
  }
}

// Update directory connection
export async function updateDirectoryConnection(
  connectionId: string,
  connectionData: Partial<DirectoryConnection>
): Promise<ActionResult<DirectoryConnection>> {
  try {
    const supabase = await createClient();

    const updateData: Record<string, unknown> = {};

    if (connectionData.directoryListingId !== undefined) updateData.directory_listing_id = connectionData.directoryListingId;
    if (connectionData.directoryUrl !== undefined) updateData.directory_url = connectionData.directoryUrl;
    if (connectionData.directoryUsername !== undefined) updateData.directory_username = connectionData.directoryUsername;
    if (connectionData.isConnected !== undefined) updateData.is_connected = connectionData.isConnected;
    if (connectionData.isVerified !== undefined) updateData.is_verified = connectionData.isVerified;
    if (connectionData.syncStatus !== undefined) updateData.sync_status = connectionData.syncStatus;
    if (connectionData.remoteNapData !== undefined) updateData.remote_nap_data = connectionData.remoteNapData;
    if (connectionData.napMatchScore !== undefined) updateData.nap_match_score = connectionData.napMatchScore;
    if (connectionData.hasConflicts !== undefined) updateData.has_conflicts = connectionData.hasConflicts;
    if (connectionData.conflicts !== undefined) updateData.conflicts = connectionData.conflicts;

    const { data, error } = await supabase
      .from('directory_connections')
      .update(updateData)
      .eq('id', connectionId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update directory connection:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/listings');
    return {
      success: true,
      data: transformConnection(data),
    };
  } catch (error) {
    console.error('Error in updateDirectoryConnection:', error);
    return { success: false, error: 'Failed to update directory connection' };
  }
}

// Connect to a directory (mark as claimed)
export async function connectDirectory(
  connectionId: string,
  directoryUrl: string,
  directoryListingId?: string
): Promise<ActionResult<DirectoryConnection>> {
  return updateDirectoryConnection(connectionId, {
    directoryUrl,
    directoryListingId: directoryListingId || null,
    isConnected: true,
    syncStatus: 'pending',
  });
}

// Disconnect from a directory
export async function disconnectDirectory(connectionId: string): Promise<ActionResult<DirectoryConnection>> {
  return updateDirectoryConnection(connectionId, {
    directoryUrl: null,
    directoryListingId: null,
    isConnected: false,
    isVerified: false,
    syncStatus: 'not_connected',
    remoteNapData: {},
    napMatchScore: 0,
    hasConflicts: false,
    conflicts: {},
  });
}

// Sync directory (simulate - actual implementation would call external APIs)
export async function syncDirectory(connectionId: string): Promise<ActionResult<DirectoryConnection>> {
  try {
    const supabase = await createClient();

    // Get connection and listing
    const { data: connection, error: connError } = await supabase
      .from('directory_connections')
      .select('*, business_listings(*)')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      return { success: false, error: 'Connection not found' };
    }

    // Mark as syncing
    await supabase
      .from('directory_connections')
      .update({ sync_status: 'syncing' })
      .eq('id', connectionId);

    // Create sync log
    const { data: syncLog } = await supabase
      .from('listing_sync_logs')
      .insert({
        listing_id: connection.listing_id,
        connection_id: connectionId,
        sync_type: 'manual',
        status: 'in_progress',
      })
      .select()
      .single();

    // Simulate sync (in real implementation, this would call the directory's API)
    // For now, we'll simulate a successful sync with random NAP match score
    const listing = connection.business_listings;
    const napMatchScore = 75 + Math.floor(Math.random() * 26); // 75-100

    // Update connection with sync results
    const { data: updatedConnection, error: updateError } = await supabase
      .from('directory_connections')
      .update({
        sync_status: 'synced',
        last_sync_at: new Date().toISOString(),
        sync_error: null,
        remote_nap_data: {
          businessName: listing.business_name,
          businessPhone: listing.business_phone,
          streetAddress: listing.street_address,
          city: listing.city,
          state: listing.state,
          postalCode: listing.postal_code,
          website: listing.business_website,
        },
        nap_match_score: napMatchScore,
        has_conflicts: napMatchScore < 100,
      })
      .eq('id', connectionId)
      .select()
      .single();

    // Complete sync log
    if (syncLog) {
      await supabase
        .from('listing_sync_logs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          directories_synced: 1,
          conflicts_detected: napMatchScore < 100 ? 1 : 0,
        })
        .eq('id', syncLog.id);
    }

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/dashboard/listings');
    return {
      success: true,
      data: transformConnection(updatedConnection),
    };
  } catch (error) {
    console.error('Error in syncDirectory:', error);
    return { success: false, error: 'Failed to sync directory' };
  }
}

// Get alerts for organization
export async function getListingAlerts(): Promise<ActionResult<ListingAlert[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('listing_alerts')
      .select('*')
      .eq('is_resolved', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Failed to fetch listing alerts:', error);
      return { success: false, error: error.message };
    }

    const alerts: ListingAlert[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      listingId: row.listing_id as string,
      organizationId: row.organization_id as string,
      alertType: row.alert_type as ListingAlert['alertType'],
      severity: row.severity as ListingAlert['severity'],
      title: row.title as string,
      description: row.description as string | null,
      platform: row.platform as DirectoryPlatform | null,
      connectionId: row.connection_id as string | null,
      isRead: row.is_read as boolean,
      isResolved: row.is_resolved as boolean,
      resolvedAt: row.resolved_at as string | null,
      resolvedBy: row.resolved_by as string | null,
      createdAt: row.created_at as string,
    }));

    return { success: true, data: alerts };
  } catch (error) {
    console.error('Error in getListingAlerts:', error);
    return { success: false, error: 'Failed to fetch alerts' };
  }
}

// Mark alert as read
export async function markAlertRead(alertId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('listing_alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) {
      console.error('Failed to mark alert as read:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/listings');
    return { success: true };
  } catch (error) {
    console.error('Error in markAlertRead:', error);
    return { success: false, error: 'Failed to mark alert as read' };
  }
}

// Resolve alert
export async function resolveAlert(alertId: string): Promise<ActionResult<void>> {
  try {
    const supabase = await createClient();

    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .single();

    const { error } = await supabase
      .from('listing_alerts')
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
        resolved_by: userData?.id || null,
      })
      .eq('id', alertId);

    if (error) {
      console.error('Failed to resolve alert:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/listings');
    return { success: true };
  } catch (error) {
    console.error('Error in resolveAlert:', error);
    return { success: false, error: 'Failed to resolve alert' };
  }
}

// Get sync logs for a listing
export async function getSyncLogs(listingId: string): Promise<ActionResult<ListingSyncLog[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('listing_sync_logs')
      .select('*')
      .eq('listing_id', listingId)
      .order('started_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to fetch sync logs:', error);
      return { success: false, error: error.message };
    }

    const logs: ListingSyncLog[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      organizationId: row.organization_id as string,
      listingId: row.listing_id as string,
      connectionId: row.connection_id as string | null,
      syncType: row.sync_type as ListingSyncLog['syncType'],
      status: row.status as ListingSyncLog['status'],
      directoriesSynced: row.directories_synced as number,
      conflictsDetected: row.conflicts_detected as number,
      conflictsResolved: row.conflicts_resolved as number,
      photosSynced: row.photos_synced as number,
      startedAt: row.started_at as string,
      completedAt: row.completed_at as string | null,
      durationMs: row.duration_ms as number | null,
      errors: (row.errors as string[]) || [],
      metadata: (row.metadata as Record<string, unknown>) || {},
    }));

    return { success: true, data: logs };
  } catch (error) {
    console.error('Error in getSyncLogs:', error);
    return { success: false, error: 'Failed to fetch sync logs' };
  }
}

// Get accuracy history
export async function getAccuracyHistory(listingId: string): Promise<ActionResult<ListingAccuracyHistory[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('listing_accuracy_history')
      .select('*')
      .eq('listing_id', listingId)
      .order('recorded_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Failed to fetch accuracy history:', error);
      return { success: false, error: error.message };
    }

    const history: ListingAccuracyHistory[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      listingId: row.listing_id as string,
      organizationId: row.organization_id as string,
      previousScore: row.previous_score as number | null,
      newScore: row.new_score as number,
      changeAmount: row.change_amount as number | null,
      scoreBreakdown: (row.score_breakdown as ListingAccuracyHistory['scoreBreakdown']) || {
        napCompleteness: 0,
        directoryCoverage: 0,
        napConsistency: 0,
        updateFreshness: 0,
        photoQuality: 0,
      },
      calculationReason: row.calculation_reason as string,
      recordedAt: row.recorded_at as string,
    }));

    return { success: true, data: history };
  } catch (error) {
    console.error('Error in getAccuracyHistory:', error);
    return { success: false, error: 'Failed to fetch accuracy history' };
  }
}

// Detect and mark duplicates
export async function detectDuplicates(listingId: string): Promise<ActionResult<string[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('detect_listing_duplicates', {
      p_listing_id: listingId,
    });

    if (error) {
      console.error('Failed to detect duplicates:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/dashboard/listings');
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error in detectDuplicates:', error);
    return { success: false, error: 'Failed to detect duplicates' };
  }
}

// Get listings summary stats
export async function getListingsSummary(): Promise<
  ActionResult<{
    totalListings: number;
    averageAccuracy: number;
    connectedDirectories: number;
    unresolvedAlerts: number;
  }>
> {
  try {
    const supabase = await createClient();

    // Get total listings and average accuracy
    const { data: listings, error: listingsError } = await supabase
      .from('business_listings')
      .select('accuracy_score')
      .eq('is_active', true);

    if (listingsError) {
      return { success: false, error: listingsError.message };
    }

    // Get connected directories count
    const { count: connectedCount, error: connectedError } = await supabase
      .from('directory_connections')
      .select('*', { count: 'exact', head: true })
      .eq('is_connected', true);

    if (connectedError) {
      return { success: false, error: connectedError.message };
    }

    // Get unresolved alerts count
    const { count: alertsCount, error: alertsError } = await supabase
      .from('listing_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('is_resolved', false);

    if (alertsError) {
      return { success: false, error: alertsError.message };
    }

    const totalListings = listings?.length || 0;
    const averageAccuracy =
      totalListings > 0
        ? Math.round(
            listings.reduce((sum, l) => sum + (l.accuracy_score || 0), 0) / totalListings
          )
        : 0;

    return {
      success: true,
      data: {
        totalListings,
        averageAccuracy,
        connectedDirectories: connectedCount || 0,
        unresolvedAlerts: alertsCount || 0,
      },
    };
  } catch (error) {
    console.error('Error in getListingsSummary:', error);
    return { success: false, error: 'Failed to fetch listings summary' };
  }
}
