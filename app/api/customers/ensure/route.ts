import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

/**
 * POST /api/customers/ensure
 *
 * Creates or fetches a customer row using the service-role key (bypasses RLS).
 * Called as a last resort when:
 *   - The DB trigger didn't fire in time (race condition on very first OTP login)
 *   - The browser's anon-key INSERT was blocked by RLS
 *
 * The trigger (handle_new_customer → on_auth_user_created_customer) handles
 * the normal case. This route is the safety net for that race window.
 *
 * BUG 6 FIX: The authUserId is now always taken from the verified server-side
 * Supabase session rather than trusting the client-supplied body value.
 * Unauthenticated requests are rejected with 401.
 */
export async function POST(req: Request) {
  try {
    // BUG 6 FIX: Verify session server-side. Never trust the client-supplied authUserId.
    const authClient = createServerClient();
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, name, email } = await req.json();

    if (!phone) {
      return NextResponse.json({ success: false, error: 'phone is required' }, { status: 400 });
    }

    const cleanPhone = String(phone).trim();
    // Use the authenticated user's ID from the verified session — not from the request body
    const verifiedAuthUserId = authUser.id;

    const client = createAdminClient() || createServerClient();

    // 1. Try to find existing customer
    let customer = null;

    const { data: byAuth } = await client
      .from('customers')
      .select('*')
      .eq('auth_user_id', verifiedAuthUserId)
      .maybeSingle();
    if (byAuth) customer = byAuth;

    if (!customer) {
      const { data: byPhone } = await client
        .from('customers')
        .select('*')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (byPhone) customer = byPhone;
    }

    if (customer) {
      // Backfill auth_user_id if missing
      if (!customer.auth_user_id) {
        const { data: updated } = await client
          .from('customers')
          .update({ auth_user_id: verifiedAuthUserId })
          .eq('id', customer.id)
          .select()
          .single();
        if (updated) customer = updated;
      }
      return NextResponse.json({ success: true, customer });
    }

    // 2. Create the customer (service-role bypasses RLS)
    const { data: created, error } = await client
      .from('customers')
      .insert({
        phone: cleanPhone,
        name: name || null,
        email: email || null,
        auth_user_id: verifiedAuthUserId,
      })
      .select()
      .single();

    if (error) {
      console.error('[/api/customers/ensure] insert error:', error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, customer: created });
  } catch (err: any) {
    console.error('[/api/customers/ensure] unhandled error:', err?.message);
    return NextResponse.json({ success: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}
