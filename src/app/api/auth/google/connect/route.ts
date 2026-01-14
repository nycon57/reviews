import { NextRequest, NextResponse } from 'next/server';
import { initiateGoogleOAuth } from '@/lib/google';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const loanOfficerId = searchParams.get('loan_officer_id') || undefined;

  const result = await initiateGoogleOAuth(loanOfficerId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  // Redirect to Google OAuth
  return NextResponse.redirect(result.data!.url);
}
