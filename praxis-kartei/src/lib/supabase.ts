import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** Ohne Zugangsdaten läuft die App im DEMO-Modus (Fantasiedaten im Browser). */
export const DEMO = !url || !key;

export const supabase: SupabaseClient | null = DEMO
  ? null
  : createClient(url!, key!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
