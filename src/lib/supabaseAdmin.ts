import { createClient } from "@supabase/supabase-js";

// Ensure this only runs on the server (security)
if (typeof window !== "undefined") {
  throw new Error("supabaseAdmin should never be imported client-side");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Validate env vars at startup
if (!supabaseUrl) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
if (!supabaseServiceRoleKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
