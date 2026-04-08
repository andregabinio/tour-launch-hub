import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://gkwctcpynyxfyhivjitk.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrd2N0Y3B5bnl4ZnloaXZqaXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NzQ3NzEsImV4cCI6MjA5MTE1MDc3MX0.SmxhYcDNqNfNpyBmmiSg-1T9bUW2QINc9noWXg1ivOg";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});