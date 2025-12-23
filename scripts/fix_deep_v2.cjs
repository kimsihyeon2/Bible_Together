/**
 * 성경 데이터 심층 수정 V2 (Deep Fix)
 * 1. 긴 문장(30자 이상) prefix 중복 제거 (Target이 Source로 시작할 때)
 * 2. 유령 구절 안전하게 삭제 (절 번호가 총 절 수보다 터무니없이 클 때)
 */
const fs = require('fs-extra');

async function fixDeepV2() {
    console.log('🛠️ 심층 수정 V2 시작\n');

    const filePath = 'public/bible/ko_klb.json';
    // 백업
    await fs.copy(filePath, 'public/bible/ko_klb_backup_deep.json');

    const bible = await fs.readJson(filePath);
    let patchedCount = 0;
    let deletedCount = 0;
    const logs = [];

    for (const [book, chapters] of Object.entries(bible)) {
        for (const [chapter, verses] of Object.entries(chapters)) {
            const verseEnts = Object.entries(verses);
            const totalVerses = verseEnts.length;

            // 1. 유령 구절 삭제 (안전 모드)
            // 조건: Chapter == Verse (예: 87장 87절)
            // 안전장치: 절 번호가 (총 절 수 + 5) 보다 커야 함.
            // (예: 1장 1절은 총 30절 중 1 < 35 이므로 안전)
            // (예: 87장 87절은 총 7절 중 87 > 12 이므로 삭제 대상)
            // 추가: 유령 구절 내용이 1절과 동일한지 확인
            if (verses[chapter]) {
                const ghostVerNum = Number(chapter);
                if (ghostVerNum > totalVerses + 5) {
                    const ghostText = verses[chapter];
                    const verse1Text = verses['1'];

                    if (verse1Text && ghostText.startsWith(verse1Text.substring(0, 20))) {
                        console.log(`👻 유령 구절 삭제: ${book} ${chapter}:${chapter} (총 ${totalVerses}절)`);
                        delete verses[chapter];
                        deletedCount++;
                        logs.push({ type: 'DELETE_GHOST', loc: `${book} ${chapter}:${chapter}` });
                        continue;
                    }
                }
            }

            // 2. 중복 텍스트 제거
            for (let i = 0; i < verseEnts.length; i++) {
                const [vTarget, textTarget] = verseEnts[i];
                if (!verses[vTarget]) continue;

                if (textTarget.length < 30) continue;

                for (let j = 0; j < verseEnts.length; j++) {
                    if (i === j) continue;
                    const [vSource, textSource] = verseEnts[j];

                    // 소스 길이 30자 이상
                    if (textSource.length < 30) continue;

                    // Prefix 중복 체크
                    if (textTarget.startsWith(textSource)) {
                        const remaining = textTarget.substring(textSource.length).trim();

                        // 남은 텍스트가 의미 있어야 함 (5자 이상)
                        if (remaining.length >= 5) {
                            verses[vTarget] = remaining;
                            patchedCount++;
                            logs.push({
                                type: 'FIX_DUPE',
                                loc: `${book} ${chapter}:${vTarget}`,
                                before: textTarget.substring(0, 20) + '...',
                                after: remaining.substring(0, 20) + '...'
                            });
                            break;
                        }
                    }
                }
            }
        }
    }

    // 파일 저장
    await fs.outputJson(filePath, bible, { spaces: 0 });
    await fs.outputJson('deep_fix_v2_log.json', logs, { spaces: 2 });

    console.log(`\n✅ 심층 수정 V2 완료`);
    console.log(`   수정된 구절: ${patchedCount}`);
    console.log(`   삭제된 유령 구절: ${deletedCount}`);
}

fixDeepV2().catch(console.error);
