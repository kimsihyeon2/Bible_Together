/**
 * 🚀 SOTA 개역개정 성경 패치 스크립트 v2
 * 
 * 문제 수정:
 * 1. GitHub 데이터에서 HTML entities (&amp;#x27; 등) 정리
 * 2. 패치 로직 개선
 */

const fs = require('fs-extra');
const path = require('path');

// HTML entities 디코딩
function decodeHtmlEntities(text) {
    if (!text) return text;
    return text
        .replace(/&amp;#x27;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/!/g, '')  // Remove exclamation marks if they're formatting artifacts
        .trim();
}

async function main() {
    console.log('🚀 SOTA 개역개정 성경 패치 v2 시작!\n');

    // 파일 경로
    const krvPath = path.join(__dirname, '../public/bible/ko_krv.json');
    const githubPath = path.join(__dirname, '../temp_ko_bible.json');
    const auditPath = path.join(__dirname, '../bible_audit_report.json');

    // 데이터 로드
    const krv = await fs.readJson(krvPath);
    const githubData = await fs.readJson(githubPath);
    const auditReport = await fs.readJson(auditPath);

    console.log(`감사 보고서: ${auditReport.length}개 잘린 구절\n`);

    // 약어 -> 한글 책 이름 매핑
    const abbrevToKorean = {
        'gn': '창세기', 'ex': '출애굽기', 'lv': '레위기', 'nm': '민수기', 'dt': '신명기',
        'js': '여호수아', 'jg': '사사기', 'rt': '룻기', '1sm': '사무엘상', '2sm': '사무엘하',
        '1kn': '열왕기상', '2kn': '열왕기하', '1ch': '역대상', '2ch': '역대하',
        'esd': '에스라', 'ne': '느헤미야', 'et': '에스더', 'job': '욥기', 'sl': '시편',
        'pr': '잠언', 'ec': '전도서', 'ca': '아가', 'is': '이사야', 'jr': '예레미야',
        'lm': '예레미야애가', 'ez': '에스겔', 'dn': '다니엘', 'os': '호세아', 'jl': '요엘',
        'am': '아모스', 'ob': '오바댜', 'jn': '요나', 'mq': '미가', 'na': '나훔',
        'hc': '하박국', 'sf': '스바냐', 'ag': '학개', 'zc': '스가랴', 'ml': '말라기',
        'mt': '마태복음', 'mc': '마가복음', 'lc': '누가복음', 'jo': '요한복음',
        'at': '사도행전', 'rm': '로마서', '1co': '고린도전서', '2co': '고린도후서',
        'gl': '갈라디아서', 'ef': '에베소서', 'fl': '빌립보서', 'cl': '골로새서',
        '1ts': '데살로니가전서', '2ts': '데살로니가후서', '1tm': '디모데전서', '2tm': '디모데후서',
        'tt': '디도서', 'fm': '빌레몬서', 'hb': '히브리서', 'tg': '야고보서',
        '1pe': '베드로전서', '2pe': '베드로후서', '1jo': '요한1서', '2jo': '요한2서',
        '3jo': '요한3서', 'jd': '유다서', 'ap': '요한계시록'
    };

    // GitHub 데이터를 한글 책 이름으로 인덱싱
    const githubByBook = {};
    for (const book of githubData) {
        const koreanName = abbrevToKorean[book.abbrev];
        if (koreanName) {
            githubByBook[koreanName] = book.chapters;
        }
    }

    console.log(`GitHub 데이터: ${Object.keys(githubByBook).length}권\n`);

    // 테스트: 창세기 27:19
    console.log('=== 창세기 27:19 비교 ===');
    const githubGen27_19 = decodeHtmlEntities(githubByBook['창세기'][26][18]);
    const krvGen27_19 = krv['창세기']['27']['19'];
    console.log('GitHub 길이:', githubGen27_19.length);
    console.log('KRV 길이:', krvGen27_19.length);
    console.log('GitHub 끝:', githubGen27_19.slice(-30));
    console.log('KRV 끝:', krvGen27_19.slice(-30));
    console.log('');

    // 패치 시작
    let patchedCount = 0;
    let notFoundCount = 0;
    let sameLengthCount = 0;

    for (const item of auditReport) {
        const { book, chapter, verse } = item;

        const bookChapters = githubByBook[book];
        if (!bookChapters) {
            notFoundCount++;
            continue;
        }

        const chapterIndex = parseInt(chapter) - 1;
        const verseIndex = parseInt(verse) - 1;

        if (!bookChapters[chapterIndex] || !bookChapters[chapterIndex][verseIndex]) {
            notFoundCount++;
            continue;
        }

        const githubVerse = decodeHtmlEntities(bookChapters[chapterIndex][verseIndex]);
        const currentVerse = krv[book][chapter][verse];

        // GitHub 버전이 더 길면 패치
        if (githubVerse.length > currentVerse.length) {
            krv[book][chapter][verse] = githubVerse;
            patchedCount++;
        } else {
            sameLengthCount++;
        }
    }

    // 저장
    await fs.outputJson(krvPath, krv, { spaces: 0 });

    const stats = await fs.stat(krvPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('='.repeat(60));
    console.log('✅ 패치 완료!');
    console.log(`   패치됨: ${patchedCount}개`);
    console.log(`   이미 같은 길이: ${sameLengthCount}개`);
    console.log(`   찾지 못함: ${notFoundCount}개`);
    console.log(`   파일 크기: ${sizeMB} MB`);
    console.log('='.repeat(60));

    // 패치 후 확인
    console.log('\n=== 패치 후 창세기 27:19 ===');
    const patchedKrv = await fs.readJson(krvPath);
    console.log(patchedKrv['창세기']['27']['19']);
}

main().catch(console.error);
