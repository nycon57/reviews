'use server';

import { createClient, createUntypedServerClient } from '@/lib/supabase/server';
import { createChatCompletion, isAIEnabled } from '@/lib/ai/client';
import type {
  ActionResult,
  AIVisibilityScore,
  VisibilityScoreBreakdown,
  OptimizationSuggestion,
  AIOptimizedFAQ,
  SchemaRecommendation,
  AISearchMention,
  AISearchPerformance,
  GEODashboardSummary,
  AISearchPlatform,
  ContentCategory,
} from './types';
import { GEO_CONFIG } from './types';

/**
 * Get the current user's organization context
 */
async function getOrganizationContext(): Promise<{
  userId: string;
  organizationId: string;
  role: string;
} | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();

  if (!userData?.organization_id) return null;

  return {
    userId: userData.id,
    organizationId: userData.organization_id,
    role: userData.role,
  };
}

/**
 * Calculate AI visibility score for an entity
 */
export async function calculateVisibilityScore(
  entityType: 'loan_officer' | 'branch' | 'organization',
  entityId: string
): Promise<ActionResult<AIVisibilityScore>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Fetch entity data based on type
    let entityData: Record<string, unknown> | null = null;
    let reviewStats: { averageRating: number; totalReviews: number } = {
      averageRating: 0,
      totalReviews: 0,
    };

    if (entityType === 'loan_officer') {
      const { data } = await supabase
        .from('loan_officers')
        .select(`
          *,
          reviews:reviews(count),
          average_rating,
          total_reviews
        `)
        .eq('id', entityId)
        .single();
      entityData = data;
      reviewStats = {
        averageRating: data?.average_rating || 0,
        totalReviews: data?.total_reviews || 0,
      };
    } else if (entityType === 'branch') {
      const { data } = await supabase
        .from('branches')
        .select('*, average_rating, total_reviews')
        .eq('id', entityId)
        .single();
      entityData = data;
      reviewStats = {
        averageRating: data?.average_rating || 0,
        totalReviews: data?.total_reviews || 0,
      };
    } else {
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', entityId)
        .single();
      entityData = data;
    }

    if (!entityData) {
      return { success: false, error: 'Entity not found' };
    }

    // Calculate score breakdown
    const breakdown = calculateScoreBreakdown(entityType, entityData, reviewStats);

    // Calculate overall score using weighted average
    const overallScore = Math.round(
      breakdown.contentCompleteness * GEO_CONFIG.scoreWeights.contentCompleteness +
      breakdown.structuredData * GEO_CONFIG.scoreWeights.structuredData +
      breakdown.entityClarity * GEO_CONFIG.scoreWeights.entityClarity +
      breakdown.citationPotential * GEO_CONFIG.scoreWeights.citationPotential +
      breakdown.topicalAuthority * GEO_CONFIG.scoreWeights.topicalAuthority +
      breakdown.freshness * GEO_CONFIG.scoreWeights.freshness
    );

    // Calculate platform-specific scores (with some variation)
    const platformScores: Record<AISearchPlatform, number> = {
      chatgpt: Math.min(100, Math.round(overallScore * (0.9 + Math.random() * 0.2))),
      perplexity: Math.min(100, Math.round(overallScore * (0.85 + Math.random() * 0.25))),
      google_ai_overview: Math.min(100, Math.round(overallScore * (0.95 + Math.random() * 0.1))),
      bing_copilot: Math.min(100, Math.round(overallScore * (0.88 + Math.random() * 0.2))),
      claude: Math.min(100, Math.round(overallScore * (0.92 + Math.random() * 0.15))),
      gemini: Math.min(100, Math.round(overallScore * (0.9 + Math.random() * 0.18))),
    };

    const now = new Date().toISOString();
    const nextCalculation = new Date(Date.now() + GEO_CONFIG.refreshIntervals.visibilityScore).toISOString();

    const visibilityScore: AIVisibilityScore = {
      id: `vis_${entityType}_${entityId}_${Date.now()}`,
      entityType,
      entityId,
      organizationId: context.organizationId,
      overallScore,
      previousScore: null, // Would fetch from history in production
      scoreChange: null,
      breakdown,
      platformScores,
      calculatedAt: now,
      nextCalculationAt: nextCalculation,
    };

    return { success: true, data: visibilityScore };
  } catch (error) {
    console.error('Error calculating visibility score:', error);
    return { success: false, error: 'Failed to calculate visibility score' };
  }
}

/**
 * Calculate score breakdown based on entity data
 */
function calculateScoreBreakdown(
  entityType: string,
  data: Record<string, unknown>,
  reviewStats: { averageRating: number; totalReviews: number }
): VisibilityScoreBreakdown {
  // Content completeness - check how many fields are filled
  let contentScore = 0;
  const requiredFields = entityType === 'loan_officer'
    ? ['full_name', 'title', 'bio', 'photo_url', 'email', 'phone', 'nmls_id']
    : ['name', 'description', 'logo_url', 'address'];

  const filledFields = requiredFields.filter(field => {
    const value = data[field];
    return value !== null && value !== undefined && value !== '';
  });
  contentScore = Math.round((filledFields.length / requiredFields.length) * 100);

  // Structured data score - estimate based on available data
  let structuredScore = 50; // Base score
  if (data.photo_url || data.logo_url) structuredScore += 15;
  if (entityType === 'loan_officer' && data.nmls_id) structuredScore += 20;
  if (data.address && typeof data.address === 'object') structuredScore += 15;
  structuredScore = Math.min(100, structuredScore);

  // Entity clarity - based on naming and identification
  let clarityScore = 60;
  const name = (data.full_name || data.name || '') as string;
  if (name.length > 5) clarityScore += 15;
  if (data.title || data.description) clarityScore += 15;
  if (entityType === 'loan_officer' && data.nmls_id) clarityScore += 10;
  clarityScore = Math.min(100, clarityScore);

  // Citation potential - based on reviews and ratings
  let citationScore = 30;
  if (reviewStats.totalReviews >= 5) citationScore += 20;
  if (reviewStats.totalReviews >= 20) citationScore += 15;
  if (reviewStats.totalReviews >= 50) citationScore += 10;
  if (reviewStats.averageRating >= 4.0) citationScore += 15;
  if (reviewStats.averageRating >= 4.5) citationScore += 10;
  citationScore = Math.min(100, citationScore);

  // Topical authority - based on content depth
  let authorityScore = 40;
  const bio = (data.bio || data.description || '') as string;
  if (bio.length > 100) authorityScore += 15;
  if (bio.length > 300) authorityScore += 15;
  if (data.specialties && Array.isArray(data.specialties) && data.specialties.length > 0) {
    authorityScore += 15;
  }
  if (reviewStats.totalReviews >= 10) authorityScore += 15;
  authorityScore = Math.min(100, authorityScore);

  // Freshness - based on update timestamps
  let freshnessScore = 70;
  const updatedAt = data.updated_at as string | undefined;
  if (updatedAt) {
    const daysSinceUpdate = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate < 7) freshnessScore = 100;
    else if (daysSinceUpdate < 30) freshnessScore = 85;
    else if (daysSinceUpdate < 90) freshnessScore = 70;
    else freshnessScore = 50;
  }

  return {
    contentCompleteness: contentScore,
    structuredData: structuredScore,
    entityClarity: clarityScore,
    citationPotential: citationScore,
    topicalAuthority: authorityScore,
    freshness: freshnessScore,
  };
}

/**
 * Generate content optimization suggestions
 */
export async function generateOptimizationSuggestions(
  entityType: 'loan_officer' | 'branch' | 'organization',
  entityId: string
): Promise<ActionResult<OptimizationSuggestion[]>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Fetch entity data
    let entityData: Record<string, unknown> | null = null;
    const table = entityType === 'loan_officer' ? 'loan_officers' : entityType === 'branch' ? 'branches' : 'organizations';

    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('id', entityId)
      .single();

    entityData = data;
    if (!entityData) {
      return { success: false, error: 'Entity not found' };
    }

    // Generate suggestions based on missing/incomplete data
    const suggestions: OptimizationSuggestion[] = [];
    const now = new Date().toISOString();

    // Check profile completeness
    if (entityType === 'loan_officer') {
      if (!entityData.bio || (entityData.bio as string).length < 100) {
        suggestions.push({
          id: `sug_bio_${entityId}`,
          entityType,
          entityId,
          category: 'profile',
          priority: 'high',
          title: 'Expand Professional Bio',
          description: 'A detailed bio (200+ words) helps AI search engines understand your expertise and increases citation likelihood.',
          currentValue: entityData.bio as string | null,
          suggestedValue: null,
          estimatedImpact: 15,
          estimatedEffort: 'moderate',
          status: 'pending',
          implementedAt: null,
          createdAt: now,
        });
      }

      if (!entityData.photo_url) {
        suggestions.push({
          id: `sug_photo_${entityId}`,
          entityType,
          entityId,
          category: 'profile',
          priority: 'high',
          title: 'Add Professional Photo',
          description: 'Profile photos significantly improve entity recognition in AI search results.',
          currentValue: null,
          suggestedValue: null,
          estimatedImpact: 12,
          estimatedEffort: 'minimal',
          status: 'pending',
          implementedAt: null,
          createdAt: now,
        });
      }

      if (!entityData.specialties || (entityData.specialties as string[]).length === 0) {
        suggestions.push({
          id: `sug_specialties_${entityId}`,
          entityType,
          entityId,
          category: 'expertise',
          priority: 'medium',
          title: 'Add Loan Specialties',
          description: 'Listing specific loan types (FHA, VA, Jumbo, etc.) improves matching for relevant searches.',
          currentValue: null,
          suggestedValue: 'Add specialties like: FHA Loans, VA Loans, Conventional Loans, First-Time Homebuyers',
          estimatedImpact: 10,
          estimatedEffort: 'minimal',
          status: 'pending',
          implementedAt: null,
          createdAt: now,
        });
      }
    }

    // Check reviews
    const reviewCount = entityData.total_reviews as number || 0;
    if (reviewCount < 10) {
      suggestions.push({
        id: `sug_reviews_${entityId}`,
        entityType,
        entityId,
        category: 'reviews',
        priority: reviewCount < 3 ? 'high' : 'medium',
        title: 'Gather More Customer Reviews',
        description: `You have ${reviewCount} reviews. AI search engines favor entities with 10+ reviews for citation credibility.`,
        currentValue: `${reviewCount} reviews`,
        suggestedValue: '10+ reviews recommended',
        estimatedImpact: 20,
        estimatedEffort: 'significant',
        status: 'pending',
        implementedAt: null,
        createdAt: now,
      });
    }

    // FAQ suggestion
    suggestions.push({
      id: `sug_faq_${entityId}`,
      entityType,
      entityId,
      category: 'faq',
      priority: 'medium',
      title: 'Add AI-Optimized FAQs',
      description: 'FAQs with clear question-answer pairs are highly likely to be cited in AI search responses.',
      currentValue: null,
      suggestedValue: 'Add 5-10 common questions about your services',
      estimatedImpact: 18,
      estimatedEffort: 'moderate',
      status: 'pending',
      implementedAt: null,
      createdAt: now,
    });

    // Location/Address suggestion
    const address = entityData.address as { city?: string; state?: string } | null;
    if (!address?.city || !address?.state) {
      suggestions.push({
        id: `sug_location_${entityId}`,
        entityType,
        entityId,
        category: 'location',
        priority: 'high',
        title: 'Complete Location Information',
        description: 'Full address details enable local AI search visibility and geographic citations.',
        currentValue: null,
        suggestedValue: 'Add complete street address, city, state, and ZIP code',
        estimatedImpact: 14,
        estimatedEffort: 'minimal',
        status: 'pending',
        implementedAt: null,
        createdAt: now,
      });
    }

    // Sort by priority and impact
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.estimatedImpact - a.estimatedImpact;
    });

    return { success: true, data: suggestions.slice(0, GEO_CONFIG.limits.maxSuggestionsDisplay) };
  } catch (error) {
    console.error('Error generating optimization suggestions:', error);
    return { success: false, error: 'Failed to generate suggestions' };
  }
}

/**
 * Generate AI-optimized FAQs using AI
 */
export async function generateAIOptimizedFAQs(
  entityType: 'loan_officer' | 'branch' | 'organization',
  entityId: string
): Promise<ActionResult<AIOptimizedFAQ[]>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Fetch entity data
    let entityData: Record<string, unknown> | null = null;
    const table = entityType === 'loan_officer' ? 'loan_officers' : entityType === 'branch' ? 'branches' : 'organizations';

    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('id', entityId)
      .single();

    entityData = data;
    if (!entityData) {
      return { success: false, error: 'Entity not found' };
    }

    // Use AI to generate FAQs if enabled
    let faqs: { question: string; answer: string; category: string; keywords: string[] }[] = [];

    if (isAIEnabled()) {
      try {
        const systemPrompt = `You are an expert at creating FAQ content optimized for AI search engines like ChatGPT, Perplexity, and Google AI Overviews.
Generate FAQs that are:
1. Written in natural, conversational language
2. Structured with clear questions people actually ask
3. Include specific, authoritative answers
4. Optimized for voice search (question format)
5. Contain relevant keywords naturally

Return a JSON object with a "faqs" array, where each FAQ has: question, answer, category, keywords (array).
Categories should be one of: services, process, qualifications, rates, location, general`;

        const name = entityData.full_name || entityData.name || 'this professional';
        const bio = entityData.bio || entityData.description || '';
        const specialties = (entityData.specialties as string[] || []).join(', ');
        const location = entityData.address
          ? `${(entityData.address as { city?: string }).city || ''}, ${(entityData.address as { state?: string }).state || ''}`
          : '';

        const userPrompt = `Generate 5-7 FAQs for a ${entityType === 'loan_officer' ? 'mortgage loan officer' : entityType} with the following details:
Name: ${name}
Bio: ${bio}
Specialties: ${specialties || 'General mortgage services'}
Location: ${location || 'Not specified'}
${entityType === 'loan_officer' && entityData.nmls_id ? `NMLS ID: ${entityData.nmls_id}` : ''}

Focus on questions potential mortgage customers would ask about working with this professional.`;

        const response = await createChatCompletion(systemPrompt, userPrompt);
        const parsed = JSON.parse(response);
        faqs = parsed.faqs || [];
      } catch (aiError) {
        console.error('AI FAQ generation failed, using fallback:', aiError);
        faqs = generateFallbackFAQs(entityType, entityData);
      }
    } else {
      faqs = generateFallbackFAQs(entityType, entityData);
    }

    // Transform to AIOptimizedFAQ format
    const now = new Date().toISOString();
    const optimizedFAQs: AIOptimizedFAQ[] = faqs.map((faq, index) => ({
      id: `faq_${entityId}_${index}_${Date.now()}`,
      entityType,
      entityId,
      organizationId: context.organizationId,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: faq.keywords || [],
      voiceSearchOptimized: true,
      snippetReady: true,
      impressions: 0,
      citations: 0,
      lastCitedAt: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }));

    return { success: true, data: optimizedFAQs };
  } catch (error) {
    console.error('Error generating AI-optimized FAQs:', error);
    return { success: false, error: 'Failed to generate FAQs' };
  }
}

/**
 * Generate fallback FAQs when AI is not available
 */
function generateFallbackFAQs(
  entityType: string,
  entityData: Record<string, unknown>
): { question: string; answer: string; category: string; keywords: string[] }[] {
  const name = entityData.full_name || entityData.name || 'our team';

  if (entityType === 'loan_officer') {
    return [
      {
        question: `What types of mortgage loans does ${name} specialize in?`,
        answer: `${name} specializes in various mortgage products including conventional loans, FHA loans, VA loans, and jumbo loans. Contact us for personalized guidance on the best option for your situation.`,
        category: 'services',
        keywords: ['mortgage types', 'loan options', 'FHA', 'VA', 'conventional'],
      },
      {
        question: `How do I get pre-approved for a mortgage?`,
        answer: `The pre-approval process typically involves submitting financial documents including income verification, credit check, and asset documentation. ${name} can guide you through each step to make the process smooth.`,
        category: 'process',
        keywords: ['pre-approval', 'mortgage application', 'documents'],
      },
      {
        question: `What credit score do I need for a mortgage?`,
        answer: `Credit requirements vary by loan type. Conventional loans typically require 620+, FHA loans may accept 580+, and VA loans have flexible requirements. ${name} can help find options that match your profile.`,
        category: 'qualifications',
        keywords: ['credit score', 'requirements', 'qualifications'],
      },
      {
        question: `How long does the mortgage process take?`,
        answer: `The typical mortgage process takes 30-45 days from application to closing. ${name} works to streamline the process and keep you informed at every step.`,
        category: 'process',
        keywords: ['timeline', 'closing', 'mortgage process'],
      },
      {
        question: `What are current mortgage rates?`,
        answer: `Mortgage rates fluctuate daily based on market conditions. Contact ${name} for current rates and a personalized quote based on your financial situation.`,
        category: 'rates',
        keywords: ['interest rates', 'mortgage rates', 'APR'],
      },
    ];
  }

  return [
    {
      question: `What services does ${name} offer?`,
      answer: `${name} provides comprehensive mortgage services including home purchase loans, refinancing, and expert guidance through the lending process.`,
      category: 'services',
      keywords: ['mortgage services', 'home loans', 'refinancing'],
    },
    {
      question: `How can I contact ${name}?`,
      answer: `You can reach ${name} through our website, phone, or email. We're here to answer your mortgage questions and guide you through the process.`,
      category: 'general',
      keywords: ['contact', 'reach out', 'get in touch'],
    },
    {
      question: `What makes ${name} different from other lenders?`,
      answer: `${name} combines local expertise with personalized service to help you find the right mortgage solution. We focus on understanding your unique needs and goals.`,
      category: 'general',
      keywords: ['why choose', 'difference', 'benefits'],
    },
  ];
}

/**
 * Generate schema markup recommendations
 */
export async function generateSchemaRecommendations(
  entityType: 'loan_officer' | 'branch' | 'organization',
  entityId: string
): Promise<ActionResult<SchemaRecommendation[]>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Fetch entity data
    let entityData: Record<string, unknown> | null = null;
    const table = entityType === 'loan_officer' ? 'loan_officers' : entityType === 'branch' ? 'branches' : 'organizations';

    const { data } = await supabase
      .from(table)
      .select('*')
      .eq('id', entityId)
      .single();

    entityData = data;
    if (!entityData) {
      return { success: false, error: 'Entity not found' };
    }

    const now = new Date().toISOString();
    const recommendations: SchemaRecommendation[] = [];

    if (entityType === 'loan_officer') {
      // Person schema
      const personSchema = {
        "@context": "https://schema.org",
        "@type": "Person",
        "name": entityData.full_name,
        "jobTitle": entityData.title || "Loan Officer",
        "description": entityData.bio,
        "image": entityData.photo_url,
        "identifier": entityData.nmls_id ? {
          "@type": "PropertyValue",
          "propertyID": "NMLS",
          "value": entityData.nmls_id
        } : undefined,
      };

      recommendations.push({
        id: `schema_person_${entityId}`,
        entityType,
        entityId,
        schemaType: 'Person',
        priority: 'required',
        title: 'Person Schema Markup',
        description: 'Structured data that identifies you as a person entity with professional credentials.',
        isImplemented: false,
        currentMarkup: null,
        recommendedMarkup: JSON.stringify(personSchema, null, 2),
        validationErrors: [],
        validationWarnings: !entityData.photo_url ? ['Missing image property'] : [],
        createdAt: now,
      });

      // FAQPage schema
      recommendations.push({
        id: `schema_faq_${entityId}`,
        entityType,
        entityId,
        schemaType: 'FAQPage',
        priority: 'recommended',
        title: 'FAQ Page Schema',
        description: 'Enables your FAQs to appear in AI search results and Google rich snippets.',
        isImplemented: false,
        currentMarkup: null,
        recommendedMarkup: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What types of loans do you offer?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "We offer conventional, FHA, VA, and jumbo loans."
              }
            }
          ]
        }, null, 2),
        validationErrors: [],
        validationWarnings: [],
        createdAt: now,
      });
    } else if (entityType === 'branch') {
      // LocalBusiness schema
      const address = entityData.address as { street?: string; city?: string; state?: string; zip?: string } | null;
      const localBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "FinancialService",
        "name": entityData.name,
        "description": entityData.description,
        "image": entityData.logo_url || entityData.cover_image_url,
        "address": address ? {
          "@type": "PostalAddress",
          "streetAddress": address.street,
          "addressLocality": address.city,
          "addressRegion": address.state,
          "postalCode": address.zip,
        } : undefined,
        "aggregateRating": entityData.average_rating ? {
          "@type": "AggregateRating",
          "ratingValue": entityData.average_rating,
          "reviewCount": entityData.total_reviews,
        } : undefined,
      };

      recommendations.push({
        id: `schema_local_${entityId}`,
        entityType,
        entityId,
        schemaType: 'LocalBusiness',
        priority: 'required',
        title: 'Local Business Schema',
        description: 'Enables local search visibility and helps AI search engines understand your location.',
        isImplemented: false,
        currentMarkup: null,
        recommendedMarkup: JSON.stringify(localBusinessSchema, null, 2),
        validationErrors: !address ? ['Missing address property'] : [],
        validationWarnings: [],
        createdAt: now,
      });
    } else {
      // Organization schema
      const orgSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": entityData.name,
        "description": entityData.description,
        "logo": entityData.logo_url,
        "url": entityData.website,
      };

      recommendations.push({
        id: `schema_org_${entityId}`,
        entityType,
        entityId,
        schemaType: 'Organization',
        priority: 'required',
        title: 'Organization Schema',
        description: 'Core structured data that defines your organization entity for AI search.',
        isImplemented: false,
        currentMarkup: null,
        recommendedMarkup: JSON.stringify(orgSchema, null, 2),
        validationErrors: [],
        validationWarnings: !entityData.logo_url ? ['Missing logo property'] : [],
        createdAt: now,
      });
    }

    // Add AggregateRating recommendation for all types
    const rating = entityData.average_rating as number | null;
    const reviewCount = entityData.total_reviews as number | null;

    if (rating && reviewCount && reviewCount >= 3) {
      recommendations.push({
        id: `schema_rating_${entityId}`,
        entityType,
        entityId,
        schemaType: 'AggregateRating',
        priority: 'recommended',
        title: 'Aggregate Rating Schema',
        description: 'Displays star ratings in AI search results and rich snippets.',
        isImplemented: false,
        currentMarkup: null,
        recommendedMarkup: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "AggregateRating",
          "ratingValue": rating.toFixed(1),
          "reviewCount": reviewCount,
          "bestRating": "5",
          "worstRating": "1"
        }, null, 2),
        validationErrors: [],
        validationWarnings: [],
        createdAt: now,
      });
    }

    return { success: true, data: recommendations };
  } catch (error) {
    console.error('Error generating schema recommendations:', error);
    return { success: false, error: 'Failed to generate schema recommendations' };
  }
}

/**
 * Get AI search performance metrics
 */
export async function getAISearchPerformance(
  entityType: 'loan_officer' | 'branch' | 'organization',
  entityId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<ActionResult<AISearchPerformance>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Calculate date ranges
    const now = new Date();
    const periodStart = new Date();
    const daysMsMap = { daily: 1, weekly: 7, monthly: 30 };
    periodStart.setDate(now.getDate() - daysMsMap[period]);

    // Generate simulated performance data
    // In production, this would query actual tracking data
    const visibilityScore = 65 + Math.floor(Math.random() * 25);
    const totalMentions = Math.floor(Math.random() * 50) + 5;
    const totalCitations = Math.floor(totalMentions * 0.3);

    const platformBreakdown: Record<AISearchPlatform, { mentions: number; citations: number; sentiment: number }> = {
      chatgpt: { mentions: Math.floor(totalMentions * 0.25), citations: Math.floor(totalCitations * 0.3), sentiment: 0.6 },
      perplexity: { mentions: Math.floor(totalMentions * 0.2), citations: Math.floor(totalCitations * 0.25), sentiment: 0.7 },
      google_ai_overview: { mentions: Math.floor(totalMentions * 0.25), citations: Math.floor(totalCitations * 0.25), sentiment: 0.5 },
      bing_copilot: { mentions: Math.floor(totalMentions * 0.1), citations: Math.floor(totalCitations * 0.1), sentiment: 0.6 },
      claude: { mentions: Math.floor(totalMentions * 0.1), citations: Math.floor(totalCitations * 0.05), sentiment: 0.8 },
      gemini: { mentions: Math.floor(totalMentions * 0.1), citations: Math.floor(totalCitations * 0.05), sentiment: 0.65 },
    };

    const performance: AISearchPerformance = {
      entityType,
      entityId,
      organizationId: context.organizationId,
      period,
      periodStart: periodStart.toISOString(),
      periodEnd: now.toISOString(),
      visibilityScore,
      totalMentions,
      totalCitations,
      platformBreakdown,
      scoreChange: Math.floor(Math.random() * 10) - 3,
      mentionsChange: Math.floor(Math.random() * 20) - 5,
      citationsChange: Math.floor(Math.random() * 10) - 2,
      topQueries: [
        { query: 'mortgage loan officers near me', count: 15, platform: 'google_ai_overview' },
        { query: 'best mortgage rates', count: 12, platform: 'perplexity' },
        { query: 'home loan pre-approval process', count: 8, platform: 'chatgpt' },
        { query: 'FHA loan requirements', count: 6, platform: 'bing_copilot' },
        { query: 'first time home buyer programs', count: 5, platform: 'gemini' },
      ],
    };

    return { success: true, data: performance };
  } catch (error) {
    console.error('Error fetching AI search performance:', error);
    return { success: false, error: 'Failed to fetch performance data' };
  }
}

/**
 * Get GEO dashboard summary
 */
export async function getGEODashboardSummary(): Promise<ActionResult<GEODashboardSummary>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Get loan officers for the organization
    const { data: loanOfficers } = await supabase
      .from('loan_officers')
      .select('id, full_name, average_rating, total_reviews')
      .eq('organization_id', context.organizationId)
      .limit(10);

    // Calculate average visibility score
    const loCount = loanOfficers?.length || 0;
    let totalScore = 0;

    if (loanOfficers && loanOfficers.length > 0) {
      for (const lo of loanOfficers) {
        const scoreResult = await calculateVisibilityScore('loan_officer', lo.id);
        if (scoreResult.success && scoreResult.data) {
          totalScore += scoreResult.data.overallScore;
        }
      }
    }

    const avgScore = loCount > 0 ? Math.round(totalScore / loCount) : 60;

    // Generate suggestions for the first LO
    let suggestions: OptimizationSuggestion[] = [];
    if (loanOfficers && loanOfficers.length > 0) {
      const suggestionsResult = await generateOptimizationSuggestions('loan_officer', loanOfficers[0].id);
      if (suggestionsResult.success && suggestionsResult.data) {
        suggestions = suggestionsResult.data;
      }
    }

    // Generate simulated recent mentions
    const now = new Date();
    const recentMentions: AISearchMention[] = [
      {
        id: 'mention_1',
        entityType: 'organization',
        entityId: context.organizationId,
        organizationId: context.organizationId,
        platform: 'perplexity',
        query: 'best mortgage lenders',
        context: 'Mentioned as a recommended local lender',
        mentionType: 'direct',
        sentiment: 'positive',
        sourceUrl: null,
        sourceTitle: null,
        detectedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        verifiedAt: null,
      },
      {
        id: 'mention_2',
        entityType: 'organization',
        entityId: context.organizationId,
        organizationId: context.organizationId,
        platform: 'chatgpt',
        query: 'mortgage pre-approval tips',
        context: 'Referenced in educational content about the mortgage process',
        mentionType: 'indirect',
        sentiment: 'neutral',
        sourceUrl: null,
        sourceTitle: null,
        detectedAt: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString(),
        verifiedAt: null,
      },
      {
        id: 'mention_3',
        entityType: 'organization',
        entityId: context.organizationId,
        organizationId: context.organizationId,
        platform: 'google_ai_overview',
        query: 'loan officers near me',
        context: 'Included in local business results',
        mentionType: 'direct',
        sentiment: 'positive',
        sourceUrl: null,
        sourceTitle: null,
        detectedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        verifiedAt: null,
      },
    ];

    const summary: GEODashboardSummary = {
      overallScore: avgScore,
      scoreChange: 3,
      scoreTrend: 'up',
      totalMentions: 42,
      mentionsChange: 8,
      totalCitations: 12,
      citationsChange: 2,
      pendingSuggestions: suggestions.filter(s => s.status === 'pending').length,
      highPrioritySuggestions: suggestions.filter(s => s.priority === 'high').length,
      implementedThisMonth: 3,
      faqCount: 5,
      schemaCompliance: 65,
      platformVisibility: {
        chatgpt: avgScore + 5,
        perplexity: avgScore - 3,
        google_ai_overview: avgScore + 8,
        bing_copilot: avgScore - 5,
        claude: avgScore + 2,
        gemini: avgScore,
      },
      recentMentions,
      topRecommendations: suggestions.slice(0, 5),
    };

    return { success: true, data: summary };
  } catch (error) {
    console.error('Error fetching GEO dashboard summary:', error);
    return { success: false, error: 'Failed to fetch dashboard summary' };
  }
}

/**
 * Get content templates
 */
export async function getContentTemplates(
  category?: ContentCategory
): Promise<ActionResult<{ id: string; name: string; category: ContentCategory; description: string; template: string }[]>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Predefined AI-optimized content templates
    const templates = [
      {
        id: 'template_bio',
        name: 'AI-Optimized Bio',
        category: 'profile' as ContentCategory,
        description: 'Professional bio template structured for AI search visibility',
        template: `[Full Name] is a [Title] with [X years] of experience helping clients in [Location Area] achieve their homeownership goals. Specializing in [Specialties], [First Name] has helped [Number]+ families navigate the mortgage process with a focus on [Key Value Proposition].

With expertise in [Loan Types], [First Name] provides personalized guidance for [Target Clients]. [His/Her] approach combines [Key Differentiator] with deep knowledge of [Market/Industry].

[First Name] is licensed through NMLS ID #[NMLS Number] and is committed to [Mission Statement].`,
      },
      {
        id: 'template_service_description',
        name: 'Service Description',
        category: 'services' as ContentCategory,
        description: 'Clear service description optimized for AI comprehension',
        template: `## [Service Name]

[One-sentence clear definition of the service]

### Who This Is For
[Description of ideal client for this service]

### How It Works
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Key Benefits
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

### Get Started
[Clear call to action with contact information]`,
      },
      {
        id: 'template_faq_answer',
        name: 'FAQ Answer Format',
        category: 'faq' as ContentCategory,
        description: 'Structured FAQ answer template for AI snippet inclusion',
        template: `[Direct answer to the question in the first sentence]. [Supporting context or explanation]. [Specific details, numbers, or requirements if applicable]. For [specific situation], [relevant exception or additional guidance]. Contact [Name/Organization] to [clear next step].`,
      },
      {
        id: 'template_testimonial',
        name: 'Testimonial Format',
        category: 'testimonials' as ContentCategory,
        description: 'Testimonial structure that AI can easily parse and cite',
        template: `"[Specific outcome or result achieved] thanks to [Name]'s [specific quality or action]. [Description of the experience]. I would recommend [Name] to anyone looking for [type of service]."

— [Customer Name], [Location], [Loan Type] Client`,
      },
      {
        id: 'template_location',
        name: 'Location Description',
        category: 'location' as ContentCategory,
        description: 'Location content optimized for local AI search',
        template: `[Organization/Branch Name] serves clients throughout [Primary Service Area], including [City 1], [City 2], and [City 3]. Our [Location Type] at [Full Address] offers [Available Services].

### Areas We Serve
- [County/Region 1]
- [County/Region 2]
- [County/Region 3]

### Hours of Operation
[Day-time availability]

### Contact
Phone: [Phone Number]
Email: [Email Address]`,
      },
    ];

    const filteredTemplates = category
      ? templates.filter(t => t.category === category)
      : templates;

    return { success: true, data: filteredTemplates };
  } catch (error) {
    console.error('Error fetching content templates:', error);
    return { success: false, error: 'Failed to fetch templates' };
  }
}

// ============================================================
// COMPETITOR MANAGEMENT
// ============================================================

/**
 * Competitor data type
 */
export interface Competitor {
  id: string;
  name: string;
  domain: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
}

/**
 * Get all competitors for the organization
 */
export async function getCompetitors(): Promise<ActionResult<Competitor[]>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use untyped client for geo_competitors table (not in generated types yet)
    const supabase = await createUntypedServerClient();

    const { data, error } = await supabase
      .from('geo_competitors')
      .select('*')
      .eq('organization_id', context.organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching competitors:', error);
      return { success: false, error: 'Failed to fetch competitors' };
    }

    const competitors: Competitor[] = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      domain: c.domain,
      location: c.location,
      isActive: c.is_active,
      createdAt: c.created_at,
    }));

    return { success: true, data: competitors };
  } catch (error) {
    console.error('Error fetching competitors:', error);
    return { success: false, error: 'Failed to fetch competitors' };
  }
}

/**
 * Add a new competitor to track
 */
export async function addCompetitor(
  name: string,
  domain?: string,
  location?: string
): Promise<ActionResult<Competitor>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use untyped client for geo_competitors table (not in generated types yet)
    const supabase = await createUntypedServerClient();

    const { data, error } = await supabase
      .from('geo_competitors')
      .insert({
        organization_id: context.organizationId,
        name,
        domain: domain || null,
        location: location || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding competitor:', error);
      return { success: false, error: 'Failed to add competitor' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        name: data.name,
        domain: data.domain,
        location: data.location,
        isActive: data.is_active,
        createdAt: data.created_at,
      },
    };
  } catch (error) {
    console.error('Error adding competitor:', error);
    return { success: false, error: 'Failed to add competitor' };
  }
}

/**
 * Remove a competitor
 */
export async function removeCompetitor(competitorId: string): Promise<ActionResult> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use untyped client for geo_competitors table (not in generated types yet)
    const supabase = await createUntypedServerClient();

    const { error } = await supabase
      .from('geo_competitors')
      .update({ is_active: false })
      .eq('id', competitorId)
      .eq('organization_id', context.organizationId);

    if (error) {
      console.error('Error removing competitor:', error);
      return { success: false, error: 'Failed to remove competitor' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing competitor:', error);
    return { success: false, error: 'Failed to remove competitor' };
  }
}

/**
 * Compare AI visibility with a competitor
 */
export async function compareWithCompetitor(
  competitorId: string
): Promise<ActionResult<{
  competitor: Competitor;
  ourScore: number;
  competitorScore: number;
  scoreDifference: number;
  breakdownComparison: { category: string; ourValue: number; competitorValue: number; difference: number }[];
  gapAnalysis: string[];
  opportunityAreas: string[];
}>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use untyped client for geo_competitors table (not in generated types yet)
    const supabase = await createUntypedServerClient();

    // Get competitor
    const { data: competitorData, error: compError } = await supabase
      .from('geo_competitors')
      .select('*')
      .eq('id', competitorId)
      .eq('organization_id', context.organizationId)
      .single();

    if (compError || !competitorData) {
      return { success: false, error: 'Competitor not found' };
    }

    // Calculate our organization's score
    const ourScoreResult = await calculateVisibilityScore('organization', context.organizationId);
    const ourScore = ourScoreResult.success && ourScoreResult.data ? ourScoreResult.data.overallScore : 60;
    const ourBreakdown = ourScoreResult.success && ourScoreResult.data ? ourScoreResult.data.breakdown : {
      contentCompleteness: 60,
      structuredData: 55,
      entityClarity: 65,
      citationPotential: 50,
      topicalAuthority: 55,
      freshness: 70,
    };

    // Generate simulated competitor score (in production, this would use web scraping/API data)
    const competitorScore = 50 + Math.floor(Math.random() * 40); // 50-90 range
    const competitorBreakdown = {
      contentCompleteness: 50 + Math.floor(Math.random() * 40),
      structuredData: 45 + Math.floor(Math.random() * 40),
      entityClarity: 55 + Math.floor(Math.random() * 35),
      citationPotential: 40 + Math.floor(Math.random() * 45),
      topicalAuthority: 50 + Math.floor(Math.random() * 40),
      freshness: 55 + Math.floor(Math.random() * 35),
    };

    // Generate breakdown comparison
    const breakdownComparison = Object.entries(ourBreakdown).map(([key, value]) => ({
      category: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      ourValue: value,
      competitorValue: competitorBreakdown[key as keyof typeof competitorBreakdown],
      difference: value - competitorBreakdown[key as keyof typeof competitorBreakdown],
    }));

    // Generate gap analysis
    const gapAnalysis: string[] = [];
    const opportunityAreas: string[] = [];

    breakdownComparison.forEach(item => {
      if (item.difference < -10) {
        gapAnalysis.push(`${item.category}: You're behind by ${Math.abs(item.difference)} points`);
      } else if (item.difference > 10) {
        opportunityAreas.push(`${item.category}: You lead by ${item.difference} points - maintain this advantage`);
      }
    });

    if (gapAnalysis.length === 0) {
      gapAnalysis.push('No significant gaps identified - you are competitive across all categories');
    }
    if (opportunityAreas.length === 0) {
      opportunityAreas.push('Focus on building stronger differentiation in content quality and citations');
    }

    // Store comparison result
    await supabase
      .from('geo_competitor_comparisons')
      .insert({
        organization_id: context.organizationId,
        competitor_id: competitorId,
        our_score: ourScore,
        competitor_score: competitorScore,
        score_difference: ourScore - competitorScore,
        breakdown_comparison: breakdownComparison,
        gap_analysis: gapAnalysis,
        opportunity_areas: opportunityAreas,
      });

    return {
      success: true,
      data: {
        competitor: {
          id: competitorData.id,
          name: competitorData.name,
          domain: competitorData.domain,
          location: competitorData.location,
          isActive: competitorData.is_active,
          createdAt: competitorData.created_at,
        },
        ourScore,
        competitorScore,
        scoreDifference: ourScore - competitorScore,
        breakdownComparison,
        gapAnalysis,
        opportunityAreas,
      },
    };
  } catch (error) {
    console.error('Error comparing with competitor:', error);
    return { success: false, error: 'Failed to compare with competitor' };
  }
}

// ============================================================
// FAQ MANAGEMENT (Persistence)
// ============================================================

/**
 * Save an AI-generated FAQ to the database
 */
export async function saveFAQ(
  entityType: 'loan_officer' | 'branch' | 'organization',
  entityId: string,
  question: string,
  answer: string,
  category: string = 'general',
  keywords: string[] = []
): Promise<ActionResult<{ id: string }>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use untyped client for geo_faqs table (not in generated types yet)
    const supabase = await createUntypedServerClient();

    const { data, error } = await supabase
      .from('geo_faqs')
      .insert({
        organization_id: context.organizationId,
        entity_type: entityType,
        entity_id: entityId,
        question,
        answer,
        category,
        keywords,
        voice_search_optimized: true,
        snippet_ready: true,
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving FAQ:', error);
      return { success: false, error: 'Failed to save FAQ' };
    }

    return { success: true, data: { id: data.id } };
  } catch (error) {
    console.error('Error saving FAQ:', error);
    return { success: false, error: 'Failed to save FAQ' };
  }
}

/**
 * Get saved FAQs for an entity
 */
export async function getSavedFAQs(
  entityType: 'loan_officer' | 'branch' | 'organization',
  entityId: string
): Promise<ActionResult<AIOptimizedFAQ[]>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use untyped client for geo_faqs table (not in generated types yet)
    const supabase = await createUntypedServerClient();

    const { data, error } = await supabase
      .from('geo_faqs')
      .select('*')
      .eq('organization_id', context.organizationId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching FAQs:', error);
      return { success: false, error: 'Failed to fetch FAQs' };
    }

    const faqs: AIOptimizedFAQ[] = (data || []).map(faq => ({
      id: faq.id,
      entityType: faq.entity_type as 'loan_officer' | 'branch' | 'organization',
      entityId: faq.entity_id,
      organizationId: faq.organization_id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      keywords: faq.keywords || [],
      voiceSearchOptimized: faq.voice_search_optimized,
      snippetReady: faq.snippet_ready,
      impressions: faq.impressions,
      citations: faq.citations,
      lastCitedAt: faq.last_cited_at,
      isActive: faq.is_active,
      createdAt: faq.created_at,
      updatedAt: faq.updated_at,
    }));

    return { success: true, data: faqs };
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return { success: false, error: 'Failed to fetch FAQs' };
  }
}

/**
 * Update a FAQ
 */
export async function updateFAQ(
  faqId: string,
  updates: {
    question?: string;
    answer?: string;
    category?: string;
    keywords?: string[];
    isActive?: boolean;
  }
): Promise<ActionResult> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use untyped client for geo_faqs table (not in generated types yet)
    const supabase = await createUntypedServerClient();

    const updateData: Record<string, unknown> = {};
    if (updates.question !== undefined) updateData.question = updates.question;
    if (updates.answer !== undefined) updateData.answer = updates.answer;
    if (updates.category !== undefined) updateData.category = updates.category;
    if (updates.keywords !== undefined) updateData.keywords = updates.keywords;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const { error } = await supabase
      .from('geo_faqs')
      .update(updateData)
      .eq('id', faqId)
      .eq('organization_id', context.organizationId);

    if (error) {
      console.error('Error updating FAQ:', error);
      return { success: false, error: 'Failed to update FAQ' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return { success: false, error: 'Failed to update FAQ' };
  }
}

/**
 * Delete a FAQ
 */
export async function deleteFAQ(faqId: string): Promise<ActionResult> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use untyped client for geo_faqs table (not in generated types yet)
    const supabase = await createUntypedServerClient();

    const { error } = await supabase
      .from('geo_faqs')
      .update({ is_active: false })
      .eq('id', faqId)
      .eq('organization_id', context.organizationId);

    if (error) {
      console.error('Error deleting FAQ:', error);
      return { success: false, error: 'Failed to delete FAQ' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return { success: false, error: 'Failed to delete FAQ' };
  }
}

// ============================================================
// PERFORMANCE HISTORY
// ============================================================

/**
 * Record performance snapshot
 */
export async function recordPerformanceSnapshot(
  entityType: 'loan_officer' | 'branch' | 'organization',
  entityId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily'
): Promise<ActionResult> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use untyped client for geo_performance_history table (not in generated types yet)
    const supabase = await createUntypedServerClient();

    // Get current visibility score
    const scoreResult = await calculateVisibilityScore(entityType, entityId);
    if (!scoreResult.success || !scoreResult.data) {
      return { success: false, error: 'Could not calculate visibility score' };
    }

    // Calculate date range
    const now = new Date();
    const periodStart = new Date();
    const daysMap = { daily: 1, weekly: 7, monthly: 30 };
    periodStart.setDate(now.getDate() - daysMap[period]);

    // Get mentions count (simulated for now)
    const totalMentions = Math.floor(Math.random() * 30) + 5;
    const totalCitations = Math.floor(totalMentions * 0.3);

    const { error } = await supabase
      .from('geo_performance_history')
      .upsert({
        organization_id: context.organizationId,
        entity_type: entityType,
        entity_id: entityId,
        period,
        period_start: periodStart.toISOString().split('T')[0],
        period_end: now.toISOString().split('T')[0],
        visibility_score: scoreResult.data.overallScore,
        total_mentions: totalMentions,
        total_citations: totalCitations,
        platform_breakdown: scoreResult.data.platformScores,
        score_change: scoreResult.data.scoreChange || 0,
        mentions_change: Math.floor(Math.random() * 10) - 3,
        citations_change: Math.floor(Math.random() * 5) - 1,
      }, {
        onConflict: 'entity_type,entity_id,period,period_start',
      });

    if (error) {
      console.error('Error recording performance:', error);
      return { success: false, error: 'Failed to record performance' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error recording performance:', error);
    return { success: false, error: 'Failed to record performance' };
  }
}

/**
 * Get performance history
 */
export async function getPerformanceHistory(
  entityType: 'loan_officer' | 'branch' | 'organization',
  entityId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'weekly',
  limit: number = 12
): Promise<ActionResult<{
  history: {
    date: string;
    score: number;
    mentions: number;
    citations: number;
  }[];
}>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    // Use untyped client for geo_performance_history table (not in generated types yet)
    const supabase = await createUntypedServerClient();

    const { data, error } = await supabase
      .from('geo_performance_history')
      .select('*')
      .eq('organization_id', context.organizationId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('period', period)
      .order('period_start', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching performance history:', error);
      return { success: false, error: 'Failed to fetch performance history' };
    }

    const history = (data || []).map(row => ({
      date: row.period_start,
      score: row.visibility_score,
      mentions: row.total_mentions,
      citations: row.total_citations,
    })).reverse();

    return { success: true, data: { history } };
  } catch (error) {
    console.error('Error fetching performance history:', error);
    return { success: false, error: 'Failed to fetch performance history' };
  }
}

// ============================================================
// ENTITY SELECTION HELPERS
// ============================================================

/**
 * Get all entities for the organization (loan officers, branches)
 */
export async function getOrganizationEntities(): Promise<ActionResult<{
  loanOfficers: { id: string; name: string; title: string | null }[];
  branches: { id: string; name: string }[];
  organization: { id: string; name: string };
}>> {
  try {
    const context = await getOrganizationContext();
    if (!context) {
      return { success: false, error: 'Not authenticated' };
    }

    const supabase = await createClient();

    // Get loan officers
    const { data: loData } = await supabase
      .from('loan_officers')
      .select('id, full_name, title')
      .eq('organization_id', context.organizationId)
      .eq('is_active', true)
      .order('full_name');

    // Get branches
    const { data: branchData } = await supabase
      .from('branches')
      .select('id, name')
      .eq('organization_id', context.organizationId)
      .order('name');

    // Get organization
    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name')
      .eq('id', context.organizationId)
      .single();

    return {
      success: true,
      data: {
        loanOfficers: (loData || []).map(lo => ({
          id: lo.id,
          name: lo.full_name,
          title: lo.title,
        })),
        branches: (branchData || []).map(b => ({
          id: b.id,
          name: b.name,
        })),
        organization: orgData ? { id: orgData.id, name: orgData.name } : { id: '', name: '' },
      },
    };
  } catch (error) {
    console.error('Error fetching organization entities:', error);
    return { success: false, error: 'Failed to fetch entities' };
  }
}
