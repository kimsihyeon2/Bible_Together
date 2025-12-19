
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthTrigger() {
    console.log('--- Step 2: Auth Trigger Verification ---');

    // We already created 'testuser_auto@example.com'. Let's check if it has a profile.
    // 1. Get User ID from Auth (login to get ID, or if we saved it)
    const email = 'testuser_auto@example.com';
    const password = 'TestPass123!';

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) {
        console.error('Login failed:', authError.message);
        return;
    }

    const userId = authData.user.id;
    console.log(`Logged in as: ${email} (${userId})`);

    // 2. Check public.profiles
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error('❌ Profile lookup failed:', profileError.message);
        console.error('   -> Trigger likely FAILED to run on signup.');
    } else {
        console.log('✅ Profile found!', profile);
        console.log('   -> Trigger worked correctly (or profile was created manually).');
    }
}

checkAuthTrigger();
