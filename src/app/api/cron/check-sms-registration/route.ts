import { NextRequest, NextResponse } from 'next/server';
import { createUntypedAdminClient } from '@/lib/supabase/admin';
import { checkRegistrationStatus } from '@/lib/sms/registration/twilio-a2p';

/**
 * Cron job: Check 10DLC registration status for all pending organizations.
 * Should run hourly to detect brand/campaign approval or rejection from Twilio.
 */

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret && process.env.NODE_ENV === 'development') {
    return true;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createUntypedAdminClient();

  // Find all orgs with pending registrations
  const { data: pendingOrgs, error: fetchError } = await supabase
    .from('sms_settings')
    .select('organization_id, a2p_brand_id, a2p_campaign_id, messaging_service_sid, registration_status')
    .in('registration_status', ['brand_pending', 'campaign_pending']);

  if (fetchError) {
    console.error('Failed to fetch pending registrations:', fetchError);
    return NextResponse.json({ error: 'Failed to fetch pending registrations' }, { status: 500 });
  }

  if (!pendingOrgs || pendingOrgs.length === 0) {
    return NextResponse.json({ message: 'No pending registrations', checked: 0 });
  }

  const results: {
    organizationId: string;
    previousStatus: string;
    newStatus: string;
    updated: boolean;
  }[] = [];

  for (const org of pendingOrgs) {
    try {
      const status = await checkRegistrationStatus(
        org.organization_id,
        org.a2p_brand_id,
        org.a2p_campaign_id,
        org.messaging_service_sid
      );

      let newStatus = org.registration_status;
      const updateFields: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (status.brandStatus === 'approved' || status.brandStatus === 'APPROVED') {
        if (status.campaignStatus === 'VERIFIED' || status.campaignStatus === 'approved') {
          newStatus = 'fully_registered';
        } else if (org.a2p_campaign_id) {
          if (status.campaignStatus === 'FAILED' || status.campaignStatus === 'rejected') {
            newStatus = 'rejected';
            updateFields.campaign_failure_reason = status.campaignFailureReason;
          } else {
            newStatus = 'campaign_pending';
          }
        } else {
          newStatus = 'brand_approved';
        }
      } else if (status.brandStatus === 'FAILED' || status.brandStatus === 'rejected') {
        newStatus = 'rejected';
        updateFields.brand_failure_reason = status.brandFailureReason;
      }

      const updated = newStatus !== org.registration_status;
      if (updated) {
        updateFields.registration_status = newStatus;
        await supabase
          .from('sms_settings')
          .update(updateFields)
          .eq('organization_id', org.organization_id);
      }

      results.push({
        organizationId: org.organization_id,
        previousStatus: org.registration_status,
        newStatus,
        updated,
      });
    } catch (error) {
      console.error(`Failed to check registration for org ${org.organization_id}:`, error);
      results.push({
        organizationId: org.organization_id,
        previousStatus: org.registration_status,
        newStatus: org.registration_status,
        updated: false,
      });
    }
  }

  const updatedCount = results.filter((r) => r.updated).length;

  return NextResponse.json({
    message: `Checked ${results.length} registrations, ${updatedCount} updated`,
    checked: results.length,
    updated: updatedCount,
    results,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
