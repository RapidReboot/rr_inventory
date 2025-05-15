import { createClient } from '@supabase/supabase-js';

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL || '';
const PUBLIC_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '';

if (!PUBLIC_SUPABASE_URL || !PUBLIC_ANON_KEY) {
  console.error('Supabase environment variables are missing.');
}

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_ANON_KEY);
