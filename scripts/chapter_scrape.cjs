/**
 * 🚀 SOTA 성경 패치 - 장 단위 스크래핑
 * 
 * 대한성서공회에서 장 전체를 가져와서 패치
 * (구절 단위보다 훨씬 효율적)
 */
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const KRV_PATH = path.join(__dirname, '../public/bible/ko_krv.json');
const AUDIT_PATH = path.join(__dirname, '../bible_audit_report.json');

const BOOK_CODES = {
    '창세기': 'gen', '출애굽기': 'exo', '레위기': 'lev', '민수기': 'num', '신명기': 'deu',
    '여호수아': 'jos', '사사기': 'jdg', '룻기': 'rut', '사무엘상': '1sa', '사무엘하': '2sa',
    '열왕기상': '1ki', '열왕기하': '2ki', '역대상': '1ch', '역대하': '2ch',
    '에스라': 'ezr', '느헤미야': 'neh', '에스더': 'est', '욥기': 'job', '시편': 'psa',
    '잠언': 'pro', '전도서': 'ecc', '아가': 'sng', '이사야': 'isa', '예레미야': 'jer',
    '예레미야애가': 'lam', '에스겔': 'ezk', '다니엘': 'dan', '호세아': 'hos', '요엘': 'jol',
    '아모스': 'amo', '오바댜': 'oba', '요나': 'jon', '미가': 'mic', '나훔': 'nam',
    '하박국': 'hab', '스바냐': 'zep', '학개': 'hag', '스가랴': 'zec', '말라기': 'mal',
    '마태복음': 'mat', '마가복음': 'mrk', '누가복음': 'luk', '요한복음': 'jhn',
    '사도행전': 'act', '로마서': 'rom', '고린도전서': '1co', '고린도후서': '2co',
    '갈라디아서': 'gal', '에베소서': 'eph', '빌립보서': 'php', '골로새서': 'col',
    '데살로니가전서': '1th', '데살로니가후서': '2th', '디모데전서': '1ti', '디모데후서': '2ti',
    '디도서': 'tit', '빌레몬서': 'phm', '히브리서': 'heb', '야고보서': 'jas',
    '베드로전서': '1pe', '베드로후서': '2pe', '요한1서': '1jn', '요한2서': '2jn',
    '요한3서': '3jn', '유다서': 'jud', '요한계시록': 'rev'
};

// 장 전체를 스크래핑
async function scrapeChapter(page, book, chapter) {
    const code = BOOK_CODES[book];
    if (!code) return null;

    // 장 전체 URL (sec 없이)
    const url = `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=${code}&chap=${chapter}`;

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // 모든 절 추출
        const verses = await page.evaluate(() => {
            const result = {};

            // 방법 1: contenteditable 영역에서 추출
            const verseSpans = document.querySelectorAll('.versetext, .verse_text, span[id^="verse"]');
            for (const span of verseSpans) {
                const text = span.textContent.trim();
                const match = text.match(/^(\d+)\s+(.+)/);
                if (match) {
                    result[match[1]] = match[2];
                }
            }

            // 방법 2: 본문 전체에서 절 패턴 추출
            if (Object.keys(result).length === 0) {
                const bodyText = document.body.innerText;
                const lines = bodyText.split('\n');

                for (const line of lines) {
                    const trimmed = line.trim();
                    // "1 태초에 하나님이..." 형태 매칭
                    const match = trimmed.match(/^(\d+)\s+(.{10,})/);
                    if (match) {
                        const verseNum = match[1];
                        const verseText = match[2].trim();
                        // 이미 있는 것보다 길면 업데이트
                        if (!result[verseNum] || verseText.length > result[verseNum].length) {
                            result[verseNum] = verseText;
                        }
                    }
                }
            }

            return result;
        });

        return verses;
    } catch (error) {
        console.error(`\n❌ ${book} ${chapter}장 에러:`, error.message);
        return null;
    }
}

async function main() {
    console.log('🚀 장 단위 스크래핑 시작\n');

    const krvData = await fs.readJson(KRV_PATH);
    const auditReport = await fs.readJson(AUDIT_PATH);

    // 필요한 책/장 목록 추출
    const chaptersNeeded = new Map();
    for (const item of auditReport) {
        const key = `${item.book}|${item.chapter}`;
        if (!chaptersNeeded.has(key)) {
            chaptersNeeded.set(key, []);
        }
        chaptersNeeded.get(key).push(item.verse);
    }

    console.log(`📋 필요한 장 수: ${chaptersNeeded.size}개\n`);

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
    const page = await browser.newPage();

    let patchedCount = 0;
    let processedChapters = 0;
    const startTime = Date.now();

    try {
        for (const [key, verses] of chaptersNeeded) {
            const [book, chapter] = key.split('|');

            processedChapters++;
            const pct = Math.floor((processedChapters / chaptersNeeded.size) * 100);
            process.stdout.write(`\r[${pct}%] ${book} ${chapter}장 | ${patchedCount} 패치됨      `);

            const chapterData = await scrapeChapter(page, book, chapter);

            if (chapterData) {
                for (const verse of verses) {
                    if (chapterData[verse]) {
                        const newText = chapterData[verse];
                        const oldText = krvData[book]?.[chapter]?.[verse] || '';

                        if (newText.length > oldText.length) {
                            krvData[book][chapter][verse] = newText;
                            patchedCount++;
                        }
                    }
                }
            }

            // 10장마다 저장
            if (processedChapters % 10 === 0) {
                await fs.outputJson(KRV_PATH, krvData, { spaces: 0 });
            }

            await new Promise(r => setTimeout(r, 300));
        }

        await fs.outputJson(KRV_PATH, krvData, { spaces: 0 });

        console.log('\n\n' + '='.repeat(50));
        console.log('✅ 완료!');
        console.log(`   패치됨: ${patchedCount}개`);
        console.log(`   시간: ${Math.round((Date.now() - startTime) / 1000)}초`);
        console.log('='.repeat(50));

    } catch (e) {
        console.error('\n❌', e.message);
    } finally {
        await browser.close();
    }
}

main().catch(console.error);
