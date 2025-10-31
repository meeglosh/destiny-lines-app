import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://hbozjbhfpxsiazkbdkqr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhib3pqYmhmcHhzaWF6a2Jka3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MzQwMzMsImV4cCI6MjA3NzQxMDAzM30.tcrzVU6j7saMqNlGkvw3RCApSA49HkZ7CHWZpuTWflU";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
