import puppeteer, { Page } from 'puppeteer';
import fs from 'fs';

// ============================================================
// SOTA Bible Audio Scraper - COMPLETE 66 BOOKS
// ============================================================

const OUTPUT_PATH = 'd:/bible-together/supabase/seed_audio_bible.sql';

// COMPLETE 66-BOOK PLAYLIST IDs (User Verified)
const ALL_PLAYLISTS: { title: string; id: string }[] = [
    // ===== 구약 (Old Testament) - 39 Books =====
    { title: '창세기', id: 'PLVcVykBcFZTTenG4FZnco9h4SnvWtNY0K' },
    { title: '출애굽기', id: 'PLVcVykBcFZTSYd6bRzCDIQ_6VUHS_V9zt' },
    { title: '레위기', id: 'PLVcVykBcFZTSCE8n84eAOIeblwEsYO3mU' },
    { title: '민수기', id: 'PLVcVykBcFZTSziL_7kuPXw6p2ffAw5w5p' },
    { title: '신명기', id: 'PLVcVykBcFZTSV6QhnTDu38DJkI0S38mrE' },
    { title: '여호수아', id: 'PLVcVykBcFZTSHSmmhRIAUWchydKEeSYCb' },
    { title: '사사기', id: 'PLVcVykBcFZTTdu2FA4QfWJBMQkiHiFALG' },
    { title: '룻기', id: 'PLVcVykBcFZTRpECC_L_4wdTuy-pbsBU-0' },
    { title: '사무엘상', id: 'PLVcVykBcFZTSHtn5oFSUYmgOWg5_CWVZR' },
    { title: '사무엘하', id: 'PLVcVykBcFZTROLMklt8i1DcFrK2g0behB' },
    { title: '열왕기상', id: 'PLVcVykBcFZTTEtSwRYC9X96LJBuiPYsLo' },
    { title: '열왕기하', id: 'PLVcVykBcFZTSVzKybYDLyJZ--Uld5FsHu' },
    { title: '역대상', id: 'PLVcVykBcFZTQbT9oetQb6F_trBfoaEGia' },
    { title: '역대하', id: 'PLVcVykBcFZTT82yWIwm6c64XO_9E-3dvO' },
    { title: '에스라', id: 'PLVcVykBcFZTREfSjashIE6-DUgpc4LQfe' },
    { title: '느헤미야', id: 'PLVcVykBcFZTTWvwQkFGUNWvxN55yEchFQ' },
    { title: '에스더', id: 'PLVcVykBcFZTTYMuTZyUV53vN61-XIzNWm' },
    { title: '욥기', id: 'PLVcVykBcFZTRA0-KsYJMv1UUXjJPOoROi' },
    { title: '시편', id: 'PLVcVykBcFZTSMAKUao0L--CoeUe_nPoSd' },
    { title: '잠언', id: 'PLVcVykBcFZTTIqnQiJYVaNKrYqttHID7F' },
    { title: '전도서', id: 'PLVcVykBcFZTR4jlNiLUcgz8PgxUMlsOzg' },
    { title: '아가', id: 'PLVcVykBcFZTQhBNLBdZmjXRGf-smdsqTs' },
    { title: '이사야', id: 'PLVcVykBcFZTSVp4n5o6pUSOPEUN-ExIPP' },
    { title: '예레미야', id: 'PLVcVykBcFZTTLJbjVJrvWpri7t60QPK0U' },
    { title: '예레미야애가', id: 'PLVcVykBcFZTS25SZY4eLFY_YO9p0NhhxP' },
    { title: '에스겔', id: 'PLVcVykBcFZTQWE6T09ooK65mj0KLwrDLx' },
    { title: '다니엘', id: 'PLVcVykBcFZTS6_DX7DmwBucUJHGgPRYxV' },
    { title: '호세아', id: 'PLVcVykBcFZTTHXs3GDofQ8QZsRioY-3s5' },
    { title: '요엘', id: 'PLVcVykBcFZTRWIFFGVwBHPV0NOFUBI1WO' },
    { title: '아모스', id: 'PLVcVykBcFZTRjov5IGS0ple0G-bxutvXC' },
    { title: '오바댜', id: 'PLVcVykBcFZTQ_RLKlpPc-XQXUHPQ493eY' },
    { title: '요나', id: 'PLVcVykBcFZTTQdeXVPDHEPlEu5Mu9hyFw' },
    { title: '미가', id: 'PLVcVykBcFZTQTPdd5btcUg2HRw7ppOlO0' },
    { title: '나훔', id: 'PLVcVykBcFZTRrBQXsuMjCdgb6Q8DjF00t' },
    { title: '하박국', id: 'PLVcVykBcFZTQXQWFlD59OACCrmuP1jR0A' },
    { title: '스바냐', id: 'PLVcVykBcFZTSUk67CGY_ZlReo_hWIs40H' },
    { title: '학개', id: 'PLVcVykBcFZTRmuTLLBThKeVRuJf0RYi6s' },
    { title: '스가랴', id: 'PLVcVykBcFZTStJflQZv0CMV1r-_OhR0vH' },
    { title: '말라기', id: 'PLVcVykBcFZTSWvpniDlQqIilSO8KVHNQm' },

    // ===== 신약 (New Testament) - 27 Books =====
    { title: '마태복음', id: 'PLVcVykBcFZTTKkSEcwyx7AKkEtOrA0YaB' },
    { title: '마가복음', id: 'PLVcVykBcFZTSnm06gj6p757p3UgKo56yf' },
    { title: '누가복음', id: 'PLVcVykBcFZTRCw83sb7OksBPbBcGrdm3T' },
    { title: '요한복음', id: 'PLVcVykBcFZTSlBgLZ2Pk3MLBJa1T5tDrM' },
    { title: '사도행전', id: 'PLVcVykBcFZTSuT01_zJLoAWPW6N6PTfbn' },
    { title: '로마서', id: 'PLVcVykBcFZTQvyup7dWM56QJ8FkyML8n6' },
    { title: '고린도전서', id: 'PLVcVykBcFZTSdawXsLIuqj8yR9M1lz6LK' },
    { title: '고린도후서', id: 'PLVcVykBcFZTRJ6wi-a5zpQC42Yql5mj6Q' },
    { title: '갈라디아서', id: 'PLVcVykBcFZTSrcFTYNouOB-1m_SAdo4Qw' },
    { title: '에베소서', id: 'PLVcVykBcFZTTeyVgCwDZi6tCbYQVgvR7j' },
    { title: '빌립보서', id: 'PLVcVykBcFZTQEiaROjszOLq9h26VSmLBh' },
    { title: '골로새서', id: 'PLVcVykBcFZTRjJ9_N6hXXMvDFh2yGotFB' },
    { title: '데살로니가전서', id: 'PLVcVykBcFZTTFDN3tBR8gtun08Win85dl' },
    { title: '데살로니가후서', id: 'PLVcVykBcFZTTeztH9fdjw7_CG8HfRsHeR' },
    { title: '디모데전서', id: 'PLVcVykBcFZTToibazDwFnXaDG6qblPpQB' },
    { title: '디모데후서', id: 'PLVcVykBcFZTRybZSmxYYn7gIhXqW6eler' },
    { title: '디도서', id: 'PLVcVykBcFZTRZSDMKB8FnBm3mPOQfkuIK' },
    { title: '빌레몬서', id: 'PLVcVykBcFZTQhNBiB65oyHHR2X6U9Q-wT' },
    { title: '히브리서', id: 'PLVcVykBcFZTSQLsKzG0c9f2tf9kAaGK4r' },
    { title: '야고보서', id: 'PLVcVykBcFZTRGwOvhGfcsOOAJIxOhSc3-' },
    { title: '베드로전서', id: 'PLVcVykBcFZTTpVnetPuyFEAXTKAjx_gBH' },
    { title: '베드로후서', id: 'PLVcVykBcFZTSnhyUFaSe6XkFz4VP0K-T3' },
    { title: '요한일서', id: 'PLVcVykBcFZTT0tQSy_ml2Y8CqhzFShEfV' },
    { title: '요한이서', id: 'PLVcVykBcFZTSadmVOtxjoRN1CvPW7ueCo' },
    { title: '요한삼서', id: 'PLVcVykBcFZTQ9WwoDXujmA8UXNN2gknGZ' },
    { title: '유다서', id: 'PLVcVykBcFZTR8onXJIE7rO5r998TOJ09X' },
    { title: '요한계시록', id: 'PLVcVykBcFZTRBVoySW3q_mb4MLyEQVcNx' },
];

// SQL Schema Header
const SQL_SCHEMA = `-- Create table for storing Bible Audio (YouTube Video IDs)
create table if not exists bible_videos (
  id uuid default gen_random_uuid() primary key,
  book text not null,
  chapter int not null,
  video_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint bible_videos_book_chapter_key unique (book, chapter)
);

-- Enable RLS
alter table bible_videos enable row level security;

-- Policies
create policy "Allow public read access" on bible_videos for select using (true);
create policy "Allow admin insert" on bible_videos for insert with check (auth.role() = 'service_role');

-- Create an index for faster lookups
create index if not exists bible_videos_lookup_idx on bible_videos (book, chapter);

`;

interface VideoInfo {
    title: string;
    id: string;
}

// ============================================================
// Auto-scroll utility
// ============================================================
async function autoScroll(page: Page, maxScrollHeight: number = 30000): Promise<void> {
    await page.evaluate(async (maxHeight: number) => {
        await new Promise<void>((resolve) => {
            let totalHeight = 0;
            const distance = 200;
            const timer = setInterval(() => {
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= maxHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 80);
        });
    }, maxScrollHeight);

    await new Promise(r => setTimeout(r, 1500));
}

// ============================================================
// Main Scraper
// ============================================================
async function scrape(): Promise<void> {
    console.log("🚀 SOTA Bible Audio Scraper - 66 Books Edition\n");
    console.log(`📚 Total playlists to scrape: ${ALL_PLAYLISTS.length}\n`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // Start with header comments + schema
    let sqlStatements = `-- Audio Bible Seed Data (COMPLETE 66 BOOKS)\n-- Generated: ${new Date().toISOString()}\n-- Total Books: 66\n\n`;
    sqlStatements += SQL_SCHEMA;

    const seenEntries = new Set<string>();
    let totalVideos = 0;
    let successBooks = 0;

    for (let i = 0; i < ALL_PLAYLISTS.length; i++) {
        const pl = ALL_PLAYLISTS[i];
        console.log(`[${i + 1}/${ALL_PLAYLISTS.length}] ${pl.title}...`);

        try {
            await page.goto(`https://www.youtube.com/playlist?list=${pl.id}`, {
                waitUntil: 'networkidle2',
                timeout: 60000
            });
            await new Promise(r => setTimeout(r, 2000));
            await autoScroll(page, 50000);

            const videos: VideoInfo[] = await page.evaluate(() => {
                const vids: { title: string; id: string }[] = [];
                const seenV = new Set<string>();

                const videoTitleLinks = document.querySelectorAll('a#video-title');

                videoTitleLinks.forEach(a => {
                    const anchor = a as HTMLAnchorElement;
                    const href = anchor.href;
                    const title = (anchor.textContent || anchor.title || "").trim();

                    if (href && href.includes('v=') && title) {
                        const match = href.match(/v=([^&]+)/);
                        if (match) {
                            const id = match[1];
                            if (!seenV.has(id)) {
                                seenV.add(id);
                                vids.push({ title, id });
                            }
                        }
                    }
                });
                return vids;
            });

            let bookVideos = 0;
            for (const v of videos) {
                let book: string | null = null;
                let chapter: number | null = null;

                // Pattern 1: "책이름 N장"
                const p1 = v.title.match(/([가-힣]+)\s*(\d+)장/);
                if (p1) { book = p1[1]; chapter = parseInt(p1[2], 10); }

                // Pattern 2: "책이름 N편" (시편)
                if (!book) {
                    const p2 = v.title.match(/([가-힣]+)\s*(\d+)편/);
                    if (p2) { book = p2[1]; chapter = parseInt(p2[2], 10); }
                }

                if (book && chapter) {
                    const key = `${book}-${chapter}`;
                    if (!seenEntries.has(key)) {
                        seenEntries.add(key);
                        sqlStatements += `INSERT INTO bible_videos (book, chapter, video_id) VALUES ('${book}', ${chapter}, '${v.id}') ON CONFLICT (book, chapter) DO UPDATE SET video_id = EXCLUDED.video_id;\n`;
                        bookVideos++;
                        totalVideos++;
                    }
                }
            }

            console.log(`   ✅ ${bookVideos} chapters`);
            if (bookVideos > 0) successBooks++;

        } catch (err) {
            console.log(`   ❌ Error: ${(err as Error).message.substring(0, 50)}`);
        }
    }

    await browser.close();

    fs.writeFileSync(OUTPUT_PATH, sqlStatements, 'utf8');
    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ COMPLETE!`);
    console.log(`   Books processed: ${successBooks}/${ALL_PLAYLISTS.length}`);
    console.log(`   Total chapters: ${totalVideos}`);
    console.log(`   Output: ${OUTPUT_PATH}`);
}

scrape().catch(console.error);
