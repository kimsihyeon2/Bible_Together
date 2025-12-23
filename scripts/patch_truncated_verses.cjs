/**
 * 🚀 SOTA 개역개정 성경 잘린 구절 패치 스크립트
 * 
 * bible_audit_report.json에서 잘린 구절 목록을 읽고
 * BibleGateway에서 올바른 텍스트를 가져와 패치합니다.
 * 
 * BibleGateway 지원 버전:
 * - KRV: 개역한글 (가장 유사)
 * 
 * 사용법: node scripts/patch_truncated_verses.cjs
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs-extra');
const path = require('path');

// ============ 설정 ============
const VERSION = 'KRV';  // BibleGateway의 개역한글
const BIBLE_PATH = path.join(__dirname, '../public/bible/ko_krv.json');
const AUDIT_REPORT_PATH = path.join(__dirname, '../bible_audit_report.json');
const PROGRESS_PATH = path.join(__dirname, '../temp_patch_progress.json');
const DELAY_MS = 1000;  // Rate limiting
const CONCURRENT_REQUESTS = 2;

// 한글 책 이름 → 영어 이름 매핑 (BibleGateway용)
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

// 진행률 표시
const progressBar = (current, total) => {
    const percent = Math.floor((current / total) * 100);
    const filled = Math.floor(percent / 2);
    const empty = 50 - filled;
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    process.stdout.write(`\r[${bar}] ${percent}% | ${current}/${total}     `);
};

// BibleGateway에서 단일 절 스크래핑
async function scrapeVerse(book, chapter, verse, retries = 3) {
    const engBook = BOOK_TO_ENG[book];
    if (!engBook) {
        console.log(`\n❌ 책 이름 매핑 없음: ${book}`);
        return null;
    }

    const url = `https://www.biblegateway.com/passage/?search=${engBook}+${chapter}:${verse}&version=${VERSION}`;

    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const { data } = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
                    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
                },
                timeout: 10000
            });

            const $ = cheerio.load(data);
            let verseText = '';

            // Method 1: 정확한 절 번호로 찾기
            $('span.text').each((i, el) => {
                const cls = $(el).attr('class') || '';
                // Class example: "text Genesis-27-19"
                const verseClass = `${engBook.replace(/%20/g, '-')}-${chapter}-${verse}`.toLowerCase();

                if (cls.toLowerCase().includes(verseClass.toLowerCase()) ||
                    cls.includes(`${engBook.split('%20').pop()}-${chapter}-${verse}`)) {

                    // 절 번호 제거하고 텍스트만 추출
                    $(el).find('sup.versenum').remove();
                    $(el).find('.footnote').remove();
                    $(el).find('.crossreference').remove();

                    verseText = $(el).text().trim();
                }
            });

            // Method 2: passage-text에서 전체 찾기
            if (!verseText) {
                const passageText = $('.passage-text .text').first().text().trim();
                if (passageText) {
                    // 절 번호 제거
                    verseText = passageText.replace(/^\d+\s*/, '').trim();
                }
            }

            // Method 3: result-text-style-normal에서 찾기
            if (!verseText) {
                const resultText = $('.result-text-style-normal p').text().trim();
                if (resultText) {
                    verseText = resultText.replace(/^\d+\s*/, '').replace(/\s+/g, ' ').trim();
                }
            }

            if (verseText && verseText.length > 5) {
                return verseText;
            }

            // 재시도
            if (attempt < retries - 1) {
                await delay(2000);
            }

        } catch (error) {
            if (attempt < retries - 1) {
                await delay(3000);
            } else {
                console.log(`\n❌ 스크래핑 실패: ${book} ${chapter}:${verse} - ${error.message}`);
                return null;
            }
        }
    }

    return null;
}

// 메인 패치 함수
async function patchVerses() {
    console.log('🚀 SOTA 개역개정 성경 패치 시작!\n');

    // 감사 보고서 로드
    if (!await fs.pathExists(AUDIT_REPORT_PATH)) {
        console.error('❌ 감사 보고서를 찾을 수 없습니다. 먼저 audit_bible.cjs를 실행하세요.');
        return;
    }

    const auditReport = await fs.readJson(AUDIT_REPORT_PATH);
    console.log(`📋 패치 대상: ${auditReport.length}개 절\n`);

    // 성경 데이터 로드
    const bibleData = await fs.readJson(BIBLE_PATH);

    // 진행 상황 로드 (이어서 패치)
    let startIndex = 0;
    let patchedCount = 0;
    let failedCount = 0;

    if (await fs.pathExists(PROGRESS_PATH)) {
        const progress = await fs.readJson(PROGRESS_PATH);
        startIndex = progress.lastIndex + 1;
        patchedCount = progress.patched || 0;
        failedCount = progress.failed || 0;
        console.log(`📂 이전 진행 상황 로드: ${startIndex}/${auditReport.length}부터 재시작\n`);
    }

    console.log('⏳ BibleGateway에서 올바른 텍스트 가져오는 중...\n');

    try {
        for (let i = startIndex; i < auditReport.length; i++) {
            const item = auditReport[i];
            const { book, chapter, verse } = item;

            progressBar(i + 1, auditReport.length);

            // 스크래핑
            const correctText = await scrapeVerse(book, chapter, verse);

            if (correctText) {
                // 성경 데이터 업데이트
                if (bibleData[book] && bibleData[book][chapter]) {
                    bibleData[book][chapter][verse] = correctText;
                    patchedCount++;
                }
            } else {
                failedCount++;
            }

            // 진행 상황 저장 (매 50개마다)
            if (i % 50 === 0) {
                await fs.outputJson(PROGRESS_PATH, {
                    lastIndex: i,
                    patched: patchedCount,
                    failed: failedCount
                });

                // 중간 저장
                await fs.outputJson(BIBLE_PATH, bibleData, { spaces: 0 });
            }

            await delay(DELAY_MS);
        }

        // 최종 저장
        await fs.outputJson(BIBLE_PATH, bibleData, { spaces: 0 });
        await fs.remove(PROGRESS_PATH);  // 진행 파일 삭제

        console.log('\n\n' + '='.repeat(60));
        console.log('✅ 패치 완료!');
        console.log(`   성공: ${patchedCount}개`);
        console.log(`   실패: ${failedCount}개`);
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n\n❌ 에러 발생:', error.message);

        // 진행 상황 저장
        await fs.outputJson(PROGRESS_PATH, {
            lastIndex: startIndex,
            patched: patchedCount,
            failed: failedCount,
            error: error.message
        });

        // 중간 저장
        await fs.outputJson(BIBLE_PATH, bibleData, { spaces: 0 });

        console.log('💾 진행 상황 저장됨. 다시 실행하면 이어서 진행합니다.');
    }
}

// 실행
patchVerses();
