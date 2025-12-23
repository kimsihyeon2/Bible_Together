/**
 * bible.json 완전 무결성 검사
 * 모든 책/장/절이 있는지 확인
 */
const fs = require('fs-extra');
const path = require('path');

// 각 책의 예상 장 수
const EXPECTED_CHAPTERS = {
    '창': 50, '출': 40, '레': 27, '민': 36, '신': 34,
    '수': 24, '삿': 21, '룻': 4, '삼상': 31, '삼하': 24,
    '왕상': 22, '왕하': 25, '대상': 29, '대하': 36,
    '스': 10, '느': 13, '에': 10, '욥': 42, '시': 150,
    '잠': 31, '전': 12, '아': 8, '사': 66, '렘': 52,
    '애': 5, '겔': 48, '단': 12, '호': 14, '욜': 3,
    '암': 9, '옵': 1, '욘': 4, '미': 7, '나': 3,
    '합': 3, '습': 3, '학': 2, '슥': 14, '말': 4,
    '마': 28, '막': 16, '눅': 24, '요': 21,
    '행': 28, '롬': 16, '고전': 16, '고후': 13,
    '갈': 6, '엡': 6, '빌': 4, '골': 4,
    '살전': 5, '살후': 3, '딤전': 6, '딤후': 4,
    '딛': 3, '몬': 1, '히': 13, '약': 5,
    '벧전': 5, '벧후': 3, '요일': 5, '요이': 1,
    '요삼': 1, '유': 1, '계': 22
};

const ABBREV_TO_FULL = {
    '창': '창세기', '출': '출애굽기', '레': '레위기', '민': '민수기', '신': '신명기',
    '수': '여호수아', '삿': '사사기', '룻': '룻기', '삼상': '사무엘상', '삼하': '사무엘하',
    '왕상': '열왕기상', '왕하': '열왕기하', '대상': '역대상', '대하': '역대하',
    '스': '에스라', '느': '느헤미야', '에': '에스더', '욥': '욥기', '시': '시편',
    '잠': '잠언', '전': '전도서', '아': '아가', '사': '이사야', '렘': '예레미야',
    '애': '예레미야애가', '겔': '에스겔', '단': '다니엘', '호': '호세아', '욜': '요엘',
    '암': '아모스', '옵': '오바댜', '욘': '요나', '미': '미가', '나': '나훔',
    '합': '하박국', '습': '스바냐', '학': '학개', '슥': '스가랴', '말': '말라기',
    '마': '마태복음', '막': '마가복음', '눅': '누가복음', '요': '요한복음',
    '행': '사도행전', '롬': '로마서', '고전': '고린도전서', '고후': '고린도후서',
    '갈': '갈라디아서', '엡': '에베소서', '빌': '빌립보서', '골': '골로새서',
    '살전': '데살로니가전서', '살후': '데살로니가후서', '딤전': '디모데전서', '딤후': '디모데후서',
    '딛': '디도서', '몬': '빌레몬서', '히': '히브리서', '약': '야고보서',
    '벧전': '베드로전서', '벧후': '베드로후서', '요일': '요한1서', '요이': '요한2서',
    '요삼': '요한3서', '유': '유다서', '계': '요한계시록'
};

async function fullAudit() {
    console.log('📖 bible.json 완전 무결성 검사\n');

    const data = await fs.readJson(path.join(__dirname, '../bible.json'));
    const keys = Object.keys(data);

    console.log(`총 구절 수: ${keys.length}\n`);

    // 구절 인덱싱
    const verses = {};
    const SORTED_ABBREVS = Object.keys(ABBREV_TO_FULL).sort((a, b) => b.length - a.length);

    for (const key of keys) {
        let abbrev = null;
        for (const ab of SORTED_ABBREVS) {
            if (key.startsWith(ab)) {
                abbrev = ab;
                break;
            }
        }
        if (!abbrev) continue;

        const rest = key.substring(abbrev.length);
        const [chap, verse] = rest.split(':');
        if (!chap || !verse) continue;

        if (!verses[abbrev]) verses[abbrev] = {};
        if (!verses[abbrev][chap]) verses[abbrev][chap] = new Set();
        verses[abbrev][chap].add(parseInt(verse));
    }

    // 책별 검사
    let missingChapters = [];
    let truncatedVerses = [];
    let totalIssues = 0;

    for (const [abbrev, expectedChaps] of Object.entries(EXPECTED_CHAPTERS)) {
        const bookName = ABBREV_TO_FULL[abbrev];
        const bookData = verses[abbrev] || {};
        const actualChaps = Object.keys(bookData).map(n => parseInt(n));

        // 누락된 장 확인
        for (let ch = 1; ch <= expectedChaps; ch++) {
            if (!actualChaps.includes(ch)) {
                missingChapters.push(`${bookName} ${ch}장`);
                totalIssues++;
            }
        }
    }

    // 잘린 구절 검사 (너무 짧은 구절)
    for (const key of keys) {
        const verse = data[key];
        if (verse.length < 5) {
            truncatedVerses.push({ key, verse, reason: 'TOO_SHORT' });
            totalIssues++;
        }
    }

    // 결과 출력
    console.log('=== 검사 결과 ===\n');

    if (missingChapters.length > 0) {
        console.log(`❌ 누락된 장: ${missingChapters.length}개`);
        missingChapters.slice(0, 5).forEach(c => console.log(`   - ${c}`));
    } else {
        console.log('✅ 모든 장이 존재합니다!');
    }

    if (truncatedVerses.length > 0) {
        console.log(`\n⚠️ 너무 짧은 구절: ${truncatedVerses.length}개`);
        truncatedVerses.slice(0, 5).forEach(v => console.log(`   - ${v.key}: "${v.verse}"`));
    } else {
        console.log('✅ 너무 짧은 구절 없음!');
    }

    // 샘플 구절 확인
    console.log('\n=== 주요 구절 샘플 ===');
    const samples = ['창1:1', '창27:19', '요3:16', '시23:1', '롬8:28', '계22:21'];
    samples.forEach(key => {
        if (data[key]) {
            const v = data[key];
            console.log(`${key}: ${v.substring(0, 50)}${v.length > 50 ? '...' : ''} (${v.length}자)`);
        } else {
            console.log(`${key}: ❌ 없음`);
        }
    });

    console.log('\n' + '='.repeat(50));
    if (totalIssues === 0) {
        console.log('🎉 bible.json은 완전합니다!');
    } else {
        console.log(`⚠️ 총 ${totalIssues}개 문제 발견`);
    }
}

fullAudit().catch(console.error);
