import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://cthfnflyccdogaxsysxl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0aGZuZmx5Y2Nkb2dheHN5c3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzUyNDgsImV4cCI6MjA4ODIxMTI0OH0.rof6IEPKmPJrZ-oWWncHevLoxDndZikFlIYMHzwnf2M';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
