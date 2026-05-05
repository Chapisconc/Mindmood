import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://zeqbaahbmrkqcfzkylxf.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_xvUl8YiMKK2hE355AzacZg_B97QZui2';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.auth.signUp({
    email: 'm@m.com',
    password: 'mmmmmm',
  });
  console.log('Result:', { data, error });
}

main();
