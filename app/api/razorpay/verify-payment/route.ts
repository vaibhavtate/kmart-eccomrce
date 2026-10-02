import { NextResponse } from 'next/server';

/**
 * Direct client/API payment verification is permanently disabled.
 * Payment verification is handled securely on the server via Supabase webhooks.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Direct payment verification is disabled. Payments are verified via Supabase webhook.',
    },
    { status: 410 }
  );
}
