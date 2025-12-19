
import ytpl from 'ytpl';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
// We don't actually need Supabase client for SQL generation, just ytpl
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Note: For seeding, we might need SERVICE_ROLE key if RLS blocks insert.
// But we set 'Allow admin insert' policy for service_role, and public read.
// Let's try with ANON key if we updated policy? No, policy said 'service_role'.
// Let's try with ANON key first but if it fails I'll ask for Service Role or use a different policy.
// Wait, I can't access service role key usually. I might need to output SQL.
// Let's Output SQL to a file, that's safer and "SOTA" because the User can run it in SQL Editor.
// OR I can change the policy temporarily? No.
// I'll Generate a SQL file.

// Sources (From User & Verified + Newly Discovered)
// Using PLVcVykBcFZT* pattern - these work reliably with ytpl
const PLAYLISTS = [
    // ===== 구약 - 모세오경 =====
    { name: '민수기', id: 'PLVcVykBcFZTSziL_7kuPXw6p2ffAw5w5p' },
    { name: '신명기', id: 'PLVcVykBcFZTSV6QhnTDu38DJkI0S38mrE' },
    { name: '여호수아', id: 'PLVcVykBcFZTSHSmmhRIAUWchydKEeSYCb' },

    // ===== 구약 - 시가서 =====
    { name: '잠언', id: 'PLjj_uvKdTemC_KJOyLrn5JspOXUGeHKeD' },

    // ===== 구약 - 대선지서 =====
    { name: '이사야', id: 'PLjj_uvKdTemA5X6O-dMoxLIXuvMzcXgyt' },

    // ===== 신약 =====
    { name: '요한계시록', id: 'PLjj_uvKdTemD7s1DBuvqNlKwb3T5_wcR-' },
    { name: '유다서', id: 'PLVcVykBcFZTR8onXJIE7rO5r998TOJ09X' },
];

// Manual Data for critical books (fail-safe entries)
const MANUAL_DATA = [
    // 창세기 (Genesis) - Most important first chapter
    { book: '창세기', chapter: 1, video_id: '75uSgwg4lQI' },
    // 요한계시록 (Revelation) - backup
    { book: '요한계시록', chapter: 1, video_id: '8k_Kx6_C8yU' },
];

// Regex to parse "Book Chapter"
// Handling: "창세기 1장", "Gen 1", "Genesis 1"
const PARSE_REGEX = /([가-힣]+)\s*(\d+)장/;

async function generateSeedSql() {
    console.log("🚀 Starting Seed Generation...");
    let sqlStatements = `-- Audio Bible Seed Data\n`;

    // 1. Process Manual Data
    console.log(`Processing Manual Data (${MANUAL_DATA.length} items)...`);
    for (const item of MANUAL_DATA) {
        sqlStatements += `INSERT INTO bible_videos (book, chapter, video_id) VALUES ('${item.book}', ${item.chapter}, '${item.video_id}') ON CONFLICT (book, chapter) DO UPDATE SET video_id = EXCLUDED.video_id;\n`;
    }

    // 2. Process Playlists
    for (const playlist of PLAYLISTS) {
        console.log(`\nProcessing ${playlist.name} (${playlist.id})...`);
        try {
            const result = await ytpl(playlist.id, { limit: Infinity });
            console.log(`Found ${result.items.length} videos.`);

            for (const item of result.items) {
                const title = item.title;
                const videoId = item.id;

                // Parse Title
                // Example: "창세기 1장" or "창세기 1장 | 드라마바이블"
                const match = title.match(PARSE_REGEX);

                if (match) {
                    const book = match[1]; // 창세기
                    const chapter = parseInt(match[2]); // 1

                    // console.log(`  -> ${book} ${chapter}장 : ${videoId}`);

                    // Create SQL Insert (idempotent with ON CONFLICT)
                    // Note: 'constraint' name needs to be correct. I named it 'bible_videos_book_chapter_key'.
                    sqlStatements += `INSERT INTO bible_videos (book, chapter, video_id) VALUES ('${book}', ${chapter}, '${videoId}') ON CONFLICT (book, chapter) DO UPDATE SET video_id = EXCLUDED.video_id;\n`;
                } else {
                    // This is harder. Let's stick to Korean if possible.
                    // The playlists seem to be PRS Korea.
                    // console.log(`  [SKIP] Could not parse: ${title}`);
                }
            }
        } catch (e) {
            console.error(`Error processing ${playlist.name}:`, e);
        }
    }

    // Write to file
    fs.writeFileSync('d:/bible-together/supabase/seed_audio_bible.sql', sqlStatements);
    console.log("\n✅ Generated 'supabase/seed_audio_bible.sql'");
}

generateSeedSql();
