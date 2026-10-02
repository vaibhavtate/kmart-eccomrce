import { supabase } from '../lib/supabase/client';
import { DbCustomer } from '../types/database';

export const customerService = {
  /**
   * Look up or insert customer by phone number and auth_user_id
   */
  async upsertCustomer(
    phone: string,
    name?: string,
    email?: string,
    authUserId?: string
  ): Promise<DbCustomer | null> {
    if (!phone) return null;
    const cleanPhone = phone.trim();

    // If authUserId wasn't passed, try to get from current Supabase session
    let resolvedAuthId = authUserId;
    if (!resolvedAuthId) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        resolvedAuthId = user?.id;
      } catch {
        // ignore
      }
    }

    try {
      // 1. Try to find existing customer by auth_user_id or phone
      let existing: DbCustomer | null = null;
      if (resolvedAuthId) {
        const { data: byAuth } = await supabase
          .from('customers')
          .select('*')
          .eq('auth_user_id', resolvedAuthId)
          .maybeSingle();
        if (byAuth) existing = byAuth;
      }

      if (!existing) {
        const { data: byPhone, error: findError } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (findError) {
          console.warn('[customerService] find error:', findError.message);
        }
        if (byPhone) existing = byPhone;
      }

      if (existing) {
        // Update name, email, or auth_user_id if missing
        const updatePayload: Record<string, any> = {};
        if (name && !existing.name) updatePayload.name = name;
        if (email && !existing.email) updatePayload.email = email;
        if (resolvedAuthId && !existing.auth_user_id) updatePayload.auth_user_id = resolvedAuthId;

        if (Object.keys(updatePayload).length > 0) {
          const { data: updated, error: updErr } = await supabase
            .from('customers')
            .update(updatePayload)
            .eq('id', existing.id)
            .select()
            .single();

          if (!updErr && updated) {
            return updated;
          }
        }
        return existing;
      }

      // 2. Insert new customer with auth_user_id
      const insertPayload: Record<string, any> = {
        phone: cleanPhone,
        name: name || null,
        email: email || null,
      };
      if (resolvedAuthId) {
        insertPayload.auth_user_id = resolvedAuthId;
      }

      const { data: created, error: insertError } = await supabase
        .from('customers')
        .insert(insertPayload)
        .select()
        .single();

      if (insertError) {
        console.warn('[customerService] client insert blocked (expected under RLS):', insertError.message);

        // The DB trigger should have already created the row on OTP login.
        // Wait briefly and retry the lookup before giving up.
        await new Promise(r => setTimeout(r, 600));

        if (resolvedAuthId) {
          const { data: retryAuth } = await supabase
            .from('customers')
            .select('*')
            .eq('auth_user_id', resolvedAuthId)
            .maybeSingle();
          if (retryAuth) return retryAuth;
        }
        const { data: retryPhone } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', cleanPhone)
          .maybeSingle();
        if (retryPhone) return retryPhone;

        // Last resort: ask the server route (service-role key bypasses RLS)
        if (typeof window !== 'undefined') {
          try {
            const res = await fetch('/api/customers/ensure', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: cleanPhone, name, email, authUserId: resolvedAuthId }),
            });
            if (res.ok) {
              const json = await res.json();
              if (json.customer) return json.customer as DbCustomer;
            }
          } catch (apiErr) {
            console.warn('[customerService] /api/customers/ensure failed:', apiErr);
          }
        }

        return null;
      }

      return created;
    } catch (err: any) {
      console.warn('[customerService] exception:', err?.message);
      return null;
    }
  },

  /**
   * Update customer profile name, email in DB
   */
  async updateProfile(
    customerId: string,
    data: { name?: string; email?: string }
  ): Promise<DbCustomer | null> {
    if (!customerId) return null;
    try {
      const updatePayload: Record<string, any> = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.email !== undefined) updatePayload.email = data.email;

      const { data: updated, error } = await supabase
        .from('customers')
        .update(updatePayload)
        .eq('id', customerId)
        .select()
        .single();

      if (error) {
        console.warn('[customerService] updateProfile error:', error.message);
        return null;
      }
      return updated;
    } catch (err: any) {
      console.warn('[customerService] updateProfile exception:', err?.message);
      return null;
    }
  },

  /**
   * Fetch customer order count to determine free delivery eligibility
   */
  async getCustomerOrderCount(customerId?: string, phone?: string): Promise<number> {
    if (!customerId && !phone) return 0;
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams();
        if (customerId) params.append('customerId', customerId);
        if (phone) params.append('phone', phone);
        const res = await fetch(`/api/orders/count?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (typeof data.count === 'number') {
            return data.count;
          }
        }
      }
    } catch (err) {
      console.warn('[customerService] api order count fetch error:', err);
    }

    if (!customerId) return 0;

    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customerId);

      if (error) {
        console.warn('[customerService] getCustomerOrderCount error:', error.message);
        return 0;
      }
      return count || 0;
    } catch {
      return 0;
    }
  },
};
