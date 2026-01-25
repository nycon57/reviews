import { NextRequest, NextResponse } from 'next/server';
import { initiateGoogleOAuth } from '@/lib/google';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('user_id') || undefined;

  const result = await initiateGoogleOAuth(userId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  // Redirect to Google OAuth
  return NextResponse.redirect(result.data!.url);
}
