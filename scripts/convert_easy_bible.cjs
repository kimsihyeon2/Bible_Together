/**
 * 쉬운성경 (Easy Bible) CSV to JSON Converter
 * 
 * Source: Kaggle Korean Bible Classic-Modern Pair dataset
 * CSV columns: input_text (쉬운성경), target_text (개역한글판)
 * 
 * Uses ko_krv.json structure as template for book/chapter/verse mapping
 */

const fs = require('fs-extra');
const path = require('path');

// Bible book structure (matches ko_krv.json key order)
const BIBLE_STRUCTURE = [
    { name: '창세기', chapters: 50 },
    { name: '출애굽기', chapters: 40 },
    { name: '레위기', chapters: 27 },
    { name: '민수기', chapters: 36 },
    { name: '신명기', chapters: 34 },
    { name: '여호수아', chapters: 24 },
    { name: '사사기', chapters: 21 },
    { name: '룻기', chapters: 4 },
    { name: '사무엘상', chapters: 31 },
    { name: '사무엘하', chapters: 24 },
    { name: '열왕기상', chapters: 22 },
    { name: '열왕기하', chapters: 25 },
    { name: '역대상', chapters: 29 },
    { name: '역대하', chapters: 36 },
    { name: '에스라', chapters: 10 },
    { name: '느헤미야', chapters: 13 },
    { name: '에스더', chapters: 10 },
    { name: '욥기', chapters: 42 },
    { name: '시편', chapters: 150 },
    { name: '잠언', chapters: 31 },
    { name: '전도서', chapters: 12 },
    { name: '아가', chapters: 8 },
    { name: '이사야', chapters: 66 },
    { name: '예레미야', chapters: 52 },
    { name: '예레미야애가', chapters: 5 },
    { name: '에스겔', chapters: 48 },
    { name: '다니엘', chapters: 12 },
    { name: '호세아', chapters: 14 },
    { name: '요엘', chapters: 3 },
    { name: '아모스', chapters: 9 },
    { name: '오바댜', chapters: 1 },
    { name: '요나', chapters: 4 },
    { name: '미가', chapters: 7 },
    { name: '나훔', chapters: 3 },
    { name: '하박국', chapters: 3 },
    { name: '스바냐', chapters: 3 },
    { name: '학개', chapters: 2 },
    { name: '스가랴', chapters: 14 },
    { name: '말라기', chapters: 4 },
    // 신약
    { name: '마태복음', chapters: 28 },
    { name: '마가복음', chapters: 16 },
    { name: '누가복음', chapters: 24 },
    { name: '요한복음', chapters: 21 },
    { name: '사도행전', chapters: 28 },
    { name: '로마서', chapters: 16 },
    { name: '고린도전서', chapters: 16 },
    { name: '고린도후서', chapters: 13 },
    { name: '갈라디아서', chapters: 6 },
    { name: '에베소서', chapters: 6 },
    { name: '빌립보서', chapters: 4 },
    { name: '골로새서', chapters: 4 },
    { name: '데살로니가전서', chapters: 5 },
    { name: '데살로니가후서', chapters: 3 },
    { name: '디모데전서', chapters: 6 },
    { name: '디모데후서', chapters: 4 },
    { name: '디도서', chapters: 3 },
    { name: '빌레몬서', chapters: 1 },
    { name: '히브리서', chapters: 13 },
    { name: '야고보서', chapters: 5 },
    { name: '베드로전서', chapters: 5 },
    { name: '베드로후서', chapters: 3 },
    { name: '요한1서', chapters: 5 },  // 기존 JSON 키 이름에 맞춤
    { name: '요한2서', chapters: 1 },
    { name: '요한3서', chapters: 1 },
    { name: '유다서', chapters: 1 },
    { name: '요한계시록', chapters: 22 }
];

async function parseCSV(csvPath) {
    const content = await fs.readFile(csvPath, 'utf-8');
    const lines = content.split('\n');

    // Skip header
    const verses = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV with potential quoted fields
        let inputText = '';
        let targetText = '';

        // Simple CSV parsing (handles quotes)
        if (line.startsWith('"')) {
            // Quoted input_text
            const match = line.match(/^"([^"]*(?:""[^"]*)*)"\s*,\s*(.*)$/);
            if (match) {
                inputText = match[1].replace(/""/g, '"');
                targetText = match[2].replace(/^"|"$/g, '').replace(/""/g, '"');
            }
        } else {
            const firstComma = line.indexOf(',');
            if (firstComma > 0) {
                inputText = line.substring(0, firstComma);
                targetText = line.substring(firstComma + 1).replace(/^"|"$/g, '');
            }
        }

        if (inputText.length > 0) {
            verses.push({
                easy: inputText.trim(),
                classic: targetText.trim()
            });
        }
    }

    return verses;
}

async function main() {
    console.log('🚀 쉬운성경 CSV → JSON 변환 시작\n');

    // Load existing KRV for structure reference
    const krvPath = path.join(__dirname, '../public/bible/ko_krv.json');
    const krvData = await fs.readJson(krvPath);
    console.log('📖 개역개정(KRV) 구조 로드 완료');

    // Parse CSV
    const csvPath = path.join(__dirname, '../temp_bible_csv/pair.csv');
    const verses = await parseCSV(csvPath);
    console.log(`📜 CSV 파싱 완료: ${verses.length}절\n`);

    // Build Easy Bible JSON using KRV structure as template
    const easyBible = {};
    let verseIndex = 0;
    let successCount = 0;
    let missCount = 0;

    for (const book of BIBLE_STRUCTURE) {
        const bookName = book.name;

        // Get chapter structure from KRV
        const krvBook = krvData[bookName];
        if (!krvBook) {
            console.log(`⚠️ KRV에 없는 책: ${bookName}`);
            continue;
        }

        easyBible[bookName] = {};

        for (let ch = 1; ch <= book.chapters; ch++) {
            const chapterKey = ch.toString();
            const krvChapter = krvBook[chapterKey];

            if (!krvChapter) {
                continue;
            }

            easyBible[bookName][chapterKey] = {};
            const verseCount = Object.keys(krvChapter).length;

            for (let v = 1; v <= verseCount; v++) {
                if (verseIndex < verses.length) {
                    const verseText = verses[verseIndex].easy;
                    // Clean up the text
                    const cleanText = verseText
                        .replace(/\s+/g, ' ')
                        .replace(/^[""]|[""]$/g, '')
                        .trim();

                    if (cleanText.length > 0) {
                        easyBible[bookName][chapterKey][v.toString()] = cleanText;
                        successCount++;
                    } else {
                        missCount++;
                    }
                } else {
                    // Out of verses from CSV
                    missCount++;
                }
                verseIndex++;
            }
        }

        // Progress
        const progress = Math.floor((verseIndex / verses.length) * 100);
        process.stdout.write(`\r📖 처리 중: ${bookName.padEnd(10)} | ${progress}%`);
    }

    console.log('\n');

    // Save
    const outputPath = path.join(__dirname, '../public/bible/ko_easy.json');
    await fs.outputJson(outputPath, easyBible, { spaces: 0 });

    const stats = await fs.stat(outputPath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);

    console.log('='.repeat(50));
    console.log('✅ 쉬운성경 JSON 생성 완료!');
    console.log(`📁 파일: ${outputPath}`);
    console.log(`📊 크기: ${sizeMB} MB`);
    console.log(`📖 성공: ${successCount}절`);
    console.log(`⚠️ 누락: ${missCount}절`);
    console.log('='.repeat(50));
}

main().catch(console.error);
