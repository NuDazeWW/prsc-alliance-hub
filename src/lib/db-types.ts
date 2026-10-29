import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/** Typed Supabase client (user-scoped or service-role) shared by server helpers. */
export type DbClient = SupabaseClient<Database>;
