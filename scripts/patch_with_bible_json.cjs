/**
 * 🚀 bible.json을 사용하여 ko_krv.json 패치
 * 
 * bible.json 형식: {"창1:1": "태초에...", "창1:2": "..."}
 * ko_krv.json 형식: {"창세기": {"1": {"1": "태초에..."}}}
 */

const fs = require('fs-extra');
const path = require('path');

// 약어 -> 전체 이름 매핑
const ABBREV_TO_FULL = {
    '창': '창세기', '출': '출애굽기', '레': '레위기', '민': '민수기', '신': '신명기',
    '수': '여호수아', '삿': '사사기', '룻': '룻기', '삼상': '사무엘상', '삼하': '사무엘하',
    '왕상': '열왕기상', '왕하': '열왕기하', '대상': '역대상', '대하': '역대하',
    '스': '에스라', '느': '느헤미야', '에': '에스더', '욥': '욥기', '시': '시편',
    '잠': '잠언', '전': '전도서', '아': '아가', '사': '이사야', '렘': '예레미야',
    '애': '예레미야애가', '겔': '에스겔', '단': '다니엘', '호': '호세아', '욜': '요엘',
    '암': '아모스', '옵': '오바댜', '욘': '요나', '미': '미가', '나': '나훔',
    '합': '하박국', '습': '스바냐', '학': '학개', '슥': '스가랴', '말': '말라기',
    '마': '마태복음', '막': '마가복음', '눅': '누가복음', '요': '요한복음',
    '행': '사도행전', '롬': '로마서', '고전': '고린도전서', '고후': '고린도후서',
    '갈': '갈라디아서', '엡': '에베소서', '빌': '빌립보서', '골': '골로새서',
    '살전': '데살로니가전서', '살후': '데살로니가후서', '딤전': '디모데전서', '딤후': '디모데후서',
    '딛': '디도서', '몬': '빌레몬서', '히': '히브리서', '약': '야고보서',
    '벧전': '베드로전서', '벧후': '베드로후서', '요일': '요한1서', '요이': '요한2서',
    '요삼': '요한3서', '유': '유다서', '계': '요한계시록'
};

async function patch() {
    console.log('🚀 bible.json으로 ko_krv.json 패치 시작\n');

    const biblePath = path.join(__dirname, '../bible.json');
    const krvPath = path.join(__dirname, '../public/bible/ko_krv.json');
    const auditPath = path.join(__dirname, '../bible_audit_report.json');

    // 데이터 로드
    const bibleData = await fs.readJson(biblePath);
    const krvData = await fs.readJson(krvPath);
    const auditReport = await fs.readJson(auditPath);

    console.log(`bible.json 구절 수: ${Object.keys(bibleData).length}`);
    console.log(`ko_krv.json 패치 대상: ${auditReport.length}개 잘린 구절\n`);

    let patchedCount = 0;
    let notFoundCount = 0;
    let sameLengthCount = 0;

    for (const item of auditReport) {
        const { book, chapter, verse } = item;

        // 전체 이름 -> 약어 변환
        let abbrev = null;
        for (const [ab, full] of Object.entries(ABBREV_TO_FULL)) {
            if (full === book) {
                abbrev = ab;
                break;
            }
        }

        if (!abbrev) {
            notFoundCount++;
            continue;
        }

        // bible.json 키 형식: "창27:19"
        const bibleKey = `${abbrev}${chapter}:${verse}`;
        const newVerse = bibleData[bibleKey];

        if (!newVerse) {
            notFoundCount++;
            continue;
        }

        const currentVerse = krvData[book]?.[chapter]?.[verse] || '';

        // 새 버전이 더 길면 패치
        if (newVerse.length > currentVerse.length) {
            // 경로가 없으면 생성
            if (!krvData[book]) krvData[book] = {};
            if (!krvData[book][chapter]) krvData[book][chapter] = {};

            krvData[book][chapter][verse] = newVerse.trim();
            patchedCount++;
        } else {
            sameLengthCount++;
        }
    }

    // 저장
    await fs.outputJson(krvPath, krvData, { spaces: 0 });

    const stats = await fs.stat(krvPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('='.repeat(60));
    console.log('✅ 패치 완료!');
    console.log(`   패치됨: ${patchedCount}개`);
    console.log(`   이미 완전: ${sameLengthCount}개`);
    console.log(`   찾지 못함: ${notFoundCount}개`);
    console.log(`   파일 크기: ${sizeMB} MB`);
    console.log('='.repeat(60));

    // 결과 확인
    console.log('\n=== 패치 후 창세기 27:19 확인 ===');
    const updatedKrv = await fs.readJson(krvPath);
    console.log(updatedKrv['창세기']['27']['19']);
}

patch().catch(console.error);
