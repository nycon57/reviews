import { NextRequest, NextResponse } from 'next/server';
import { handleSocialOAuthCallback } from '@/lib/social/actions';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectBase = `${appUrl}/dashboard/organization?tab=integrations`;

  // Handle OAuth errors
  if (error) {
    console.error('Facebook OAuth error:', error, errorDescription);
    return NextResponse.redirect(
      `${redirectBase}&error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      `${redirectBase}&error=${encodeURIComponent('Missing OAuth parameters')}`
    );
  }

  // Handle the callback
  const result = await handleSocialOAuthCallback('facebook', code, state);

  if (!result.success) {
    return NextResponse.redirect(
      `${redirectBase}&error=${encodeURIComponent(result.error || 'Authentication failed')}`
    );
  }

  // Check if page selection is needed
  if (result.data?.needsPageSelection && result.data?.pages) {
    const pagesParam = encodeURIComponent(JSON.stringify(result.data.pages));
    return NextResponse.redirect(
      `${redirectBase}&select_page=facebook&connection_id=${result.data.connectionId}&pages=${pagesParam}`
    );
  }

  // Redirect to settings with success message
  return NextResponse.redirect(
    `${redirectBase}&success=facebook&connection_id=${result.data!.connectionId}`
  );
}
