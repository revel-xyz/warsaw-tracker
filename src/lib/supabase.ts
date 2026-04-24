import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dvimzlfcqzphngjpdgmw.supabase.co';
const supabaseKey = 'sb_publishable_7ya5yBmaiti9fMgC-PZrBA_zD_grIBq';

export const supabase = createClient(supabaseUrl, supabaseKey);
