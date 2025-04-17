
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wbptvnuyhgstaaufzysh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHR2bnV5aGdzdGFhdWZ6eXNoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ2MjQyNTEsImV4cCI6MjA1MDIwMDI1MX0.-wzEsrbHLbcbfe3xdMixrbCH-KVtcf0TOnrwyWK6paA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage, // Store session in localStorage
    persistSession: true,  // Persist session
    autoRefreshToken: true // Automatically refresh token
  }
});
