import { createClient } from '@supabase/supabase-js';
import { ENV } from './env.js';

let supabase = null;

const supabaseKey = ENV.SUPABASE_SERVICE_ROLE_KEY || ENV.SUPABASE_ANON_KEY;

if (ENV.SUPABASE_URL && supabaseKey && !ENV.SUPABASE_URL.includes('your-project')) {
  try {
    supabase = createClient(ENV.SUPABASE_URL, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    console.log('[Database] Supabase client initialized successfully.');
  } catch (err) {
    console.warn('[Database] Failed to initialize Supabase, switching to local store:', err.message);
  }
} else {
  console.log('[Database] Supabase credentials not set or placeholder detected. Operating with resilient in-memory local data store.');
}

export { supabase };
