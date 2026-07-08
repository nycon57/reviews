import { NextRequest, NextResponse } from 'next/server';
import { handleSalesforceOAuthCallback, syncSalesforceData } from '@/lib/salesforce';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle OAuth errors
  if (error) {
    console.error('Salesforce OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${appUrl}/dashboard/organization?tab=integrations&salesforce_error=${encodeURIComponent(
        errorDescription || error
      )}`
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/organization?tab=integrations&salesforce_error=${encodeURIComponent(
        'Missing OAuth parameters'
      )}`
    );
  }

  // Handle the callback
  const result = await handleSalesforceOAuthCallback(code, state);

  if (!result.success) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/organization?tab=integrations&salesforce_error=${encodeURIComponent(
        result.error || 'Authentication failed'
      )}`
    );
  }

  // Trigger initial sync in background (fire and forget)
  syncSalesforceData(result.data!.connectionId, 'full').catch((err) => {
    console.error('Initial Salesforce sync failed:', err);
  });

  // Redirect to settings with success message
  return NextResponse.redirect(
    `${appUrl}/dashboard/organization?tab=integrations&salesforce_success=true&connection_id=${result.data!.connectionId}`
  );
}
