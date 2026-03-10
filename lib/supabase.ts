import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Support both new and old Supabase API key formats
// New format: sb_publishable_*, sb_secret_*
// Old format: anon, service_role
const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use publishable key if available (new format), otherwise fall back to anon key (old format)
const clientKey = publishableKey || anonKey;
// Use secret key if available (new format), otherwise fall back to service role key (old format)
const serverKey = secretKey || serviceRoleKey;

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}

if (!clientKey) {
  throw new Error('Missing Supabase client key. Set either SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (!serverKey) {
  throw new Error('Missing Supabase server key. Set either SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY');
}

// Client-side Supabase client for reads (e.g., library view)
export const supabaseAnon = createClient(supabaseUrl, clientKey);

// Server-side Supabase client with elevated privileges for writes (API routes only)
export const supabaseService = createClient(supabaseUrl, serverKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
