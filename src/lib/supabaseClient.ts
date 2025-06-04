import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase'; // We will create this type file

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or anon key is missing from environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
