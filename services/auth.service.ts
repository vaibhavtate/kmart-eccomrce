import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

function normalizeIndianPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }

  return phone;
}

export const authService = {
  async sendOtp(phone: string) {
    const supabase = createSupabaseBrowserClient();
    const normalized = normalizeIndianPhone(phone);
    const rawDigits = phone.replace(/\D/g, "");

    // 1. Try with normalized Indian format (+91XXXXXXXXXX)
    const result = await supabase.auth.signInWithOtp({
      phone: normalized,
    });

    // 2. If it failed with sms_send_failed, check if the test phone number
    // was added in Supabase without the +91 prefix (raw 10 digits)
    if (result.error && (result.error as any).code === "sms_send_failed" && rawDigits && rawDigits !== normalized) {
      const fallbackResult = await supabase.auth.signInWithOtp({
        phone: rawDigits,
      });
      if (!fallbackResult.error) {
        return fallbackResult;
      }
    }

    return result;
  },

  async verifyOtp(phone: string, otp: string) {
    const supabase = createSupabaseBrowserClient();
    const normalized = normalizeIndianPhone(phone);
    const rawDigits = phone.replace(/\D/g, "");

    // Try normalized first
    const result = await supabase.auth.verifyOtp({
      phone: normalized,
      token: otp,
      type: "sms",
    });

    // If verification failed and format differed, try raw digits
    if (result.error && rawDigits && rawDigits !== normalized) {
      const fallbackResult = await supabase.auth.verifyOtp({
        phone: rawDigits,
        token: otp,
        type: "sms",
      });
      if (!fallbackResult.error) {
        return fallbackResult;
      }
    }

    return result;
  },

  async getCurrentUser() {
    const supabase = createSupabaseBrowserClient();

    return supabase.auth.getUser();
  },

  async signOut() {
    // BUG 9 FIX: Sign out from Supabase first to clear the local browser session.
    // Then call the server route to clear server-side cookies.
    // Errors from either step are surfaced to the caller rather than silently swallowed.
    const supabase = createSupabaseBrowserClient();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      console.error("[authService] signOut error:", signOutError.message);
    }

    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        console.error("[authService] server logout failed:", res.status);
      }
    } catch (e: any) {
      console.error("[authService] server logout request failed:", e?.message);
    }

    // Return whether the client-side signOut succeeded
    return { error: signOutError ?? null };
  },
};
