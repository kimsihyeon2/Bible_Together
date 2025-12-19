
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

async function createTestUser() {
    const email = 'testuser_auto@example.com';
    const password = 'TestPass123!';
    const name = 'Test User Auto';

    console.log(`Attempting to create user ${email}...`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name },
        },
    });

    if (error) {
        console.error('SIGNUP FAILED:', error.message);
        // If user already exists, it might be an unconfirmed email or just wrong password earlier.
    } else {
        console.log('SIGNUP SUCCESS!');
        console.log('User ID:', data.user?.id);
        console.log('Confirmation Sent:', !data.session);
        if (!data.session) {
            console.log('WARNING: Email confirmation is likely required. You must verify the email manually or disable email confirm in Supabase.');
        }
    }
}

createTestUser();
