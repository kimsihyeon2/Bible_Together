/**
 * 성경 데이터 심층 중복 감사 (Deep Audit)
 * 모든 유형의 재귀적 텍스트 포함 관계를 탐지
 */
const fs = require('fs-extra');

async function deepAudit() {
    console.log('🔍 성경 데이터 심층 감사 (Deep Audit) 시작\n');

    // 대상 파일 목록
    const files = ['public/bible/ko_klb.json', 'public/bible/ko_easy.json'];
    const report = {};

    for (const filePath of files) {
        if (!await fs.pathExists(filePath)) continue;

        const fileName = filePath.split('/').pop();
        console.log(`Analyzing ${fileName}...`);
        const bible = await fs.readJson(filePath);
        const issues = [];

        for (const [book, chapters] of Object.entries(bible)) {
            for (const [chapter, verses] of Object.entries(chapters)) {
                const verseList = Object.entries(verses);

                // N^2 비교 (한 챕터 내에서)
                for (let i = 0; i < verseList.length; i++) {
                    const [vTarget, tTarget] = verseList[i];

                    // 너무 짧은 타겟은 무시 (예: "아멘")
                    if (tTarget.length < 20) continue;

                    for (let j = 0; j < verseList.length; j++) {
                        if (i === j) continue;
                        const [vSource, tSource] = verseList[j];

                        // 소스가 너무 짧으면 오탐 가능성 높음 (예: "그가 가로되")
                        if (tSource.length < 15) continue;

                        let type = null;

                        // 1. Prefix Check (가장 흔한 패턴)
                        if (tTarget.startsWith(tSource)) {
                            if (vSource === '1') type = 'STARTS_WITH_VERSE_1';
                            else if (Number(vTarget) === Number(vSource) + 1) type = 'STARTS_WITH_PREV_VERSE';
                            else type = 'STARTS_WITH_OTHER_VERSE';
                        }
                        // 2. Inclusion Check (중간에 포함) - 소스가 아주 길어야만 인정 (오탐 방지)
                        else if (tTarget.includes(tSource) && tSource.length > 30) {
                            type = 'CONTAINS_VERSE_MIDDLE';
                        }

                        if (type) {
                            const remaining = tTarget.replace(tSource, '').trim();

                            // 남은 텍스트가 의미있는지 체크
                            if (remaining.length < 5) continue; // 거의 똑같은 구절인 경우

                            issues.push({
                                type,
                                location: `${book} ${chapter}:${vTarget}`,
                                sourceLoc: `${book} ${chapter}:${vSource}`,
                                targetLen: tTarget.length,
                                sourceLen: tSource.length,
                                duplicated: tSource.substring(0, 30) + '...',
                                remaining: remaining.substring(0, 30) + '...'
                            });

                            // 하나의 타겟에 대해 가장 긴 매칭 하나만 리포트 (중복 방지)
                            // 주로 Verse 1이 포함되고 또 그게 포함된 Verse N-1도 포함될 수 있음
                            // 여기서는 일단 다 수집하고 분석 단계에서 필터링
                        }
                    }
                }
            }
        }
        report[fileName] = issues;
        console.log(`  => Found ${issues.length} issues in ${fileName}`);
    }

    await fs.outputJson('deep_audit_report.json', report, { spaces: 2 });
    console.log('\n📄 심층 리포트 저장: deep_audit_report.json');
}

deepAudit().catch(console.error);
