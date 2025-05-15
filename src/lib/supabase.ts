import { PUBLIC_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_ANON_KEY);
