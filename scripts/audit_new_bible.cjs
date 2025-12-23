/**
 * bible.json 무결성 검사 스크립트
 */
const fs = require('fs-extra');
const path = require('path');

async function audit() {
    console.log('📖 bible.json 무결성 검사 시작\n');

    const data = await fs.readJson(path.join(__dirname, '../bible.json'));
    const keys = Object.keys(data);

    console.log(`총 구절 수: ${keys.length}`);

    // 책별 통계
    const bookStats = {};
    let truncatedCount = 0;
    const truncatedVerses = [];

    // 검사 기준
    const TRUNCATION_PATTERNS = [
        /\s$/,           // 공백으로 끝남 (불완전 가능성)
        /[가-힣]$/,      // 정상: 한글로 끝남
    ];

    for (const key of keys) {
        const verse = data[key];
        const match = key.match(/^([가-힣]+)(\d+):(\d+)$/);

        if (match) {
            const book = match[1];
            const chapter = parseInt(match[2]);
            const verseNum = parseInt(match[3]);

            if (!bookStats[book]) {
                bookStats[book] = { count: 0, chapters: new Set() };
            }
            bookStats[book].count++;
            bookStats[book].chapters.add(chapter);

            // 잘림 검사 (매우 짧은 구절)
            if (verse.length < 10) {
                truncatedCount++;
                truncatedVerses.push({ key, verse, reason: 'TOO_SHORT' });
            }
            // 이상하게 끝나는 구절
            else if (verse.endsWith('...') || verse.endsWith('?..')) {
                truncatedCount++;
                truncatedVerses.push({ key, verse: verse.substring(0, 50), reason: 'ELLIPSIS' });
            }
        }
    }

    // 책별 통계 출력
    console.log('\n=== 책별 통계 ===');
    const bookList = Object.entries(bookStats).sort((a, b) => b[1].count - a[1].count);
    bookList.slice(0, 10).forEach(([book, stats]) => {
        console.log(`${book}: ${stats.count}절, ${stats.chapters.size}장`);
    });

    console.log(`\n총 ${Object.keys(bookStats).length}권`);

    // 잘린 구절 출력
    if (truncatedCount > 0) {
        console.log(`\n⚠️ 의심되는 잘린 구절: ${truncatedCount}개`);
        truncatedVerses.slice(0, 10).forEach(v => {
            console.log(`  ${v.key}: ${v.verse} (${v.reason})`);
        });
    } else {
        console.log('\n✅ 의심되는 잘린 구절 없음!');
    }

    // 특정 구절 확인
    console.log('\n=== 주요 구절 확인 ===');
    const checkVerses = ['창27:19', '창1:1', '요3:16', '시23:1', '계22:21'];
    checkVerses.forEach(key => {
        if (data[key]) {
            console.log(`${key}: ${data[key].substring(0, 60)}...`);
        } else {
            console.log(`${key}: ❌ 없음`);
        }
    });

    // 결과 요약
    const summary = {
        totalVerses: keys.length,
        totalBooks: Object.keys(bookStats).length,
        truncatedCount,
        verified: truncatedCount === 0
    };

    await fs.outputJson(path.join(__dirname, '../bible_audit_new.json'), summary, { spaces: 2 });
    console.log('\n✅ 검사 완료! 결과가 bible_audit_new.json에 저장됨');
}

audit().catch(console.error);
