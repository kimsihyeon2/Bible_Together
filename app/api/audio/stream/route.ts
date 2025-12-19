import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase'; // NOTE: This might need to be supabase-server or createClient
import ytdl from 'ytdl-core';
import { createClient } from '@supabase/supabase-js';

// Initialize a Supabase client with Service Role for server-side operations if needed, 
// but for reading public data the standard client is fine.
// However, best practice in Next.js App Router for backend is creating a fresh client.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const book = searchParams.get('book');
    const chapter = searchParams.get('chapter');

    if (!book || !chapter) {
        return NextResponse.json({ error: 'Missing book or chapter' }, { status: 400 });
    }

    try {
        // 1. Look up the Video ID from Supabase
        const { data, error } = await supabaseClient
            .from('bible_videos')
            .select('video_id')
            .eq('book', book)
            .eq('chapter', chapter)
            .single();

        if (error || !data) {
            // If not found in DB, we can't play it. 
            // Option: Return a 404 URL or error JSON. 
            // For the Strategy: Return 404 so client knows to disable player or show error.
            return NextResponse.json({ error: 'Audio not found for this chapter' }, { status: 404 });
        }

        const videoId = data.video_id;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // 2. Validate URL (ytdl-core)
        if (!ytdl.validateURL(videoUrl)) {
            return NextResponse.json({ error: 'Invalid Video ID in database' }, { status: 500 });
        }

        // 3. Get Video Info & Extract Audio URL
        // We use agent to avoid 429s if possible, though ytdl handles some internally.
        const info = await ytdl.getInfo(videoUrl);

        // Choose the best audio format (approx 128kbps or better is good, but mobile-friendly is key)
        // container: 'webm' or 'mp4' usually. 'audioonly' filter is best.
        const format = ytdl.chooseFormat(info.formats, {
            quality: 'highestaudio',
            filter: 'audioonly'
        });

        if (!format || !format.url) {
            return NextResponse.json({ error: 'No audio stream found' }, { status: 500 });
        }

        // 4. Redirect to the direct stream URL
        // status 307 Temporary Redirect preserves the method (GET)
        return NextResponse.redirect(format.url, 307);

    } catch (error) {
        console.error('Audio Stream Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
