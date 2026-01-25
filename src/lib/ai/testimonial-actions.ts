'use server';

import { createAdminClient } from '@/lib/supabase/admin';
import { unifiedGetUser } from '@/lib/auth/actions';
import { revalidatePath } from 'next/cache';
import {
  generateTestimonial,
  generateMultipleFormats,
  generateTestimonialGraphic,
  isReviewSuitableForTestimonial,
  analyzeBestTestimonialOpportunities,
} from './testimonial-generator';
import type {
  TestimonialFormat,
  TestimonialStatus,
  Testimonial,
  TestimonialTemplate,
  TestimonialReviewContext,
  TestimonialFilters,
  TestimonialStats,
  TestimonialActionResult,
  TestimonialExportOptions,
  TestimonialExportResult,
  GraphicGenerationOptions,
  GeneratedGraphic,
  BatchGenerationRequest,
  BatchGenerationResult,
} from './testimonial-types';
import type { SentimentLabel, ReviewTheme } from './types';

// Helper to get authenticated user
async function getAuthenticatedUser() {
  const user = await unifiedGetUser();
  if (!user) {
    throw new Error('Authentication required');
  }

  const supabase = createAdminClient();
  // Get user's organization
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    throw new Error('User not found');
  }

  if (!userData.organization_id) {
    throw new Error('User not associated with an organization');
  }

  return { user, organizationId: userData.organization_id, role: userData.role };
}

// Get review context for testimonial generation
async function getReviewContext(reviewId: string): Promise<TestimonialReviewContext> {
  const supabase = createAdminClient();

  const { data: review, error } = await supabase
    .from('reviews')
    .select(`
      id,
      text,
      rating,
      customer_name,
      customer_location,
      source,
      review_date,
      sentiment_score,
      sentiment_label,
      themes,
      key_phrases,
      user_id
    `)
    .eq('id', reviewId)
    .single();

  if (error || !review) {
    throw new Error('Review not found');
  }

  // Fetch user data separately
  let userName = 'Team Member';
  if (review.user_id) {
    const { data: userData } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', review.user_id)
      .single();
    if (userData?.full_name) {
      userName = userData.full_name;
    }
  }

  return {
    id: review.id,
    text: review.text,
    rating: review.rating,
    customerName: review.customer_name,
    customerLocation: review.customer_location,
    loanOfficerName: userName,
    source: review.source,
    reviewDate: review.review_date,
    sentimentScore: review.sentiment_score,
    sentimentLabel: review.sentiment_label as SentimentLabel | null,
    themes: (review.themes || []) as ReviewTheme[],
    keyPhrases: review.key_phrases || [],
  };
}

// Generate testimonial for a review
export async function generateTestimonialFromReview(
  reviewId: string,
  format: TestimonialFormat = 'medium'
): Promise<TestimonialActionResult<Testimonial>> {
  try {
    const { organizationId } = await getAuthenticatedUser();
    const context = await getReviewContext(reviewId);

    // Check suitability
    const suitability = isReviewSuitableForTestimonial(
      context.rating,
      context.text,
      context.sentimentScore
    );

    if (!suitability.suitable) {
      return { success: false, error: suitability.reason };
    }

    // Generate testimonial
    const generated = await generateTestimonial(context, format);

    // Save to database
    const supabase = createAdminClient();
    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .insert({
        organization_id: organizationId,
        review_id: reviewId,
        user_id: null, // Will be set from review relationship
        format,
        content: generated.content,
        original_quote: generated.originalQuote,
        key_highlights: generated.keyHighlights,
        ai_generated: true,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving testimonial:', error);
      return { success: false, error: 'Failed to save testimonial' };
    }

    revalidatePath('/dashboard/testimonials');

    return {
      success: true,
      data: transformTestimonial(testimonial as Record<string, unknown>),
    };
  } catch (error) {
    console.error('Error generating testimonial:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Generate multiple formats for a review
export async function generateMultipleTestimonialFormats(
  reviewId: string,
  formats: TestimonialFormat[] = ['short', 'medium', 'social', 'headline']
): Promise<TestimonialActionResult<Testimonial[]>> {
  try {
    const { organizationId } = await getAuthenticatedUser();
    const context = await getReviewContext(reviewId);

    // Check suitability
    const suitability = isReviewSuitableForTestimonial(
      context.rating,
      context.text,
      context.sentimentScore
    );

    if (!suitability.suitable) {
      return { success: false, error: suitability.reason };
    }

    // Generate all formats
    const result = await generateMultipleFormats(context, formats);

    if (result.testimonials.length === 0) {
      return { success: false, error: result.error || 'No testimonials generated' };
    }

    // Save all to database
    const supabase = createAdminClient();
    const insertData = result.testimonials.map((t) => ({
      organization_id: organizationId,
      review_id: reviewId,
      format: t.format,
      content: t.content,
      original_quote: t.originalQuote,
      key_highlights: t.keyHighlights,
      ai_generated: true,
      status: 'draft' as const,
    }));

    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .insert(insertData)
      .select();

    if (error) {
      console.error('Error saving testimonials:', error);
      return { success: false, error: 'Failed to save testimonials' };
    }

    revalidatePath('/dashboard/testimonials');

    return {
      success: true,
      data: testimonials.map((t) => transformTestimonial(t as Record<string, unknown>)),
    };
  } catch (error) {
    console.error('Error generating testimonials:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Batch generate testimonials from multiple reviews
export async function batchGenerateTestimonials(
  request: BatchGenerationRequest
): Promise<TestimonialActionResult<BatchGenerationResult>> {
  try {
    const { organizationId } = await getAuthenticatedUser();
    const supabase = createAdminClient();

    const results: BatchGenerationResult = {
      total: request.reviewIds.length,
      successful: 0,
      failed: 0,
      results: [],
    };

    for (const reviewId of request.reviewIds) {
      try {
        const context = await getReviewContext(reviewId);
        const genResult = await generateMultipleFormats(context, request.formats);

        if (genResult.testimonials.length > 0) {
          // Save to database
          const insertData = genResult.testimonials.map((t) => ({
            organization_id: organizationId,
            review_id: reviewId,
            format: t.format,
            content: t.content,
            original_quote: t.originalQuote,
            key_highlights: t.keyHighlights,
            ai_generated: true,
            status: request.autoApproveHighConfidence && t.confidence >= (request.confidenceThreshold || 0.8)
              ? 'approved' as const
              : 'draft' as const,
          }));

          await supabase.from('testimonials').insert(insertData);
          results.successful++;
        } else {
          results.failed++;
        }

        results.results.push(genResult);

        // Rate limiting delay
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch {
        results.failed++;
      }
    }

    revalidatePath('/dashboard/testimonials');

    return { success: true, data: results };
  } catch (error) {
    console.error('Error in batch generation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get testimonials with filters
export async function getTestimonials(
  filters: TestimonialFilters = {}
): Promise<TestimonialActionResult<{ testimonials: Testimonial[]; total: number }>> {
  try {
    await getAuthenticatedUser();
    const supabase = createAdminClient();

    const {
      status,
      format,
      loanOfficerId,
      reviewId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    let query = supabase
      .from('testimonials')
      .select(`
        *,
        review:reviews (
          id,
          rating,
          text,
          customer_name,
          source,
          review_date
        )
      `, { count: 'exact' });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (format && format !== 'all') {
      query = query.eq('format', format);
    }
    if (loanOfficerId) {
      query = query.eq('user_id', loanOfficerId);
    }
    if (reviewId) {
      query = query.eq('review_id', reviewId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (search) {
      query = query.ilike('content', `%${search}%`);
    }

    // Sorting
    const sortColumn = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      approvedAt: 'approved_at',
    }[sortBy] || 'created_at';

    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching testimonials:', error);
      return { success: false, error: 'Failed to fetch testimonials' };
    }

    // Fetch user data for user_ids
    const userIds: string[] = [];
    for (const t of data || []) {
      const userId = (t as { user_id?: string }).user_id;
      if (userId && !userIds.includes(userId)) {
        userIds.push(userId);
      }
    }
    const userMap = new Map<string, { id: string; full_name: string | null; photo_url: string | null }>();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name, photo_url')
        .in('id', userIds);
      for (const u of users || []) {
        userMap.set(u.id, u);
      }
    }

    return {
      success: true,
      data: {
        testimonials: (data || []).map((t) => {
          const testimonialUserId = (t as { user_id?: string }).user_id;
          const user = testimonialUserId ? userMap.get(testimonialUserId) : undefined;
          return transformTestimonial(t, user);
        }),
        total: count || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get testimonial statistics
export async function getTestimonialStats(): Promise<TestimonialActionResult<TestimonialStats>> {
  try {
    await getAuthenticatedUser();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('testimonials')
      .select('status, format, export_count');

    if (error) {
      return { success: false, error: 'Failed to fetch stats' };
    }

    const stats: TestimonialStats = {
      total: data.length,
      byStatus: { draft: 0, approved: 0, rejected: 0, published: 0 },
      byFormat: { short: 0, medium: 0, long: 0, social: 0, headline: 0 },
      totalExports: 0,
      approvalRate: 0,
      averageGenerationTime: 0,
    };

    for (const t of data) {
      stats.byStatus[t.status as TestimonialStatus]++;
      stats.byFormat[t.format as TestimonialFormat]++;
      stats.totalExports += t.export_count || 0;
    }

    const approvedCount = stats.byStatus.approved + stats.byStatus.published;
    const reviewedCount = approvedCount + stats.byStatus.rejected;
    stats.approvalRate = reviewedCount > 0 ? approvedCount / reviewedCount : 0;

    return { success: true, data: stats };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Update testimonial status
export async function updateTestimonialStatus(
  testimonialId: string,
  status: TestimonialStatus,
  rejectionReason?: string
): Promise<TestimonialActionResult> {
  try {
    const { user } = await getAuthenticatedUser();
    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = { status };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = user.id;
    } else if (status === 'rejected') {
      updateData.rejection_reason = rejectionReason;
    } else if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('testimonials')
      .update(updateData)
      .eq('id', testimonialId);

    if (error) {
      return { success: false, error: 'Failed to update status' };
    }

    revalidatePath('/dashboard/testimonials');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Bulk update testimonial status
export async function bulkUpdateTestimonialStatus(
  testimonialIds: string[],
  status: TestimonialStatus
): Promise<TestimonialActionResult<{ updated: number }>> {
  try {
    const { user } = await getAuthenticatedUser();
    const supabase = createAdminClient();

    const updateData: Record<string, unknown> = { status };

    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = user.id;
    } else if (status === 'published') {
      updateData.published_at = new Date().toISOString();
    }

    const { error, count } = await supabase
      .from('testimonials')
      .update(updateData)
      .in('id', testimonialIds);

    if (error) {
      return { success: false, error: 'Failed to update testimonials' };
    }

    revalidatePath('/dashboard/testimonials');
    return { success: true, data: { updated: count || testimonialIds.length } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Edit testimonial content
export async function updateTestimonialContent(
  testimonialId: string,
  content: string
): Promise<TestimonialActionResult> {
  try {
    await getAuthenticatedUser();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('testimonials')
      .update({ content, ai_generated: false })
      .eq('id', testimonialId);

    if (error) {
      return { success: false, error: 'Failed to update content' };
    }

    revalidatePath('/dashboard/testimonials');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Delete testimonial
export async function deleteTestimonial(
  testimonialId: string
): Promise<TestimonialActionResult> {
  try {
    await getAuthenticatedUser();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', testimonialId);

    if (error) {
      return { success: false, error: 'Failed to delete testimonial' };
    }

    revalidatePath('/dashboard/testimonials');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Generate graphic for testimonial
export async function generateGraphicForTestimonial(
  testimonialId: string,
  options: GraphicGenerationOptions = {}
): Promise<TestimonialActionResult<GeneratedGraphic>> {
  try {
    const { organizationId } = await getAuthenticatedUser();
    const supabase = createAdminClient();

    // Get testimonial with review data
    const { data: testimonial, error: fetchError } = await supabase
      .from('testimonials')
      .select(`
        content,
        user_id,
        review:reviews (
          customer_name,
          rating
        )
      `)
      .eq('id', testimonialId)
      .single();

    if (fetchError || !testimonial) {
      return { success: false, error: 'Testimonial not found' };
    }

    // Fetch user data separately
    let userName: string | undefined;
    if (testimonial.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', testimonial.user_id)
        .single();
      userName = userData?.full_name || undefined;
    }

    // Generate graphic
    const graphic = generateTestimonialGraphic(
      {
        content: testimonial.content,
        customerName: testimonial.review?.customer_name || undefined,
        loanOfficerName: userName,
        rating: testimonial.review?.rating || undefined,
      },
      options
    );

    // Save graphic to database
    const { error: saveError } = await supabase
      .from('testimonial_graphics')
      .insert({
        testimonial_id: testimonialId,
        organization_id: organizationId,
        image_data: graphic.imageData,
        width: graphic.width,
        height: graphic.height,
        format: graphic.format,
        template_name: graphic.templateName,
        background_color: options.backgroundColor || '#ffffff',
        text_color: options.textColor || '#1a1a1a',
        accent_color: options.accentColor || '#3b82f6',
      });

    if (saveError) {
      console.error('Error saving graphic:', saveError);
      // Return graphic anyway, just log the save error
    }

    return { success: true, data: graphic };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Export testimonial
export async function exportTestimonial(
  testimonialId: string,
  options: TestimonialExportOptions
): Promise<TestimonialActionResult<TestimonialExportResult>> {
  try {
    await getAuthenticatedUser();
    const supabase = createAdminClient();

    const { data: testimonial, error } = await supabase
      .from('testimonials')
      .select(`
        *,
        review:reviews (
          customer_name,
          rating,
          review_date
        )
      `)
      .eq('id', testimonialId)
      .single();

    if (error || !testimonial) {
      return { success: false, error: 'Testimonial not found' };
    }

    // Fetch user data separately
    let userName = '';
    if (options.includeLoanOfficerName && testimonial.user_id) {
      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', testimonial.user_id)
        .single();
      userName = userData?.full_name || '';
    }

    let content: string;
    const customerName = options.includeCustomerName !== false
      ? testimonial.review?.customer_name || 'Happy Customer'
      : '';
    const loName = userName;
    const rating = options.includeRating
      ? `${'★'.repeat(testimonial.review?.rating || 5)}${'☆'.repeat(5 - (testimonial.review?.rating || 5))}`
      : '';
    const date = options.includeDate
      ? new Date(testimonial.review?.review_date || testimonial.created_at).toLocaleDateString()
      : '';

    switch (options.format) {
      case 'html':
        content = `<blockquote class="testimonial">
  <p>"${testimonial.content}"</p>
  ${customerName ? `<cite>— ${customerName}</cite>` : ''}
  ${rating ? `<div class="rating">${rating}</div>` : ''}
  ${date ? `<time>${date}</time>` : ''}
</blockquote>`;
        break;

      case 'json':
        content = JSON.stringify({
          content: testimonial.content,
          customerName,
          loanOfficerName: loName,
          rating: testimonial.review?.rating,
          date,
          format: testimonial.format,
        }, null, 2);
        break;

      case 'csv':
        content = `"${testimonial.content.replace(/"/g, '""')}","${customerName}","${loName}","${testimonial.review?.rating || ''}","${date}"`;
        break;

      default: // text
        content = `"${testimonial.content}"${customerName ? `\n— ${customerName}` : ''}${rating ? `\n${rating}` : ''}`;
    }

    // Update export tracking
    await supabase
      .from('testimonials')
      .update({
        last_exported_at: new Date().toISOString(),
        export_count: (testimonial.export_count || 0) + 1,
        published_platforms: [
          ...(testimonial.published_platforms || []),
          options.platform || options.format,
        ].filter((v, i, a) => a.indexOf(v) === i),
      })
      .eq('id', testimonialId);

    return {
      success: true,
      data: {
        content,
        format: options.format,
        platform: options.platform,
        metadata: {
          testimonialId,
          generatedAt: new Date().toISOString(),
          characterCount: content.length,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get best testimonial candidates
export async function getBestTestimonialCandidates(
  limit: number = 10
): Promise<TestimonialActionResult<TestimonialReviewContext[]>> {
  try {
    await getAuthenticatedUser();
    const supabase = createAdminClient();

    // Get high-rated reviews that don't have testimonials yet
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        text,
        rating,
        customer_name,
        customer_location,
        source,
        review_date,
        sentiment_score,
        sentiment_label,
        themes,
        key_phrases,
        user_id
      `)
      .gte('rating', 4)
      .not('text', 'is', null)
      .eq('status', 'approved')
      .order('rating', { ascending: false })
      .order('sentiment_score', { ascending: false })
      .limit(50);

    if (error) {
      return { success: false, error: 'Failed to fetch reviews' };
    }

    // Fetch user names for reviews
    const userIds = [...new Set((reviews || []).map(r => r.user_id).filter((id): id is string => !!id))];
    const userMap = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, full_name')
        .in('id', userIds);
      for (const u of users || []) {
        userMap.set(u.id, u.full_name || 'Team Member');
      }
    }

    // Check which reviews already have testimonials
    const reviewIds = reviews?.map(r => r.id) || [];
    const { data: existingTestimonials } = await supabase
      .from('testimonials')
      .select('review_id')
      .in('review_id', reviewIds);

    const existingReviewIds = new Set(existingTestimonials?.map(t => t.review_id) || []);

    // Filter and transform
    const candidates = (reviews || [])
      .filter(r => !existingReviewIds.has(r.id))
      .map(r => ({
        id: r.id,
        text: r.text,
        rating: r.rating,
        customerName: r.customer_name,
        customerLocation: r.customer_location,
        loanOfficerName: r.user_id ? userMap.get(r.user_id) || 'Team Member' : 'Team Member',
        source: r.source,
        reviewDate: r.review_date,
        sentimentScore: r.sentiment_score,
        sentimentLabel: r.sentiment_label as SentimentLabel | null,
        themes: (r.themes || []) as ReviewTheme[],
        keyPhrases: r.key_phrases || [],
      }));

    // Analyze and sort by opportunity score
    const analyzed = await analyzeBestTestimonialOpportunities(candidates, limit);

    return {
      success: true,
      data: analyzed.map(a => a.review),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get testimonial templates
export async function getTestimonialTemplates(): Promise<TestimonialActionResult<TestimonialTemplate[]>> {
  try {
    await getAuthenticatedUser();
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('testimonial_templates')
      .select('*')
      .eq('is_active', true)
      .order('is_system', { ascending: false })
      .order('name');

    if (error) {
      return { success: false, error: 'Failed to fetch templates' };
    }

    return {
      success: true,
      data: (data || []).map((t) => ({
        id: t.id,
        organizationId: t.organization_id,
        name: t.name,
        description: t.description,
        format: t.format as TestimonialFormat,
        promptTemplate: t.prompt_template,
        exampleOutput: t.example_output,
        isSystem: t.is_system ?? false,
        isActive: t.is_active ?? true,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Transform database record to Testimonial type
function transformTestimonial(
  record: Record<string, unknown>,
  user?: { id: string; full_name: string | null; photo_url: string | null }
): Testimonial {
  return {
    id: record.id as string,
    organizationId: record.organization_id as string,
    reviewId: record.review_id as string,
    loanOfficerId: record.user_id as string | null,
    format: record.format as TestimonialFormat,
    content: record.content as string,
    originalQuote: record.original_quote as string | null,
    keyHighlights: (record.key_highlights as string[]) || [],
    aiGenerated: record.ai_generated as boolean,
    generationPrompt: record.generation_prompt as string | null,
    status: record.status as TestimonialStatus,
    approvedAt: record.approved_at as string | null,
    approvedBy: record.approved_by as string | null,
    rejectionReason: record.rejection_reason as string | null,
    publishedAt: record.published_at as string | null,
    publishedPlatforms: (record.published_platforms as string[]) || [],
    lastExportedAt: record.last_exported_at as string | null,
    exportCount: (record.export_count as number) || 0,
    createdAt: record.created_at as string,
    updatedAt: record.updated_at as string,
    review: record.review ? {
      id: (record.review as Record<string, unknown>).id as string,
      rating: (record.review as Record<string, unknown>).rating as number,
      text: (record.review as Record<string, unknown>).text as string | null,
      customerName: (record.review as Record<string, unknown>).customer_name as string | null,
      source: (record.review as Record<string, unknown>).source as string,
      reviewDate: (record.review as Record<string, unknown>).review_date as string,
    } : undefined,
    loanOfficer: user ? {
      id: user.id,
      fullName: user.full_name || 'Professional',
      photoUrl: user.photo_url,
    } : undefined,
  };
}
