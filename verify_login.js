
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLogin() {
    const email = 'testuser@example.com';
    const password = 'TestPass123!';

    console.log(`Attempting login for ${email} with password: ${password}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('LOGIN FAILED:', error.message);
        console.error('Error details:', error);
    } else {
        console.log('LOGIN SUCCESS!');
        console.log('User ID:', data.user.id);
        console.log('Session active:', !!data.session);
    }
}

checkLogin();
