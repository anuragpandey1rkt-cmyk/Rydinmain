import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ylyxhdlncslvqdkhzohs.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlseXhoZGxuY3NsdnFka2h6b2hzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzc5OTYsImV4cCI6MjA4MzcxMzk5Nn0.0aojeH-5LFapXOVJbpAkrHFM2_zDosGI_wI9fws8wEM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
