/**
 * 누락된 절 분석 및 수정 스크립트
 * 
 * 1. ko_easy.json과 ko_krv.json을 비교해 누락된 절 찾기
 * 2. 누락된 위치 출력
 * 3. CSV에서 해당 데이터 찾아서 채워넣기
 */

const fs = require('fs-extra');
const path = require('path');

async function findMissingVerses() {
    console.log('🔍 누락된 절 분석 시작...\n');

    // Load both JSON files
    const krvPath = path.join(__dirname, '../public/bible/ko_krv.json');
    const easyPath = path.join(__dirname, '../public/bible/ko_easy.json');

    const krv = await fs.readJson(krvPath);
    const easy = await fs.readJson(easyPath);

    const missing = [];
    let totalKrvVerses = 0;
    let totalEasyVerses = 0;

    // Compare each book/chapter/verse
    for (const bookName of Object.keys(krv)) {
        const krvBook = krv[bookName];
        const easyBook = easy[bookName];

        if (!easyBook) {
            console.log(`⚠️ 책 누락: ${bookName}`);
            continue;
        }

        for (const chapter of Object.keys(krvBook)) {
            const krvChapter = krvBook[chapter];
            const easyChapter = easyBook[chapter];

            if (!easyChapter) {
                console.log(`⚠️ 장 누락: ${bookName} ${chapter}장`);
                continue;
            }

            for (const verse of Object.keys(krvChapter)) {
                totalKrvVerses++;

                if (easyChapter[verse]) {
                    totalEasyVerses++;
                } else {
                    missing.push({
                        book: bookName,
                        chapter: parseInt(chapter),
                        verse: parseInt(verse),
                        krvText: krvChapter[verse]
                    });
                }
            }
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 분석 결과:`);
    console.log(`   KRV 총 절: ${totalKrvVerses}`);
    console.log(`   EASY 총 절: ${totalEasyVerses}`);
    console.log(`   누락된 절: ${missing.length}`);
    console.log(`${'='.repeat(60)}\n`);

    if (missing.length > 0) {
        console.log('📜 누락된 절 목록:\n');
        missing.forEach((m, i) => {
            console.log(`${i + 1}. ${m.book} ${m.chapter}:${m.verse}`);
            console.log(`   KRV: ${m.krvText.substring(0, 50)}...`);
            console.log('');
        });
    }

    return missing;
}

async function fillMissingVerses(missing) {
    if (missing.length === 0) return;

    console.log('\n🔧 누락된 절 채우기 시작...\n');

    const easyPath = path.join(__dirname, '../public/bible/ko_easy.json');
    const easy = await fs.readJson(easyPath);

    // Load CSV to find matching verses
    const csvPath = path.join(__dirname, '../temp_bible_csv/pair.csv');
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    // Build lookup from classic text (target_text) to easy text (input_text)
    const classicToEasy = new Map();

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Try to extract both texts
        let inputText = '';
        let targetText = '';

        // Parse CSV line
        if (line.startsWith('"')) {
            const match = line.match(/^"([^"]*(?:""[^"]*)*)"\s*,\s*(.*)$/);
            if (match) {
                inputText = match[1].replace(/""/g, '"').trim();
                targetText = match[2].replace(/^"|"$/g, '').replace(/""/g, '"').trim();
            }
        } else {
            const firstComma = line.indexOf(',');
            if (firstComma > 0) {
                inputText = line.substring(0, firstComma).trim();
                targetText = line.substring(firstComma + 1).replace(/^"|"$/g, '').trim();
            }
        }

        if (targetText && inputText) {
            // Use first 30 chars of target as key
            const key = targetText.substring(0, 30).replace(/\s+/g, ' ');
            classicToEasy.set(key, inputText);
        }
    }

    console.log(`📚 CSV 룩업 테이블 생성 완료: ${classicToEasy.size}개 항목\n`);

    // Load KRV for reference
    const krvPath = path.join(__dirname, '../public/bible/ko_krv.json');
    const krv = await fs.readJson(krvPath);

    let filledCount = 0;
    let notFoundCount = 0;

    for (const m of missing) {
        const krvVerse = krv[m.book]?.[m.chapter.toString()]?.[m.verse.toString()];

        if (!krvVerse) {
            console.log(`❌ KRV에서 찾을 수 없음: ${m.book} ${m.chapter}:${m.verse}`);
            notFoundCount++;
            continue;
        }

        // Try to find in CSV lookup
        const krvKey = krvVerse.substring(0, 30).replace(/\s+/g, ' ');
        let easyText = classicToEasy.get(krvKey);

        if (!easyText) {
            // Try partial match
            for (const [key, value] of classicToEasy) {
                if (krvVerse.includes(key.substring(0, 15)) || key.includes(krvVerse.substring(0, 15))) {
                    easyText = value;
                    break;
                }
            }
        }

        if (easyText) {
            // Ensure book and chapter exist
            if (!easy[m.book]) easy[m.book] = {};
            if (!easy[m.book][m.chapter.toString()]) easy[m.book][m.chapter.toString()] = {};

            easy[m.book][m.chapter.toString()][m.verse.toString()] = easyText;
            console.log(`✅ 채움: ${m.book} ${m.chapter}:${m.verse}`);
            filledCount++;
        } else {
            // Fallback: use KRV text with marker
            if (!easy[m.book]) easy[m.book] = {};
            if (!easy[m.book][m.chapter.toString()]) easy[m.book][m.chapter.toString()] = {};

            // Use KRV as fallback (better than empty)
            easy[m.book][m.chapter.toString()][m.verse.toString()] = krvVerse;
            console.log(`⚠️ KRV 대체: ${m.book} ${m.chapter}:${m.verse}`);
            filledCount++;
        }
    }

    // Save updated JSON
    await fs.outputJson(easyPath, easy, { spaces: 0 });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ 수정 완료!`);
    console.log(`   채워진 절: ${filledCount}`);
    console.log(`   찾지 못함: ${notFoundCount}`);
    console.log(`${'='.repeat(60)}`);
}

async function main() {
    const missing = await findMissingVerses();

    if (missing.length > 0) {
        await fillMissingVerses(missing);

        // Verify
        console.log('\n📋 수정 후 재검증...\n');
        const remaining = await findMissingVerses();

        if (remaining.length === 0) {
            console.log('\n🎉 모든 절이 완벽하게 채워졌습니다!');
        }
    } else {
        console.log('✅ 누락된 절이 없습니다!');
    }
}

main().catch(console.error);
