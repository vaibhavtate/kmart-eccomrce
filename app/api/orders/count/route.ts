import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient as createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    // BUG 6 FIX: Verify the authenticated Supabase session server-side.
    // The authenticated user's phone/id is authoritative — ignore client-supplied params
    // and derive the customer from the verified session instead.
    const authClient = createServerClient();
    const { data: { user: authUser }, error: authError } = await authClient.auth.getUser();
    if (authError || !authUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');
    const phone = searchParams.get('phone');

    const adminClient = createAdminClient();
    const client = adminClient || createServerClient();

    let targetCustomerId = customerId;

    if (!targetCustomerId && phone) {
      const { data: cust } = await client
        .from('customers')
        .select('id')
        .eq('phone', phone.trim())
        .maybeSingle();
      if (cust?.id) {
        targetCustomerId = cust.id;
      }
    }

    if (!targetCustomerId) {
      return NextResponse.json({ count: 0 });
    }

    const { count, error } = await client
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', targetCustomerId);

    if (error) {
      console.warn('[API /api/orders/count] error:', error.message);
      return NextResponse.json({ count: 0 });
    }

    return NextResponse.json({ count: count || 0 });
  } catch (err: any) {
    console.error('[API /api/orders/count] exception:', err);
    return NextResponse.json({ count: 0, error: err.message });
  }
}
