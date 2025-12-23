/**
 * 🚀 SOTA 성경 패치 - 대한성서공회 (BSKorea) 버전
 * 
 * 개역개정(GAE) 버전 직접 스크래핑
 */
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');

const CONCURRENT_TABS = 2;  // 서버 부하 고려
const DELAY_MS = 500;
const KRV_PATH = path.join(__dirname, '../public/bible/ko_krv.json');
const AUDIT_PATH = path.join(__dirname, '../bible_audit_report.json');
const PROGRESS_PATH = path.join(__dirname, '../bs_progress.json');

// 한글 -> 대한성서공회 코드
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

async function scrapeVerse(page, book, chapter, verse) {
    const code = BOOK_CODES[book];
    if (!code) return null;

    // 대한성서공회 개역개정 URL
    const url = `https://www.bskorea.or.kr/bible/korbibReadpage.php?version=GAE&book=${code}&chap=${chapter}&sec=${verse}`;

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });

        const verseText = await page.evaluate((verseNum) => {
            // 페이지 전체 텍스트에서 절 찾기
            const text = document.body.innerText;
            const lines = text.split('\n');

            for (const line of lines) {
                const trimmed = line.trim();
                // "19  야곱이..." 형태로 된 절 찾기
                const match = trimmed.match(new RegExp(`^${verseNum}\\s+(.+)$`));
                if (match) {
                    return match[1].trim();
                }
            }

            // 두 번째 시도: 절 번호 없이 성경 키워드로 찾기
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.length > 20 &&
                    (trimmed.includes('하나님') || trimmed.includes('여호와') ||
                        trimmed.includes('예수') || trimmed.includes('주께서'))) {
                    return trimmed.replace(/^\d+\s*/, '');
                }
            }

            return null;
        }, verse);

        return verseText;
    } catch (error) {
        return null;
    }
}

async function main() {
    console.log('🚀 대한성서공회 개역개정 패치 시작\n');

    const krvData = await fs.readJson(KRV_PATH);
    const auditReport = await fs.readJson(AUDIT_PATH);

    let startIndex = 0;
    let patchedCount = 0;
    let failedCount = 0;

    if (await fs.pathExists(PROGRESS_PATH)) {
        const p = await fs.readJson(PROGRESS_PATH);
        startIndex = p.lastIndex + 1;
        patchedCount = p.patched;
        failedCount = p.failed;
        console.log(`📂 ${startIndex}부터 재시작\n`);
    }

    console.log(`📋 총 ${auditReport.length}개 구절\n`);

    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox']
    });

    const pages = await Promise.all(
        Array(CONCURRENT_TABS).fill(null).map(() => browser.newPage())
    );

    const startTime = Date.now();

    try {
        for (let i = startIndex; i < auditReport.length; i += CONCURRENT_TABS) {
            const batch = auditReport.slice(i, Math.min(i + CONCURRENT_TABS, auditReport.length));

            // 진행률
            const pct = Math.floor((i / auditReport.length) * 100);
            const elapsed = (Date.now() - startTime) / 1000;
            const speed = (i - startIndex) / elapsed || 1;
            const eta = Math.round((auditReport.length - i) / speed);
            process.stdout.write(`\r[${pct}%] ${i}/${auditReport.length} | ${patchedCount} 패치 | ~${eta}s 남음         `);

            const results = await Promise.all(batch.map(async (item, idx) => {
                const page = pages[idx % pages.length];
                const { book, chapter, verse } = item;

                const newText = await scrapeVerse(page, book, chapter, verse);
                const currentText = krvData[book]?.[chapter]?.[verse] || '';

                if (newText && newText.length > currentText.length) {
                    krvData[book][chapter][verse] = newText;
                    return true;
                }
                return false;
            }));

            results.forEach(s => s ? patchedCount++ : failedCount++);

            // 저장
            if (i % 20 === 0) {
                await fs.outputJson(PROGRESS_PATH, { lastIndex: i + batch.length - 1, patched: patchedCount, failed: failedCount });
                await fs.outputJson(KRV_PATH, krvData, { spaces: 0 });
            }

            await new Promise(r => setTimeout(r, DELAY_MS));
        }

        await fs.outputJson(KRV_PATH, krvData, { spaces: 0 });
        await fs.remove(PROGRESS_PATH);

        console.log('\n\n' + '='.repeat(50));
        console.log('✅ 완료!');
        console.log(`   성공: ${patchedCount}`);
        console.log(`   실패: ${failedCount}`);
        console.log(`   시간: ${Math.round((Date.now() - startTime) / 1000)}초`);
        console.log('='.repeat(50));

    } catch (e) {
        console.error('\n❌', e.message);
    } finally {
        await browser.close();
    }
}

main().catch(console.error);
