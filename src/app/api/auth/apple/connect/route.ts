import { NextRequest, NextResponse } from 'next/server';
import { initiateAppleOAuth } from '@/lib/apple';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const loanOfficerId = searchParams.get('loan_officer_id') || undefined;

  const result = await initiateAppleOAuth(loanOfficerId);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error },
      { status: 400 }
    );
  }

  // Redirect to Apple Business Connect OAuth
  return NextResponse.redirect(result.data!.url);
}
