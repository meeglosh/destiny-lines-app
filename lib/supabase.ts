
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://zbgjgfvssyfkxnfkpyfd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpiZ2pnZnZzc3lma3huZmtweWZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTkxNTQsImV4cCI6MjA5ODkzNTE1NH0.giVR_B4ajPlcst-4S1_cIWmQ2iZqdUsC-XIL7xbUTX0';

if (!SUPABASE_URL) {
  throw new Error('Missing Supabase URL');
}

if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase Anon Key');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
