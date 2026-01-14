import { NextRequest, NextResponse } from 'next/server';
import { handleGoogleOAuthCallback, syncGoogleReviews } from '@/lib/google';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Handle OAuth errors
  if (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?google_error=${encodeURIComponent(error)}`
    );
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?google_error=${encodeURIComponent('Missing OAuth parameters')}`
    );
  }

  // Handle the callback
  const result = await handleGoogleOAuthCallback(code, state);

  if (!result.success) {
    return NextResponse.redirect(
      `${appUrl}/dashboard/settings?google_error=${encodeURIComponent(result.error || 'Authentication failed')}`
    );
  }

  // Trigger initial sync in background (fire and forget)
  syncGoogleReviews(result.data!.connectionId, 'full').catch((err) => {
    console.error('Initial sync failed:', err);
  });

  // Redirect to settings with success message
  return NextResponse.redirect(
    `${appUrl}/dashboard/settings?google_success=true&connection_id=${result.data!.connectionId}`
  );
}
