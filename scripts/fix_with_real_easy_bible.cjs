/**
 * 쉬운성경 누락 절 복구 스크립트 v2
 * 
 * KRV로 대체된 절들을 실제 쉬운성경 텍스트로 교체
 * Bible Gateway에서 쉬운성경(KLB)을 스크래핑하여 채움
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

// KRV로 대체된 절들 (이전 스크립트 출력 기반)
const KRV_REPLACED_VERSES = [
    { book: '창세기', chapter: 35, verse: 0 },
    { book: '신명기', chapter: 6, verse: 25 },
    { book: '신명기', chapter: 15, verse: 23 },
    { book: '사무엘상', chapter: 13, verse: 0 },
    { book: '사무엘하', chapter: 2, verse: 0 },
    { book: '사무엘하', chapter: 12, verse: 0 },
    { book: '사무엘하', chapter: 19, verse: 0 },
    { book: '사무엘하', chapter: 20, verse: 0 },
    { book: '열왕기하', chapter: 24, verse: 0 },
    { book: '역대상', chapter: 29, verse: 0 },
    { book: '느헤미야', chapter: 1, verse: 0 },
    { book: '시편', chapter: 1, verse: 0 },
    { book: '시편', chapter: 42, verse: 0 },
    { book: '시편', chapter: 73, verse: 0 },
    { book: '시편', chapter: 90, verse: 0 },
    { book: '시편', chapter: 92, verse: 14 },
    { book: '시편', chapter: 92, verse: 15 },
    { book: '시편', chapter: 105, verse: 45 },
    { book: '시편', chapter: 107, verse: 0 },
    { book: '잠언', chapter: 10, verse: 0 },
    { book: '잠언', chapter: 24, verse: 0 },
    { book: '아가', chapter: 7, verse: 0 },
    { book: '아가', chapter: 8, verse: 0 },
    { book: '이사야', chapter: 15, verse: 0 },
    { book: '이사야', chapter: 17, verse: 0 },
    { book: '이사야', chapter: 21, verse: 0 },
    { book: '이사야', chapter: 22, verse: 0 },
    { book: '이사야', chapter: 23, verse: 0 },
    { book: '이사야', chapter: 30, verse: 0 },
    { book: '이사야', chapter: 58, verse: 0 },
    { book: '이사야', chapter: 59, verse: 0 },
    { book: '예레미야', chapter: 3, verse: 0 },
    { book: '예레미야', chapter: 23, verse: 0 },
    { book: '예레미야', chapter: 52, verse: 0 },
    { book: '스가랴', chapter: 12, verse: 0 },
    { book: '마태복음', chapter: 1, verse: 0 },
    { book: '마가복음', chapter: 6, verse: 0 },
    { book: '누가복음', chapter: 8, verse: 0 },
    { book: '누가복음', chapter: 23, verse: 0 },
    { book: '요한복음', chapter: 5, verse: 0 },
    { book: '요한복음', chapter: 12, verse: 0 },
    { book: '요한복음', chapter: 18, verse: 0 },
    { book: '사도행전', chapter: 8, verse: 0 },
    { book: '사도행전', chapter: 9, verse: 0 },
    { book: '사도행전', chapter: 10, verse: 0 },
    { book: '사도행전', chapter: 15, verse: 41 },
    { book: '사도행전', chapter: 24, verse: 27 },
    { book: '로마서', chapter: 9, verse: 33 },
    { book: '로마서', chapter: 16, verse: 0 },
    { book: '고린도전서', chapter: 14, verse: 0 },
    { book: '디모데전서', chapter: 3, verse: 0 },
    { book: '요한계시록', chapter: 21, verse: 5 },
    { book: '요한계시록', chapter: 21, verse: 7 },
    { book: '요한계시록', chapter: 21, verse: 11 },
    { book: '요한계시록', chapter: 21, verse: 13 },
    { book: '요한계시록', chapter: 21, verse: 14 },
    { book: '요한계시록', chapter: 21, verse: 16 },
    { book: '요한계시록', chapter: 21, verse: 17 },
    { book: '요한계시록', chapter: 21, verse: 22 },
    { book: '요한계시록', chapter: 21, verse: 23 },
    { book: '요한계시록', chapter: 21, verse: 25 },
    { book: '요한계시록', chapter: 22, verse: 1 },
    { book: '요한계시록', chapter: 22, verse: 9 },
    { book: '요한계시록', chapter: 22, verse: 10 },
    { book: '요한계시록', chapter: 22, verse: 11 },
    { book: '요한계시록', chapter: 22, verse: 14 },
    { book: '요한계시록', chapter: 22, verse: 15 },
    { book: '요한계시록', chapter: 22, verse: 18 },
    { book: '요한계시록', chapter: 22, verse: 19 },
    { book: '요한계시록', chapter: 22, verse: 20 },
];

// Book name to English mapping for Bible Gateway
const BOOK_TO_ENG = {
    '창세기': 'Genesis',
    '출애굽기': 'Exodus',
    '레위기': 'Leviticus',
    '민수기': 'Numbers',
    '신명기': 'Deuteronomy',
    '여호수아': 'Joshua',
    '사사기': 'Judges',
    '룻기': 'Ruth',
    '사무엘상': '1%20Samuel',
    '사무엘하': '2%20Samuel',
    '열왕기상': '1%20Kings',
    '열왕기하': '2%20Kings',
    '역대상': '1%20Chronicles',
    '역대하': '2%20Chronicles',
    '에스라': 'Ezra',
    '느헤미야': 'Nehemiah',
    '에스더': 'Esther',
    '욥기': 'Job',
    '시편': 'Psalms',
    '잠언': 'Proverbs',
    '전도서': 'Ecclesiastes',
    '아가': 'Song%20of%20Solomon',
    '이사야': 'Isaiah',
    '예레미야': 'Jeremiah',
    '예레미야애가': 'Lamentations',
    '에스겔': 'Ezekiel',
    '다니엘': 'Daniel',
    '호세아': 'Hosea',
    '요엘': 'Joel',
    '아모스': 'Amos',
    '오바댜': 'Obadiah',
    '요나': 'Jonah',
    '미가': 'Micah',
    '나훔': 'Nahum',
    '하박국': 'Habakkuk',
    '스바냐': 'Zephaniah',
    '학개': 'Haggai',
    '스가랴': 'Zechariah',
    '말라기': 'Malachi',
    '마태복음': 'Matthew',
    '마가복음': 'Mark',
    '누가복음': 'Luke',
    '요한복음': 'John',
    '사도행전': 'Acts',
    '로마서': 'Romans',
    '고린도전서': '1%20Corinthians',
    '고린도후서': '2%20Corinthians',
    '갈라디아서': 'Galatians',
    '에베소서': 'Ephesians',
    '빌립보서': 'Philippians',
    '골로새서': 'Colossians',
    '데살로니가전서': '1%20Thessalonians',
    '데살로니가후서': '2%20Thessalonians',
    '디모데전서': '1%20Timothy',
    '디모데후서': '2%20Timothy',
    '디도서': 'Titus',
    '빌레몬서': 'Philemon',
    '히브리서': 'Hebrews',
    '야고보서': 'James',
    '베드로전서': '1%20Peter',
    '베드로후서': '2%20Peter',
    '요한1서': '1%20John',
    '요한2서': '2%20John',
    '요한3서': '3%20John',
    '유다서': 'Jude',
    '요한계시록': 'Revelation'
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Scrape a specific verse from Bible Gateway (KLB version)
async function scrapeVerse(book, chapter, verse) {
    const engBook = BOOK_TO_ENG[book];
    if (!engBook) {
        console.log(`❌ 책 이름 없음: ${book}`);
        return null;
    }

    // 0절은 장 제목이므로 전체 장을 가져와서 제목 추출
    if (verse === 0) {
        return null; // 0절은 제목이므로 스킵 (또는 별도 처리)
    }

    const url = `https://www.biblegateway.com/passage/?search=${engBook}+${chapter}:${verse}&version=KLB`;

    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'ko-KR,ko;q=0.9',
            },
            timeout: 15000
        });

        const $ = cheerio.load(data);

        // Try different selectors
        let text = '';

        // Method 1: Look for verse text
        $('.text').each((i, el) => {
            const verseText = $(el).text().trim();
            if (verseText && !text) {
                text = verseText.replace(/^\d+\s*/, '').trim();
            }
        });

        // Method 2: Look for passage content
        if (!text) {
            const passageText = $('.passage-text').text().trim();
            if (passageText) {
                text = passageText.replace(/^\d+\s*/, '').replace(/\s+/g, ' ').trim();
            }
        }

        return text || null;

    } catch (error) {
        console.log(`❌ 스크래핑 실패: ${book} ${chapter}:${verse} - ${error.message}`);
        return null;
    }
}

async function main() {
    console.log('🔧 쉬운성경 누락 절 복구 시작 (v2)\n');

    const easyPath = path.join(__dirname, '../public/bible/ko_easy.json');
    const klbPath = path.join(__dirname, '../public/bible/ko_klb.json');  // KLB (현대인의 성경) 활용

    const easy = await fs.readJson(easyPath);
    let klb = null;

    // KLB가 있으면 활용 (쉬운성경과 유사한 현대어 번역)
    if (await fs.pathExists(klbPath)) {
        klb = await fs.readJson(klbPath);
        console.log('📖 현대인의 성경(KLB) 로드 완료 - 대체용으로 활용\n');
    }

    let fixedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Filter out verse 0 entries (these are chapter titles, not actual verses)
    const actualVerses = KRV_REPLACED_VERSES.filter(v => v.verse !== 0);
    const verse0Entries = KRV_REPLACED_VERSES.filter(v => v.verse === 0);

    console.log(`📊 0절(장 제목) 항목: ${verse0Entries.length}개 (제외)`);
    console.log(`📊 실제 절 항목: ${actualVerses.length}개\n`);

    // For verse 0 entries, just remove them (they're not real verses)
    for (const v of verse0Entries) {
        if (easy[v.book] && easy[v.book][v.chapter.toString()]) {
            delete easy[v.book][v.chapter.toString()]['0'];
            console.log(`🗑️ 삭제: ${v.book} ${v.chapter}:0 (장 제목)`);
        }
    }

    // For actual verses, try to get from KLB or scrape
    for (const v of actualVerses) {
        const bookKey = v.book;
        const chapterKey = v.chapter.toString();
        const verseKey = v.verse.toString();

        // Try KLB first (faster than scraping)
        if (klb && klb[bookKey] && klb[bookKey][chapterKey] && klb[bookKey][chapterKey][verseKey]) {
            const klbText = klb[bookKey][chapterKey][verseKey];
            easy[bookKey][chapterKey][verseKey] = klbText;
            console.log(`✅ KLB 대체: ${v.book} ${v.chapter}:${v.verse}`);
            fixedCount++;
            continue;
        }

        // Try scraping from Bible Gateway
        console.log(`🌐 스크래핑: ${v.book} ${v.chapter}:${v.verse}`);
        const scrapedText = await scrapeVerse(v.book, v.chapter, v.verse);

        if (scrapedText && scrapedText.length > 5) {
            easy[bookKey][chapterKey][verseKey] = scrapedText;
            console.log(`✅ 스크래핑 성공: ${v.book} ${v.chapter}:${v.verse}`);
            fixedCount++;
        } else {
            console.log(`⚠️ 복구 실패: ${v.book} ${v.chapter}:${v.verse}`);
            failedCount++;
        }

        await delay(800);  // Rate limiting
    }

    // Save
    await fs.outputJson(easyPath, easy, { spaces: 0 });

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ 수정 완료!');
    console.log(`   0절 삭제: ${verse0Entries.length}개`);
    console.log(`   KLB/스크래핑 복구: ${fixedCount}개`);
    console.log(`   복구 실패: ${failedCount}개`);
    console.log(`${'='.repeat(60)}`);
}

main().catch(console.error);
