import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gyblwsouxbpqehhzmfkp.supabase.co';
const supabaseAnonKey = 'sb_publishable_lLFscdw3qvfytbqHFGETVA_XSA9AkQZ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log("Testing Signup...");
  const { data, error } = await supabase.auth.signUp({
    email: 'test' + Date.now() + '@example.com',
    password: 'password123!'
  });
  if (error) {
    console.error("Signup Error:", error);
  } else {
    console.log("Signup Success:", data);
  }
}

test();
