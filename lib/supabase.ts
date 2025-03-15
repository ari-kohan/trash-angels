import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// Replace with your Supabase URL and anon key
const supabaseUrl = 'https://ppuvkkldkgfgooafpnkc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdXZra2xka2dmZ29vYWZwbmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5NzM4NjgsImV4cCI6MjA1NzU0OTg2OH0.0Uy2TKmECDoS82fsl6qUySLrfjZ86IYjrMpgdQvO-eQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
