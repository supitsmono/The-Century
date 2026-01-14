/**
 * Supabase Client for Frontend
 * 
 * Initializes Supabase client for client-side Storage uploads.
 * Uses anon key (public) - Storage policies enforce security.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const bucketName = import.meta.env.VITE_SUPABASE_BUCKET || 'capsules';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase not configured. VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY required for media uploads.');
}

// Create Supabase client with anon key (used for Storage uploads)
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Export bucket name (default: 'capsules')
export { bucketName };