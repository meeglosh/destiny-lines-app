
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://hbozjbhfpxsiazkbdkqr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhib3pqYmhmcHhzaWF6a2Jka3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MzQwMzMsImV4cCI6MjA3NzQxMDAzM30.tcrzVU6j7saMqNlGkvw3RCApSA49HkZ7CHWZpuTWflU';

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
