import { supabase } from './supabase';
import type {
  VideoTestimonialRequest,
  VideoTestimonialResponse,
  VideoTestimonialStats,
  LoanOfficer,
  CreateVideoRequestInput,
  VideoTestimonialApprovalStatus,
} from '../types';

/**
 * Format duration from seconds to MM:SS
 */
export function formatDuration(seconds: number | null): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get status display info
 */
export function getStatusDisplay(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: '#f59e0b' },
    approved: { label: 'Approved', color: '#22c55e' },
    rejected: { label: 'Rejected', color: '#ef4444' },
    changes_requested: { label: 'Changes Requested', color: '#f59e0b' },
    published: { label: 'Published', color: '#3b82f6' },
    sent: { label: 'Sent', color: '#3b82f6' },
    opened: { label: 'Opened', color: '#8b5cf6' },
    recording: { label: 'Recording', color: '#f59e0b' },
    submitted: { label: 'Submitted', color: '#22c55e' },
    expired: { label: 'Expired', color: '#64748b' },
    cancelled: { label: 'Cancelled', color: '#64748b' },
  };
  return statusMap[status] || { label: status, color: '#64748b' };
}

/**
 * Fetch video testimonial responses (submitted videos) with filtering
 */
export async function getVideoTestimonialResponses(params?: {
  approvalStatus?: string;
  loanOfficerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  responses: VideoTestimonialResponse[];
  total: number;
  stats: VideoTestimonialStats;
}> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  // Get user data for organization filtering
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    throw new Error('Organization not found');
  }

  // Build query
  let query = supabase
    .from('video_testimonial_responses')
    .select(`
      id,
      request_id,
      organization_id,
      loan_officer_id,
      video_url,
      video_path,
      thumbnail_url,
      duration_seconds,
      file_size_bytes,
      transcription,
      transcription_status,
      ai_generated_text,
      ai_generation_status,
      key_phrases,
      sentiment_score,
      sentiment_label,
      approval_status,
      approved_at,
      rejection_reason,
      manager_notes,
      published_at,
      submitted_at,
      created_at,
      video_testimonial_requests!inner (
        customer_name,
        customer_email
      ),
      loan_officers!inner (
        full_name
      )
    `, { count: 'exact' })
    .eq('organization_id', userData.organization_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Apply filters
  if (params?.approvalStatus) {
    query = query.eq('approval_status', params.approvalStatus);
  }

  if (params?.loanOfficerId) {
    query = query.eq('loan_officer_id', params.loanOfficerId);
  }

  // Role-based filtering for loan officers
  if (userData.role === 'loan_officer') {
    const { data: loData } = await supabase
      .from('loan_officers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (loData) {
      query = query.eq('loan_officer_id', loData.id);
    } else {
      return { responses: [], total: 0, stats: getEmptyStats() };
    }
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching video responses:', error);
    throw error;
  }

  // Transform data
  const responses: VideoTestimonialResponse[] = (data || []).map((res) => {
    const request = res.video_testimonial_requests as unknown as {
      customer_name: string;
      customer_email: string;
    };
    const loanOfficer = res.loan_officers as unknown as { full_name: string };

    return {
      id: res.id,
      request_id: res.request_id,
      organization_id: res.organization_id,
      loan_officer_id: res.loan_officer_id,
      video_url: res.video_url,
      video_path: res.video_path,
      thumbnail_url: res.thumbnail_url,
      duration_seconds: res.duration_seconds,
      file_size_bytes: res.file_size_bytes,
      transcription: res.transcription,
      transcription_status: res.transcription_status,
      ai_generated_text: res.ai_generated_text,
      ai_generation_status: res.ai_generation_status,
      key_phrases: res.key_phrases,
      sentiment_score: res.sentiment_score,
      sentiment_label: res.sentiment_label,
      approval_status: res.approval_status as VideoTestimonialApprovalStatus,
      approved_at: res.approved_at,
      rejection_reason: res.rejection_reason,
      manager_notes: res.manager_notes,
      published_at: res.published_at,
      submitted_at: res.submitted_at,
      created_at: res.created_at,
      customer_name: request.customer_name,
      customer_email: request.customer_email,
      loan_officer_name: loanOfficer.full_name,
    };
  });

  // Get stats
  const stats = await getVideoStats(userData.organization_id, userData.role === 'loan_officer' ? user.id : undefined);

  return {
    responses,
    total: count ?? 0,
    stats,
  };
}

/**
 * Get video testimonial stats
 */
async function getVideoStats(
  organizationId: string,
  loanOfficerUserId?: string
): Promise<VideoTestimonialStats> {
  let query = supabase
    .from('video_testimonial_responses')
    .select('approval_status, duration_seconds')
    .eq('organization_id', organizationId);

  if (loanOfficerUserId) {
    const { data: loData } = await supabase
      .from('loan_officers')
      .select('id')
      .eq('user_id', loanOfficerUserId)
      .single();

    if (loData) {
      query = query.eq('loan_officer_id', loData.id);
    }
  }

  const { data } = await query;

  return (data || []).reduce<VideoTestimonialStats>(
    (acc, r) => {
      acc.total++;
      acc.averageDuration += r.duration_seconds || 0;
      switch (r.approval_status) {
        case 'pending':
        case 'changes_requested':
          acc.pending++;
          break;
        case 'approved':
          acc.approved++;
          break;
        case 'rejected':
          acc.rejected++;
          break;
        case 'published':
          acc.published++;
          break;
      }
      return acc;
    },
    { total: 0, pending: 0, approved: 0, rejected: 0, published: 0, averageDuration: 0 }
  );
}

function getEmptyStats(): VideoTestimonialStats {
  return { total: 0, pending: 0, approved: 0, rejected: 0, published: 0, averageDuration: 0 };
}

/**
 * Get a single video testimonial response by ID
 */
export async function getVideoTestimonialResponse(
  responseId: string
): Promise<VideoTestimonialResponse | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('video_testimonial_responses')
    .select(`
      *,
      video_testimonial_requests!inner (
        customer_name,
        customer_email
      ),
      loan_officers!inner (
        full_name
      )
    `)
    .eq('id', responseId)
    .eq('organization_id', userData.organization_id)
    .single();

  if (error || !data) {
    return null;
  }

  const request = data.video_testimonial_requests as unknown as {
    customer_name: string;
    customer_email: string;
  };
  const loanOfficer = data.loan_officers as unknown as { full_name: string };

  return {
    id: data.id,
    request_id: data.request_id,
    organization_id: data.organization_id,
    loan_officer_id: data.loan_officer_id,
    video_url: data.video_url,
    video_path: data.video_path,
    thumbnail_url: data.thumbnail_url,
    duration_seconds: data.duration_seconds,
    file_size_bytes: data.file_size_bytes,
    transcription: data.transcription,
    transcription_status: data.transcription_status,
    ai_generated_text: data.ai_generated_text,
    ai_generation_status: data.ai_generation_status,
    key_phrases: data.key_phrases,
    sentiment_score: data.sentiment_score,
    sentiment_label: data.sentiment_label,
    approval_status: data.approval_status as VideoTestimonialApprovalStatus,
    approved_at: data.approved_at,
    rejection_reason: data.rejection_reason,
    manager_notes: data.manager_notes,
    published_at: data.published_at,
    submitted_at: data.submitted_at,
    created_at: data.created_at,
    customer_name: request.customer_name,
    customer_email: request.customer_email,
    loan_officer_name: loanOfficer.full_name,
  };
}

/**
 * Get video testimonial requests with filtering
 */
export async function getVideoTestimonialRequests(params?: {
  status?: string;
  loanOfficerId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  requests: VideoTestimonialRequest[];
  total: number;
}> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    throw new Error('Organization not found');
  }

  let query = supabase
    .from('video_testimonial_requests')
    .select(`
      id,
      token,
      organization_id,
      loan_officer_id,
      customer_name,
      customer_email,
      customer_phone,
      max_duration_seconds,
      prompt_text,
      status,
      sent_at,
      opened_at,
      submitted_at,
      expires_at,
      reminder_count,
      created_at,
      loan_officers!inner (
        full_name
      )
    `, { count: 'exact' })
    .eq('organization_id', userData.organization_id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (params?.status) {
    query = query.eq('status', params.status);
  }

  if (params?.loanOfficerId) {
    query = query.eq('loan_officer_id', params.loanOfficerId);
  }

  // Role-based filtering for loan officers
  if (userData.role === 'loan_officer') {
    const { data: loData } = await supabase
      .from('loan_officers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (loData) {
      query = query.eq('loan_officer_id', loData.id);
    } else {
      return { requests: [], total: 0 };
    }
  }

  const { data, count, error } = await query;

  if (error) {
    console.error('Error fetching video requests:', error);
    throw error;
  }

  const requests: VideoTestimonialRequest[] = (data || []).map((req) => {
    const loanOfficer = req.loan_officers as unknown as { full_name: string };
    return {
      id: req.id,
      token: req.token,
      organization_id: req.organization_id,
      loan_officer_id: req.loan_officer_id,
      customer_name: req.customer_name,
      customer_email: req.customer_email,
      customer_phone: req.customer_phone,
      max_duration_seconds: req.max_duration_seconds || 120,
      prompt_text: req.prompt_text,
      status: req.status,
      sent_at: req.sent_at,
      opened_at: req.opened_at,
      submitted_at: req.submitted_at,
      expires_at: req.expires_at,
      reminder_count: req.reminder_count || 0,
      created_at: req.created_at,
      loan_officer_name: loanOfficer.full_name,
    };
  });

  return { requests, total: count ?? 0 };
}

/**
 * Create a video testimonial request
 */
export async function createVideoTestimonialRequest(
  input: CreateVideoRequestInput
): Promise<{ requestId: string; token: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    throw new Error('Organization not found');
  }

  // Calculate expiration (14 days from now)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 14);

  const { data, error } = await supabase
    .from('video_testimonial_requests')
    .insert({
      organization_id: userData.organization_id,
      loan_officer_id: input.loan_officer_id,
      created_by: user.id,
      customer_name: input.customer_name,
      customer_email: input.customer_email,
      customer_phone: input.customer_phone || null,
      max_duration_seconds: input.max_duration_seconds || 120,
      prompt_text: input.prompt_text || null,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      source: 'mobile',
    })
    .select('id, token')
    .single();

  if (error || !data) {
    console.error('Error creating video request:', error);
    throw new Error('Failed to create request');
  }

  // Queue the initial email
  await supabase.from('video_testimonial_queue').insert({
    organization_id: userData.organization_id,
    request_id: data.id,
    type: 'initial',
    scheduled_at: new Date().toISOString(),
    priority: 10,
    status: 'pending',
  });

  return { requestId: data.id, token: data.token };
}

/**
 * Update video approval status (for managers/admins)
 */
export async function updateVideoApprovalStatus(
  responseId: string,
  action: 'approve' | 'reject' | 'request_changes',
  options?: {
    reason?: string;
    managerNotes?: string;
  }
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    throw new Error('Organization not found');
  }

  if (!['admin', 'manager'].includes(userData.role)) {
    throw new Error('Insufficient permissions');
  }

  const now = new Date().toISOString();
  const updateData: Record<string, unknown> = {
    updated_at: now,
  };

  switch (action) {
    case 'approve':
      updateData.approval_status = 'approved';
      updateData.approved_at = now;
      updateData.approved_by = user.id;
      updateData.rejection_reason = null;
      updateData.manager_notes = options?.managerNotes || null;
      break;
    case 'reject':
      updateData.approval_status = 'rejected';
      updateData.rejection_reason = options?.reason || null;
      updateData.manager_notes = options?.managerNotes || null;
      break;
    case 'request_changes':
      updateData.approval_status = 'changes_requested';
      updateData.manager_notes = options?.managerNotes || options?.reason || null;
      updateData.changes_requested_at = now;
      updateData.changes_requested_by = user.id;
      break;
  }

  const { error } = await supabase
    .from('video_testimonial_responses')
    .update(updateData)
    .eq('id', responseId)
    .eq('organization_id', userData.organization_id);

  if (error) {
    console.error('Error updating approval status:', error);
    throw new Error('Failed to update status');
  }
}

/**
 * Get signed URL for video playback
 */
export async function getVideoSignedUrl(videoPath: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  // Sanitize path
  const sanitizedPath = videoPath.replace(/^\/+/, '');
  if (sanitizedPath.includes('..') || sanitizedPath.includes('//')) {
    throw new Error('Invalid video path');
  }

  const { data, error } = await supabase.storage
    .from('video-testimonials')
    .createSignedUrl(sanitizedPath, 3600);

  if (error || !data) {
    console.error('Error creating signed URL:', error);
    throw new Error('Failed to get video URL');
  }

  return data.signedUrl;
}

/**
 * Get loan officers for request creation
 */
export async function getLoanOfficers(): Promise<LoanOfficer[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Not authenticated');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) {
    throw new Error('Organization not found');
  }

  const { data, error } = await supabase
    .from('loan_officers')
    .select('id, full_name, email')
    .eq('organization_id', userData.organization_id)
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching loan officers:', error);
    throw error;
  }

  return (data || []).map((lo) => ({
    id: lo.id,
    full_name: lo.full_name,
    email: lo.email,
  }));
}

/**
 * Get user profile with role
 */
export async function getUserProfile(): Promise<{
  id: string;
  role: string;
  organizationId: string;
} | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('users')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    role: data.role,
    organizationId: data.organization_id,
  };
}
