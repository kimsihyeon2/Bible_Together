/**
 * 성경 데이터 심층 수정 (Deep Fix)
 * 1. 긴 문장(25자 이상) 중복 제거
 * 2. 유령 구절(Ghost Verses) 삭제 (예: 시편 87:87이 87:1과 동일한 경우)
 */
const fs = require('fs-extra');

async function fixDeep() {
    console.log('🛠️ 심층 수정 시작\n');

    // 타겟: KLB만 (Easy 성경은 상용구 위주라 패스)
    const filePath = 'public/bible/ko_klb.json';
    const bible = await fs.readJson(filePath);
    let patchedCount = 0;
    let deletedCount = 0;
    const logs = [];

    for (const [book, chapters] of Object.entries(bible)) {
        for (const [chapter, verses] of Object.entries(chapters)) {
            const verseEnts = Object.entries(verses);

            // 1. 유령 구절 삭제 검사 (Chapter == Verse && Text == Verse 1 Text)
            // 예: 시편 87편 87절이 87편 1절과 같으면 삭제
            if (verses[chapter]) {
                const ghostText = verses[chapter];
                const verse1Text = verses['1'];

                if (ghostText && verse1Text && ghostText.startsWith(verse1Text.substring(0, 20))) {
                    console.log(`👻 유령 구절 삭제: ${book} ${chapter}:${chapter}`);
                    delete verses[chapter];
                    deletedCount++;
                    logs.push({ type: 'DELETE_GHOST', loc: `${book} ${chapter}:${chapter}` });
                    continue; // 삭제했으니 다음 루프
                }
            }

            // 2. 중복 텍스트 제거
            for (let i = 0; i < verseEnts.length; i++) {
                const [vTarget, textTarget] = verseEnts[i];
                if (!verses[vTarget]) continue; // 이미 삭제된 경우

                if (textTarget.length < 30) continue;

                for (let j = 0; j < verseEnts.length; j++) {
                    if (i === j) continue;
                    const [vSource, textSource] = verseEnts[j];

                    // 소스 조건 강화: 25자 이상 (상용구 오탐 방지)
                    if (textSource.length < 25) continue;

                    // 포함 관계 검사
                    if (textTarget.startsWith(textSource)) {
                        const remaining = textTarget.substring(textSource.length).trim();

                        // 남은 텍스트가 너무 짧으면 의심 (하지만 유령구절이 아닌 실제 중복일 수 있음)
                        // 남은 텍스트가 5자 이상이면 패치
                        if (remaining.length >= 5) {
                            verses[vTarget] = remaining; // 수정 적용
                            patchedCount++;
                            logs.push({
                                type: 'FIX_DUPE',
                                loc: `${book} ${chapter}:${vTarget}`,
                                before: textTarget.substring(0, 20) + '...',
                                after: remaining.substring(0, 20) + '...'
                            });
                            break; // 하나 수정했으면 다음 타겟으로
                        }
                    }
                    // 중간 포함 검사 (매우 긴 소스만, > 50자)
                    else if (textTarget.includes(textSource) && textSource.length > 50) {
                        const remaining = textTarget.replace(textSource, '').trim();
                        if (remaining.length >= 5) {
                            verses[vTarget] = remaining;
                            patchedCount++;
                            logs.push({
                                type: 'FIX_INCLUSION',
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
    await fs.outputJson('deep_fix_log.json', logs, { spaces: 2 });

    console.log(`\n✅ 심층 수정 완료`);
    console.log(`   수정된 구절: ${patchedCount}`);
    console.log(`   삭제된 유령 구절: ${deletedCount}`);
}

fixDeep().catch(console.error);
