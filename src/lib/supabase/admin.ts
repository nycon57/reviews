import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Admin client with service role key - use only on server side
// This bypasses RLS policies
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/** Convenience alias for the return type of createUntypedAdminClient */
export type UntypedSupabaseClient = ReturnType<typeof createUntypedAdminClient>;

// Untyped admin client for new tables not yet in the generated types
// This is used for tables like notifications that are added via migrations
export function createUntypedAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
