/**
 * KLB 성경 스마트 패치
 * 다운로드한 데이터로 진짜 잘린 구절만 수정
 */
const fs = require('fs-extra');

const BOOK_NAMES = {
    '1': '창세기', '2': '출애굽기', '3': '레위기', '4': '민수기', '5': '신명기',
    '6': '여호수아', '7': '사사기', '8': '룻기', '9': '사무엘상', '10': '사무엘하',
    '11': '열왕기상', '12': '열왕기하', '13': '역대상', '14': '역대하',
    '15': '에스라', '16': '느헤미야', '17': '에스더',
    '18': '욥기', '19': '시편', '20': '잠언', '21': '전도서', '22': '아가',
    '23': '이사야', '24': '예레미야', '25': '예레미야애가', '26': '에스겔', '27': '다니엘',
    '28': '호세아', '29': '요엘', '30': '아모스', '31': '오바댜', '32': '요나',
    '33': '미가', '34': '나훔', '35': '하박국', '36': '스바냐', '37': '학개', '38': '스가랴', '39': '말라기',
    '40': '마태복음', '41': '마가복음', '42': '누가복음', '43': '요한복음',
    '44': '사도행전', '45': '로마서', '46': '고린도전서', '47': '고린도후서',
    '48': '갈라디아서', '49': '에베소서', '50': '빌립보서', '51': '골로새서',
    '52': '데살로니가전서', '53': '데살로니가후서', '54': '디모데전서', '55': '디모데후서',
    '56': '디도서', '57': '빌레몬서',
    '58': '히브리서', '59': '야고보서', '60': '베드로전서', '61': '베드로후서',
    '62': '요한1서', '63': '요한2서', '64': '요한3서', '65': '유다서', '66': '요한계시록'
};

// 역매핑
const NAME_TO_ID = Object.fromEntries(Object.entries(BOOK_NAMES).map(([k, v]) => [v, k]));

async function smartPatch() {
    console.log('📖 KLB 스마트 패치 시작\n');

    const original = await fs.readJson('public/bible/ko_klb.json');
    const downloaded = await fs.readJson('klb_raw.json');
    const audit = await fs.readJson('klb_audit_report.json');

    let patchedCount = 0;
    let notFoundInDownload = 0;
    const changes = [];

    for (const issue of audit.allIssues) {
        const match = issue.key.match(/^(.+) (\d+):(\d+)$/);
        if (!match) continue;

        const [, book, chapter, verse] = match;
        const bookId = NAME_TO_ID[book];
        if (!bookId) continue;

        // 다운로드 데이터에서 찾기
        const downloadedText = downloaded.book?.[bookId]?.chapter?.[chapter]?.verse?.[verse]?.text;
        const currentText = original[book]?.[chapter]?.[verse] || '';

        if (downloadedText && downloadedText.length > currentText.length + 3) {
            // 다운로드 버전이 더 길면 패치
            original[book][chapter][verse] = downloadedText.trim();
            patchedCount++;
            changes.push({
                key: issue.key,
                before: currentText.substring(0, 30),
                after: downloadedText.substring(0, 30)
            });
        } else if (!downloadedText) {
            notFoundInDownload++;
        }
    }

    console.log('=== 패치 결과 ===');
    console.log(`패치된 구절: ${patchedCount}개`);
    console.log(`다운로드에도 없음: ${notFoundInDownload}개`);

    if (patchedCount > 0) {
        // 백업 및 저장
        await fs.copy('public/bible/ko_klb.json', 'public/bible/ko_klb_backup.json');
        await fs.outputJson('public/bible/ko_klb.json', original, { spaces: 0 });

        const stats = await fs.stat('public/bible/ko_klb.json');
        console.log(`파일 크기: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

        console.log('\n=== 변경 샘플 ===');
        changes.slice(0, 10).forEach(c => {
            console.log(`${c.key}:`);
            console.log(`  전: "${c.before}..."`);
            console.log(`  후: "${c.after}..."`);
        });
    } else {
        console.log('다운로드한 데이터로 패치 가능한 구절이 없습니다.');
    }

    // 결과 저장
    await fs.outputJson('klb_patch_result.json', { patchedCount, notFoundInDownload, changes }, { spaces: 2 });
}

smartPatch().catch(console.error);
