import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side
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
        // Look up the Video ID from Supabase
        const { data, error } = await supabaseClient
            .from('bible_videos')
            .select('video_id')
            .eq('book', book)
            .eq('chapter', chapter)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Audio not found for this chapter' }, { status: 404 });
        }

        // Return the video ID - client will use YouTube IFrame API
        // This is more reliable than ytdl-core which often breaks
        return NextResponse.json({
            videoId: data.video_id,
            book,
            chapter: parseInt(chapter)
        });

    } catch (error) {
        console.error('Audio Stream Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
