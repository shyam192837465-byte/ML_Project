import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyblwsouxbpqehhzmfkp.supabase.co';
const supabaseAnonKey = 'sb_publishable_lLFscdw3qvfytbqHFGETVA_XSA9AkQZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing OAuth...");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google'
  });
  if (error) {
    console.error("OAuth Error:", error);
  } else {
    console.log("OAuth Success:", data);
  }
}

test();
