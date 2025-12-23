/**
 * KLB 성경 상세 감사
 * - 누락된 구절
 * - 잘린 구절 (앞부분이 특수문자로 시작)
 * - 너무 짧은 구절
 */
const fs = require('fs-extra');
const path = require('path');

async function auditKLB() {
    console.log('📖 ko_klb.json 상세 감사\n');

    const data = await fs.readJson('public/bible/ko_klb.json');

    const issues = {
        truncatedStart: [],  // 앞부분 잘림 (이상한 문자로 시작)
        tooShort: [],        // 너무 짧음
        ellipsis: [],        // ...으로 끝남
        other: []
    };

    let totalVerses = 0;

    for (const [book, chapters] of Object.entries(data)) {
        for (const [chapter, verses] of Object.entries(chapters)) {
            for (const [verse, text] of Object.entries(verses)) {
                totalVerses++;
                const key = `${book} ${chapter}:${verse}`;

                // 앞부분 잘림 검사
                if (/^[,.:;!?0-9]/.test(text)) {
                    issues.truncatedStart.push({ key, text: text.substring(0, 30), reason: 'STARTS_WITH_PUNCTUATION' });
                }
                // 너무 짧음
                else if (text.length < 10) {
                    issues.tooShort.push({ key, text, reason: 'TOO_SHORT' });
                }
                // ...으로 끝남
                else if (text.endsWith('...') && text.length < 20) {
                    issues.ellipsis.push({ key, text, reason: 'ELLIPSIS' });
                }
            }
        }
    }

    console.log(`총 구절: ${totalVerses}`);
    console.log(`\n=== 문제 발견 ===`);
    console.log(`앞부분 잘림: ${issues.truncatedStart.length}개`);
    console.log(`너무 짧음: ${issues.tooShort.length}개`);
    console.log(`...으로 끝남: ${issues.ellipsis.length}개`);

    const allIssues = [...issues.truncatedStart, ...issues.tooShort, ...issues.ellipsis];
    console.log(`\n총 문제 구절: ${allIssues.length}개`);

    // 예시 출력
    if (issues.truncatedStart.length > 0) {
        console.log('\n== 앞부분 잘린 구절 ==');
        issues.truncatedStart.slice(0, 10).forEach(v => {
            console.log(`  ${v.key}: "${v.text}..."`);
        });
    }

    if (issues.tooShort.length > 0) {
        console.log('\n== 너무 짧은 구절 ==');
        issues.tooShort.slice(0, 10).forEach(v => {
            console.log(`  ${v.key}: "${v.text}"`);
        });
    }

    // 결과 저장
    const report = {
        totalVerses,
        issues: {
            truncatedStart: issues.truncatedStart.length,
            tooShort: issues.tooShort.length,
            ellipsis: issues.ellipsis.length
        },
        allIssues
    };

    await fs.outputJson('klb_audit_report.json', report, { spaces: 2 });
    console.log('\n결과 저장: klb_audit_report.json');
}

auditKLB().catch(console.error);
