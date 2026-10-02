import { supabase, createClient } from "./client";

/**
 * Returns the unified singleton browser client instance.
 * Ensures auth and database services share identical in-memory session state.
 */
export function createSupabaseBrowserClient() {
  return supabase;
}

export { createClient };
