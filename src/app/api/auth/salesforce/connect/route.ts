import { NextResponse } from 'next/server';
import { initiateSalesforceOAuth } from '@/lib/salesforce';

export async function GET() {
  const result = await initiateSalesforceOAuth();

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  // Redirect to Salesforce OAuth
  return NextResponse.redirect(result.data!.url);
}
