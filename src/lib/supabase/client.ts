import { createBrowserClient } from "@supabase/ssr";
import type { DatabaseWithoutInternals } from "@/types/database.types";

export function createClient() {
  return createBrowserClient<DatabaseWithoutInternals>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
