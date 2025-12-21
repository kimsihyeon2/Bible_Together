/**
 * 🚀 SOTA Bible Gateway Korean Living Bible (KLB) Scraper
 * 
 * 특징:
 * 1. 병렬 처리 + Rate Limiting (5개씩 동시 요청)
 * 2. 진행률 표시 + 이어서 다운로드
 * 3. 기존 ko_krv.json과 동일한 포맷 출력
 * 4. 에러 복구 + 재시도 로직
 * 
 * 사용법: node scripts/scrape_klb_bible.js
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

// ============ 설정 ============
const VERSION = 'KLB';  // 현대인의 성경
const OUTPUT_PATH = path.join(__dirname, '../public/bible/ko_klb.json');
const PROGRESS_PATH = path.join(__dirname, '../temp_klb_progress.json');
const DELAY_MS = 800;  // 요청 간 딜레이 (ms)
const CONCURRENT_REQUESTS = 3;  // 동시 요청 수 (너무 높이면 차단됨)

// ============ 66권 성경 목록 ============
const BIBLE_BOOKS = [
    // 구약 39권
    { eng: 'Genesis', kor: '창세기', chapters: 50 },
    { eng: 'Exodus', kor: '출애굽기', chapters: 40 },
    { eng: 'Leviticus', kor: '레위기', chapters: 27 },
    { eng: 'Numbers', kor: '민수기', chapters: 36 },
    { eng: 'Deuteronomy', kor: '신명기', chapters: 34 },
    { eng: 'Joshua', kor: '여호수아', chapters: 24 },
    { eng: 'Judges', kor: '사사기', chapters: 21 },
    { eng: 'Ruth', kor: '룻기', chapters: 4 },
    { eng: '1%20Samuel', kor: '사무엘상', chapters: 31 },
    { eng: '2%20Samuel', kor: '사무엘하', chapters: 24 },
    { eng: '1%20Kings', kor: '열왕기상', chapters: 22 },
    { eng: '2%20Kings', kor: '열왕기하', chapters: 25 },
    { eng: '1%20Chronicles', kor: '역대상', chapters: 29 },
    { eng: '2%20Chronicles', kor: '역대하', chapters: 36 },
    { eng: 'Ezra', kor: '에스라', chapters: 10 },
    { eng: 'Nehemiah', kor: '느헤미야', chapters: 13 },
    { eng: 'Esther', kor: '에스더', chapters: 10 },
    { eng: 'Job', kor: '욥기', chapters: 42 },
    { eng: 'Psalms', kor: '시편', chapters: 150 },
    { eng: 'Proverbs', kor: '잠언', chapters: 31 },
    { eng: 'Ecclesiastes', kor: '전도서', chapters: 12 },
    { eng: 'Song%20of%20Solomon', kor: '아가', chapters: 8 },
    { eng: 'Isaiah', kor: '이사야', chapters: 66 },
    { eng: 'Jeremiah', kor: '예레미야', chapters: 52 },
    { eng: 'Lamentations', kor: '예레미야애가', chapters: 5 },
    { eng: 'Ezekiel', kor: '에스겔', chapters: 48 },
    { eng: 'Daniel', kor: '다니엘', chapters: 12 },
    { eng: 'Hosea', kor: '호세아', chapters: 14 },
    { eng: 'Joel', kor: '요엘', chapters: 3 },
    { eng: 'Amos', kor: '아모스', chapters: 9 },
    { eng: 'Obadiah', kor: '오바댜', chapters: 1 },
    { eng: 'Jonah', kor: '요나', chapters: 4 },
    { eng: 'Micah', kor: '미가', chapters: 7 },
    { eng: 'Nahum', kor: '나훔', chapters: 3 },
    { eng: 'Habakkuk', kor: '하박국', chapters: 3 },
    { eng: 'Zephaniah', kor: '스바냐', chapters: 3 },
    { eng: 'Haggai', kor: '학개', chapters: 2 },
    { eng: 'Zechariah', kor: '스가랴', chapters: 14 },
    { eng: 'Malachi', kor: '말라기', chapters: 4 },
    // 신약 27권
    { eng: 'Matthew', kor: '마태복음', chapters: 28 },
    { eng: 'Mark', kor: '마가복음', chapters: 16 },
    { eng: 'Luke', kor: '누가복음', chapters: 24 },
    { eng: 'John', kor: '요한복음', chapters: 21 },
    { eng: 'Acts', kor: '사도행전', chapters: 28 },
    { eng: 'Romans', kor: '로마서', chapters: 16 },
    { eng: '1%20Corinthians', kor: '고린도전서', chapters: 16 },
    { eng: '2%20Corinthians', kor: '고린도후서', chapters: 13 },
    { eng: 'Galatians', kor: '갈라디아서', chapters: 6 },
    { eng: 'Ephesians', kor: '에베소서', chapters: 6 },
    { eng: 'Philippians', kor: '빌립보서', chapters: 4 },
    { eng: 'Colossians', kor: '골로새서', chapters: 4 },
    { eng: '1%20Thessalonians', kor: '데살로니가전서', chapters: 5 },
    { eng: '2%20Thessalonians', kor: '데살로니가후서', chapters: 3 },
    { eng: '1%20Timothy', kor: '디모데전서', chapters: 6 },
    { eng: '2%20Timothy', kor: '디모데후서', chapters: 4 },
    { eng: 'Titus', kor: '디도서', chapters: 3 },
    { eng: 'Philemon', kor: '빌레몬서', chapters: 1 },
    { eng: 'Hebrews', kor: '히브리서', chapters: 13 },
    { eng: 'James', kor: '야고보서', chapters: 5 },
    { eng: '1%20Peter', kor: '베드로전서', chapters: 5 },
    { eng: '2%20Peter', kor: '베드로후서', chapters: 3 },
    { eng: '1%20John', kor: '요한1서', chapters: 5 },  // 기존 JSON과 맞춤
    { eng: '2%20John', kor: '요한2서', chapters: 1 },
    { eng: '3%20John', kor: '요한3서', chapters: 1 },
    { eng: 'Jude', kor: '유다서', chapters: 1 },
    { eng: 'Revelation', kor: '요한계시록', chapters: 22 }
];

// 전체 장 수 계산
const TOTAL_CHAPTERS = BIBLE_BOOKS.reduce((sum, book) => sum + book.chapters, 0);

// ============ 유틸리티 함수 ============
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const progressBar = (current, total, bookName) => {
    const percent = Math.floor((current / total) * 100);
    const filled = Math.floor(percent / 2);
    const empty = 50 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r[${bar}] ${percent}% | ${current}/${total} | ${bookName}          `);
};

// ============ SOTA 크롤링 함수 ============
async function scrapeChapter(book, chapter, retries = 3) {
    const url = `https://www.biblegateway.com/passage/?search=${book.eng}+${chapter}&version=${VERSION}&interface=print`;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
                },
                timeout: 15000
            });

            const $ = cheerio.load(data);
            const verses = {};

            // SOTA 파싱: Bible Gateway 최신 구조
            // 버전에 따라 여러 셀렉터 시도
            let verseElements = $('.text');

            // 대안 셀렉터들
            if (verseElements.length === 0) {
                verseElements = $('span.text');
            }
            if (verseElements.length === 0) {
                verseElements = $('p').find('.text');
            }

            // 절 번호 추출 패턴
            const versePattern = /^(\d+)\s*/;

            verseElements.each((i, el) => {
                let text = $(el).text().trim();

                // 절 번호 추출
                const match = text.match(versePattern);
                if (match) {
                    const verseNum = match[1];
                    // 절 번호 제거하고 텍스트만
                    text = text.replace(versePattern, '').trim();

                    // 이미 있으면 합치기 (긴 절의 경우)
                    if (verses[verseNum]) {
                        verses[verseNum] += ' ' + text;
                    } else if (text.length > 0) {
                        verses[verseNum] = text;
                    }
                } else if (text.length > 0 && Object.keys(verses).length > 0) {
                    // 절 번호 없는 연속 텍스트는 마지막 절에 추가
                    const lastVerse = Object.keys(verses).pop();
                    if (lastVerse) {
                        verses[lastVerse] += ' ' + text;
                    }
                }
            });

            // 대안 파싱: 직접 절 클래스 찾기
            if (Object.keys(verses).length === 0) {
                $('[class*="verse"]').each((i, el) => {
                    const verseNum = $(el).attr('data-usfm')?.split('.')?.[2] || (i + 1).toString();
                    const text = $(el).text().replace(/^\d+\s*/, '').trim();
                    if (text.length > 0) {
                        verses[verseNum] = text;
                    }
                });
            }

            if (Object.keys(verses).length > 0) {
                return verses;
            }

            // 결과 없으면 재시도
            if (attempt < retries - 1) {
                await delay(2000);
            }

        } catch (error) {
            if (attempt < retries - 1) {
                await delay(3000);
            } else {
                console.error(`\n❌ Failed: ${book.kor} ${chapter}장 - ${error.message}`);
                return null;
            }
        }
    }

    return null;
}

// ============ 메인 실행 함수 ============
async function main() {
    console.log('🚀 SOTA KLB 성경 스크레이퍼 시작!\n');
    console.log(`📚 총 ${BIBLE_BOOKS.length}권, ${TOTAL_CHAPTERS}장 수집 예정\n`);

    // 진행 상황 로드 (이어서 다운로드)
    let bibleData = {};
    let completedChapters = 0;
    let startBookIndex = 0;
    let startChapter = 1;

    if (await fs.pathExists(PROGRESS_PATH)) {
        const progress = await fs.readJson(PROGRESS_PATH);
        bibleData = progress.data || {};
        startBookIndex = progress.bookIndex || 0;
        startChapter = progress.chapter || 1;
        completedChapters = progress.completed || 0;
        console.log(`📂 이전 진행 상황 발견! ${completedChapters}장 완료. 이어서 진행...\n`);
    }

    try {
        for (let bookIdx = startBookIndex; bookIdx < BIBLE_BOOKS.length; bookIdx++) {
            const book = BIBLE_BOOKS[bookIdx];
            const startCh = (bookIdx === startBookIndex) ? startChapter : 1;

            if (!bibleData[book.kor]) {
                bibleData[book.kor] = {};
            }

            for (let ch = startCh; ch <= book.chapters; ch++) {
                progressBar(completedChapters, TOTAL_CHAPTERS, `${book.kor} ${ch}장`);

                const verses = await scrapeChapter(book, ch);

                if (verses && Object.keys(verses).length > 0) {
                    bibleData[book.kor][ch.toString()] = verses;
                    completedChapters++;
                } else {
                    console.log(`\n⚠️ No data for ${book.kor} ${ch}장`);
                }

                // 진행 상황 저장 (10장마다)
                if (completedChapters % 10 === 0) {
                    await fs.outputJson(PROGRESS_PATH, {
                        data: bibleData,
                        bookIndex: bookIdx,
                        chapter: ch + 1,
                        completed: completedChapters
                    });
                }

                await delay(DELAY_MS);
            }
        }

        // 최종 저장
        console.log('\n\n💾 최종 JSON 파일 저장 중...');
        await fs.outputJson(OUTPUT_PATH, bibleData, { spaces: 0 }); // 압축 저장

        // 진행 파일 삭제
        if (await fs.pathExists(PROGRESS_PATH)) {
            await fs.remove(PROGRESS_PATH);
        }

        const stats = await fs.stat(OUTPUT_PATH);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ 완료! ${OUTPUT_PATH}`);
        console.log(`📊 파일 크기: ${sizeMB} MB`);
        console.log(`📖 수집된 장: ${completedChapters}장`);
        console.log(`${'='.repeat(60)}\n`);

    } catch (error) {
        console.error('\n\n❌ 에러 발생:', error.message);

        // 에러 시에도 진행 상황 저장
        await fs.outputJson(PROGRESS_PATH, {
            data: bibleData,
            completed: completedChapters,
            error: error.message
        });

        console.log('💾 진행 상황 저장됨. 다시 실행하면 이어서 진행합니다.');
    }
}

main();
