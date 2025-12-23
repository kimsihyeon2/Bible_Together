/**
 * 성경 데이터 중복 오류 수정 스크립트
 * Target 구절이 Source 구절(주로 1절)을 포함하는 경우, 중복된 앞부분을 제거
 */
const fs = require('fs-extra');

async function fixDuplication() {
    console.log('🛠️ 중복 데이터 수정 시작 (N장 N절 <- N장 1절 패턴 등)\n');

    const filePath = 'public/bible/ko_klb.json';
    const backupPath = 'public/bible/ko_klb_pre_dupe_fix.json';

    // 백업
    await fs.copy(filePath, backupPath);
    console.log(`백업 완료: ${backupPath}`);

    const klb = await fs.readJson(filePath);
    let fixedCount = 0;
    const logs = [];

    for (const [book, chapters] of Object.entries(klb)) {
        for (const [chapter, verses] of Object.entries(chapters)) {
            const verseEnts = Object.entries(verses);

            for (let i = 0; i < verseEnts.length; i++) {
                const [vTarget, textTarget] = verseEnts[i];

                // 비교 대상 (주로 앞쪽 절들)
                for (let j = 0; j < verseEnts.length; j++) {
                    if (i === j) continue;
                    const [vSource, textSource] = verseEnts[j];

                    // 조건 1: Source가 충분히 길어야 함 (상용구 오탐 방지)
                    if (textSource.length < 30) continue;

                    // 조건 2: Target이 Source로 시작해야 함
                    if (textTarget.startsWith(textSource)) {

                        // 조건 3: N장 N절이 N장 1절을 포함하는 패턴이거나, 중복 제거 후 남은 내용이 정상적이어야 함
                        const remaining = textTarget.substring(textSource.length).trim();

                        // 남은 텍스트가 너무 짧으면 의심스러움 (최소 5자 이상)
                        if (remaining.length < 5) {
                            console.log(`⚠️ 스킵 (남은 텍스트 너무 짧음): [${book} ${chapter}:${vTarget}] (남음: "${remaining}")`);
                            continue;
                        }

                        // 수정 적용
                        klb[book][chapter][vTarget] = remaining;
                        fixedCount++;

                        logs.push({
                            target: `${book} ${chapter}:${vTarget}`,
                            source: `${book} ${chapter}:${vSource}`,
                            removed: textSource.substring(0, 20) + '...',
                            result: remaining.substring(0, 20) + '...'
                        });

                        // 중복 수정 후, 현재 구절 텍스트가 업데이트되었으므로 루프 계속 진행 (다중 중복 가능성?)
                        // 일단 여기서는 Break하고 다음 타겟으로 (한 구절에 여러 중복이 있을 확률은 낮음)
                        break;
                    }
                }
            }
        }
    }

    // 결과 저장
    await fs.outputJson(filePath, klb, { spaces: 0 });
    await fs.outputJson('duplication_fix_log.json', logs, { spaces: 2 });

    console.log(`\n✅ 수정 완료: 총 ${fixedCount}개 구절 패치됨`);
    console.log('상세 로그: duplication_fix_log.json');
    console.log('파일 저장됨:', filePath);

    // 검증 샘플 (제보된 내용)
    console.log('\n=== 검증 샘플 (창세기 3:3) ===');
    console.log('수정 후:', klb['창세기']?.['3']?.['3']);
}

fixDuplication().catch(console.error);
