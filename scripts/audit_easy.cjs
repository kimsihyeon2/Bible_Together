/**
 * ko_easy.json (쉬운성경) 상세 감사
 */
const fs = require('fs-extra');

async function auditEasy() {
    console.log('📖 ko_easy.json 상세 감사\n');

    const data = await fs.readJson('public/bible/ko_easy.json');

    const issues = {
        truncatedStart: [],
        tooShort: [],
        ellipsis: []
    };

    let totalVerses = 0;

    for (const [book, chapters] of Object.entries(data)) {
        for (const [chapter, verses] of Object.entries(chapters)) {
            for (const [verse, text] of Object.entries(verses)) {
                totalVerses++;
                const key = `${book} ${chapter}:${verse}`;

                if (/^[,.:;!?]/.test(text)) {
                    issues.truncatedStart.push({ key, text: text.substring(0, 30) });
                }
                else if (text.length < 10 && text !== '(없음)') {
                    issues.tooShort.push({ key, text });
                }
            }
        }
    }

    console.log(`총 구절: ${totalVerses}`);
    console.log(`\n=== 문제 발견 ===`);
    console.log(`앞부분 잘림 (쉼표/점으로 시작): ${issues.truncatedStart.length}개`);
    console.log(`너무 짧음: ${issues.tooShort.length}개`);

    const total = issues.truncatedStart.length + issues.tooShort.length;
    console.log(`\n총 문제: ${total}개`);

    if (issues.truncatedStart.length > 0) {
        console.log('\n== 앞부분 잘린 구절 ==');
        issues.truncatedStart.slice(0, 10).forEach(v => console.log(`  ${v.key}: "${v.text}..."`));
    }

    if (issues.tooShort.length > 0) {
        console.log('\n== 너무 짧은 구절 ==');
        issues.tooShort.slice(0, 10).forEach(v => console.log(`  ${v.key}: "${v.text}"`));
    }

    // 샘플 확인
    console.log('\n=== 주요 구절 확인 ===');
    const samples = [['창세기', '1', '1'], ['창세기', '27', '19'], ['요한복음', '3', '16']];
    for (const [book, ch, v] of samples) {
        console.log(`${book} ${ch}:${v}: ${data[book]?.[ch]?.[v]?.substring(0, 60)}...`);
    }
}

auditEasy().catch(console.error);
