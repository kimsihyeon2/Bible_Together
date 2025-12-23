/**
 * 간단한 무결성 검사 - 결과를 JSON으로 저장
 */
const fs = require('fs-extra');
const path = require('path');

async function audit() {
    const data = await fs.readJson(path.join(__dirname, '../bible.json'));
    const keys = Object.keys(data);

    // 너무 짧은 구절
    const shortVerses = [];
    for (const key of keys) {
        const verse = data[key];
        if (verse.length < 5) {
            shortVerses.push({ key, verse, length: verse.length });
        }
    }

    // 주요 구절 확인
    const samples = {
        '창1:1': data['창1:1'],
        '창27:19': data['창27:19'],
        '요3:16': data['요3:16'],
        '시23:1': data['시23:1'],
        '롬8:28': data['롬8:28'],
        '계22:21': data['계22:21']
    };

    const result = {
        totalVerses: keys.length,
        shortVerses: shortVerses,
        shortVersesCount: shortVerses.length,
        samples: samples
    };

    await fs.outputJson(path.join(__dirname, '../audit_result.json'), result, { spaces: 2 });
    console.log('결과가 audit_result.json에 저장됨');
    console.log('총 구절:', keys.length);
    console.log('문제 구절:', shortVerses.length);
}

audit().catch(console.error);
