import { NextResponse } from 'next/server';

/**
 * Direct client/API Razorpay order creation is permanently disabled.
 * The website only receives razorpayOrderId and razorpayKeyId from the Supabase Edge Function 'checkout'.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: 'Direct Razorpay order creation is disabled. The checkout Edge Function handles Razorpay order creation.',
    },
    { status: 410 }
  );
}
