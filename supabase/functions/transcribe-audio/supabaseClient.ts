
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Re-export any other utilities that might be needed
export { createSupabaseClient, corsHeaders } from './utils/clientUtils.ts';
