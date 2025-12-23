const fs = require('fs');
const path = require('path');

const biblePath = path.join(__dirname, 'public', 'bible');
const files = {
    krv: 'ko_krv.json',
    klb: 'ko_klb.json',
    easy: 'ko_easy.json'
};

function loadBible(filename) {
    try {
        return JSON.parse(fs.readFileSync(path.join(biblePath, filename), 'utf8'));
    } catch (e) {
        console.error(`Error loading ${filename}:`, e.message);
        return null;
    }
}

const krv = loadBible(files.krv);
const klb = loadBible(files.klb);
const easy = loadBible(files.easy);

if (!krv || !klb || !easy) {
    console.error("Failed to load one of the bible files.");
    process.exit(1);
}

// BIBLE_BOOKS from constants.ts (manual list for order)
const BIBLE_BOOKS = [
    '창세기', '출애굽기', '레위기', '민수기', '신명기', '여호수아', '사사기', '룻기',
    '사무엘상', '사무엘하', '열왕기상', '열왕기하', '역대상', '역대하', '에스라', '느헤미야',
    '에스더', '욥기', '시편', '잠언', '전도서', '아가', '이사야', '예레미야',
    '예레미야애가', '에스겔', '다니엘', '호세아', '요엘', '아모스', '오바댜', '요나',
    '미가', '나훔', '하박국', '스바냐', '학개', '스가랴', '말라기',
    '마태복음', '마가복음', '누가복음', '요한복음', '사도행전', '로마서', '고린도전서',
    '고린도후서', '갈라디아서', '에베소서', '빌립보서', '골로새서', '데살로니가전서',
    '데살로니가후서', '디모데전서', '디모데후서', '디도서', '빌레몬서', '히브리서',
    '야고보서', '베드로전서', '베드로후서', '요한일서', '요한이서', '요한삼서', '유다서',
    '요한계시록'
];

function checkMissing(source, target, sourceName, targetName) {
    let missing = [];
    let empty = [];

    // Iterate strictly by BIBLE_BOOKS order
    for (const book of BIBLE_BOOKS) {
        // Check if book exists
        // Handle standard vs JSON key names if needed (e.g. 요한1서 vs 요한일서)
        // Assuming NKRV keys are standard. 
        // In our app, keys seem to match BIBLE_BOOKS usually, but let's be robust.

        // NKRV keys
        let sourceBookData = source[book];
        if (!sourceBookData) {
            // Try mapped keys if needed (e.g. Psalms -> 시편?) 
            // Based on previous file reads, keys are Korean names.
            // Let's assume direct check first.
            continue;
        }

        const targetBookData = target[book];
        if (!targetBookData) {
            missing.push(`[BOOK MISSING] ${book} in ${targetName}`);
            continue;
        }

        // Iterate chapters in Source
        // Sort chapters numerically
        const chapters = Object.keys(sourceBookData).map(Number).sort((a, b) => a - b);

        for (const ch of chapters) {
            const sourceChapter = sourceBookData[ch];
            const targetChapter = targetBookData[ch];

            if (!targetChapter) {
                missing.push(`[CHAPTER MISSING] ${book} ${ch}장 in ${targetName}`);
                continue;
            }

            // Iterate verses
            const verses = Object.keys(sourceChapter).map(Number).sort((a, b) => a - b);
            for (const v of verses) {
                const targetText = targetChapter[v];
                if (targetText === undefined) {
                    missing.push(`[VERSE MISSING] ${book} ${ch}:${v} in ${targetName}`);
                } else if (!targetText || targetText.trim() === '') {
                    empty.push(`[VERSE EMPTY] ${book} ${ch}:${v} in ${targetName}`);
                }
            }
        }
    }

    return { missing, empty };
}

console.log("--- Checking KLB (현대인의 성경) vs KRV (개역개정) ---");
const klbResults = checkMissing(krv, klb, 'KRV', 'KLB');
console.log(`Missing Items: ${klbResults.missing.length}`);
if (klbResults.missing.length > 0) {
    console.log(klbResults.missing.slice(0, 50).join('\n')); // Show first 50
    if (klbResults.missing.length > 50) console.log(`... and ${klbResults.missing.length - 50} more`);
}
console.log(`Empty Items: ${klbResults.empty.length}`);
if (klbResults.empty.length > 0) {
    console.log(klbResults.empty.slice(0, 50).join('\n'));
}

console.log("\n--- Checking EASY (쉬운성경) vs KRV (개역개정) ---");
const easyResults = checkMissing(krv, easy, 'KRV', 'EASY');
console.log(`Missing Items: ${easyResults.missing.length}`);
if (easyResults.missing.length > 0) {
    console.log(easyResults.missing.slice(0, 50).join('\n'));
}
