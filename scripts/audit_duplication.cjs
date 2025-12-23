/**
 * 성경 데이터 중복 오류 감사 스크립트
 * 한 구절이 다른 구절(주로 같은 장의 앞 구절)의 텍스트를 포함하고 있는지 검사
 */
const fs = require('fs-extra');

async function auditDuplication() {
    console.log('🔍 데이터 중복 오류 감사 시작\n');

    const klb = await fs.readJson('public/bible/ko_klb.json');
    const issues = [];
    let checkedCount = 0;

    for (const [book, chapters] of Object.entries(klb)) {
        for (const [chapter, verses] of Object.entries(chapters)) {
            // 해당 장의 모든 구절 텍스트 수집
            const verseEnts = Object.entries(verses);

            for (let i = 0; i < verseEnts.length; i++) {
                const [vTarget, textTarget] = verseEnts[i];
                checkedCount++;

                if (textTarget.length < 20) continue; // 너무 짧은 건 패스

                // 같은 장의 다른 구절들과 비교
                for (let j = 0; j < verseEnts.length; j++) {
                    if (i === j) continue;
                    const [vSource, textSource] = verseEnts[j];

                    if (textSource.length < 15) continue; // 너무 짧은 소스는 오탐 가능성 높음

                    // Target이 Source로 시작하는지 검사
                    if (textTarget.startsWith(textSource)) {
                        // 단순히 우연히 겹치는 문장인지 확인 (예: "여호와께서 말씀하셨다")
                        // 중복된 길이가 충분히 긴지(15자 이상) 확인
                        // 그리고 남은 텍스트가 의미가 있는지 확인

                        const remaining = textTarget.substring(textSource.length).trim();

                        issues.push({
                            location: `${book} ${chapter}:${vTarget}`,
                            source: `${book} ${chapter}:${vSource}`,
                            targetLen: textTarget.length,
                            sourceLen: textSource.length,
                            duplicatedText: textSource.substring(0, 30) + '...',
                            remainingText: remaining.substring(0, 30) + '...'
                        });
                    }
                }
            }
        }
    }

    console.log(`총 검사: ${checkedCount} 구절`);
    console.log(`발견된 의심 사례: ${issues.length} 건`);

    if (issues.length > 0) {
        console.log('\n=== 발견된 중복 오류 샘플 ===');
        issues.slice(0, 20).forEach(issue => {
            console.log(`\n🔴 [${issue.location}] 에 [${issue.source}] 내용이 포함됨`);
            console.log(`   중복: "${issue.duplicatedText}"`);
            console.log(`   나머지: "${issue.remainingText}"`);
        });

        await fs.outputJson('duplication_audit_report.json', issues, { spaces: 2 });
        console.log('\n상세 리포트 저장: duplication_audit_report.json');
    }
}

auditDuplication().catch(console.error);
