import { config } from 'dotenv';
config();

import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: PUBLIC_ANON_URL or PUBLIC_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
