import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

function cleanEnv(val: string | undefined): string | undefined {
  if (val == null) return undefined;
  const cleaned = val.replace(/^\uFEFF/, "").replace(/\u200b/g, "").trim();
  return cleaned.length > 0 ? cleaned : undefined;
}

/** Lazy client — createClient("") throws at import time and crash-loops Fly when secrets are missing. */
export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL);
  const supabaseServiceKey = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Supabase is not configured — set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY on Fly"
    );
  }
  cached = createClient(supabaseUrl, supabaseServiceKey);
  return cached;
}

export const ECG_BUCKET = "ecg-uploads";
