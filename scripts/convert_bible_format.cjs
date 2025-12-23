/**
 * 🚀 bible.json을 ko_krv.json 형식으로 완전 변환
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

// 약어 정렬 (긴 것부터 매칭하기 위해)
const SORTED_ABBREVS = Object.keys(ABBREV_TO_FULL).sort((a, b) => b.length - a.length);

async function convert() {
    console.log('🚀 bible.json을 ko_krv.json 형식으로 변환 시작\n');

    const biblePath = path.join(__dirname, '../bible.json');
    const krvPath = path.join(__dirname, '../public/bible/ko_krv.json');
    const backupPath = path.join(__dirname, '../public/bible/ko_krv_backup.json');

    // 원본 백업
    console.log('📦 원본 파일 백업 중...');
    await fs.copy(krvPath, backupPath);

    // 데이터 로드
    const bibleData = await fs.readJson(biblePath);
    console.log(`bible.json 구절 수: ${Object.keys(bibleData).length}\n`);

    // 새 형식으로 변환
    const newKrv = {};
    let convertedCount = 0;
    let skippedCount = 0;

    for (const [key, verse] of Object.entries(bibleData)) {
        // 키 파싱: "창1:1" -> 창, 1, 1
        let bookAbbrev = null;
        let remaining = key;

        for (const abbrev of SORTED_ABBREVS) {
            if (key.startsWith(abbrev)) {
                bookAbbrev = abbrev;
                remaining = key.substring(abbrev.length);
                break;
            }
        }

        if (!bookAbbrev) {
            skippedCount++;
            continue;
        }

        const chapterVerse = remaining.split(':');
        if (chapterVerse.length !== 2) {
            skippedCount++;
            continue;
        }

        const chapter = chapterVerse[0];
        const verseNum = chapterVerse[1];
        const bookName = ABBREV_TO_FULL[bookAbbrev];

        // 구조 생성
        if (!newKrv[bookName]) newKrv[bookName] = {};
        if (!newKrv[bookName][chapter]) newKrv[bookName][chapter] = {};

        newKrv[bookName][chapter][verseNum] = verse.trim();
        convertedCount++;
    }

    // 저장
    console.log('💾 새 파일 저장 중...');
    await fs.outputJson(krvPath, newKrv, { spaces: 0 });

    const stats = await fs.stat(krvPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('\n' + '='.repeat(60));
    console.log('✅ 변환 완료!');
    console.log(`   변환됨: ${convertedCount}개`);
    console.log(`   스킵됨: ${skippedCount}개`);
    console.log(`   총 책 수: ${Object.keys(newKrv).length}권`);
    console.log(`   파일 크기: ${sizeMB} MB`);
    console.log(`   백업: ${backupPath}`);
    console.log('='.repeat(60));

    // 결과 확인
    console.log('\n=== 변환 후 샘플 확인 ===');
    console.log('창세기 27:19:', newKrv['창세기']['27']['19']);
    console.log('요한복음 3:16:', newKrv['요한복음']['3']['16']);
    console.log('시편 23:1:', newKrv['시편']['23']['1']);
}

convert().catch(console.error);
