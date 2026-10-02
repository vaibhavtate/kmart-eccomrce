import { NextResponse } from 'next/server';

/**
 * Direct client/API order creation is permanently disabled.
 * All orders must be placed exclusively through the Supabase Edge Function 'checkout'.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: 'Direct order creation is disabled. All orders must be placed via the Supabase Edge Function checkout.',
    },
    { status: 410 }
  );
}
