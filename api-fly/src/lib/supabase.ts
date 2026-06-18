import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("[api-fly] Supabase env missing — uploads will fail until NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.");
}

export const supabaseAdmin = createClient(supabaseUrl ?? "", supabaseServiceKey ?? "");

export const ECG_BUCKET = "ecg-uploads";
