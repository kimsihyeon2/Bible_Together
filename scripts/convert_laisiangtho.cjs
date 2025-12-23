/**
 * laisiangtho/bible JSON을 앱 형식으로 변환 (수정본)
 * 
 * laisiangtho 형식: {book: {"1": {chapter: {"1": {verse: {"1": {text: "..."}}}}}}}
 * 앱 형식: {"창세기": {"1": {"1": "태초에..."}}}
 */

const fs = require('fs-extra');
const path = require('path');

// bookId -> 한국어 이름 매핑
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

async function convert(inputFile, outputFile, versionName) {
    console.log(`\n🚀 ${versionName} 변환 시작: ${inputFile}`);

    const rawData = await fs.readJson(inputFile);
    const result = {};
    let verseCount = 0;

    // book 객체 순회
    const books = rawData.book || {};

    for (const [bookId, bookData] of Object.entries(books)) {
        const bookName = BOOK_NAMES[bookId];
        if (!bookName) continue;

        result[bookName] = {};
        const chapters = bookData.chapter || {};

        for (const [chapterNum, chapterData] of Object.entries(chapters)) {
            result[bookName][chapterNum] = {};
            const verses = chapterData.verse || {};

            for (const [verseNum, verseData] of Object.entries(verses)) {
                const text = verseData.text || '';
                if (text) {
                    result[bookName][chapterNum][verseNum] = text.trim();
                    verseCount++;
                }
            }
        }
    }

    // 저장
    await fs.outputJson(outputFile, result, { spaces: 0 });

    const stats = await fs.stat(outputFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log(`✅ ${versionName} 변환 완료!`);
    console.log(`   총 구절: ${verseCount}개`);
    console.log(`   총 책: ${Object.keys(result).length}권`);
    console.log(`   파일 크기: ${sizeMB} MB`);

    return verseCount;
}

async function main() {
    console.log('📖 현대인의 성경 (KLB) 변환\n');

    // KLB 변환
    if (await fs.pathExists('klb_raw.json')) {
        await convert('klb_raw.json', 'public/bible/ko_klb.json', '현대인의 성경 (KLB)');
    }

    // 샘플 확인
    console.log('\n=== 변환 결과 확인 ===');
    if (await fs.pathExists('public/bible/ko_klb.json')) {
        const klb = await fs.readJson('public/bible/ko_klb.json');
        console.log('창세기 1:1:', klb['창세기']?.['1']?.['1']?.substring(0, 60));
        console.log('창세기 27:19:', klb['창세기']?.['27']?.['19']?.substring(0, 60));
        console.log('요한복음 3:16:', klb['요한복음']?.['3']?.['16']?.substring(0, 60));
    }
}

main().catch(console.error);
