import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyblwsouxbpqehhzmfkp.supabase.co';
const supabaseAnonKey = 'sb_publishable_lLFscdw3qvfytbqHFGETVA_XSA9AkQZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
