const fs = require('fs');

// Load Bible data - using the nested object structure
const krvText = fs.readFileSync('public/bible/ko_krv.json', 'utf8');
const krvData = JSON.parse(krvText);

console.log('=== Genesis 27:19 Check (개역개정) ===');
if (krvData['창세기'] && krvData['창세기']['27'] && krvData['창세기']['27']['19']) {
    const verse = krvData['창세기']['27']['19'];
    console.log('Verse:', verse);
    console.log('Length:', verse.length);
    console.log('Ends with:', verse.slice(-10));
} else {
    console.log('Verse not found in expected location');
}

// Now scan for ALL potentially truncated verses
console.log('\n\n=== Scanning for Truncated Verses (개역개정) ===');
const truncatedVerses = [];

const bookNames = Object.keys(krvData);
console.log(`Total books: ${bookNames.length}`);

for (const bookName of bookNames) {
    const book = krvData[bookName];
    const chapters = Object.keys(book);

    for (const chapterNum of chapters) {
        const chapter = book[chapterNum];
        const verses = Object.keys(chapter);

        for (const verseNum of verses) {
            const verse = chapter[verseNum];

            if (!verse || verse.length === 0) {
                truncatedVerses.push({
                    book: bookName,
                    chapter: chapterNum,
                    verse: verseNum,
                    text: verse,
                    issue: 'EMPTY'
                });
                continue;
            }

            // Check for verses that end abruptly (not with valid endings)
            const lastChar = verse.slice(-1);

            // Valid endings in Korean Bible verses
            const validEndings = ['다', '라', '요', '니', '나', '며', '고', '도', '지', '게', '히', '리', '소', '냐', '까', '오', '.', '?', '!', '"', "'", ')', '」', '』', '며'];

            // These single characters at the end likely indicate truncation
            const suspiciousEndings = ['축', '복', '하', '을', '를', '은', '는', '의', '에', '가', '이', '과', '와', '로', '으', '아', '어', '것', '서'];

            if (suspiciousEndings.includes(lastChar) && !validEndings.includes(lastChar)) {
                truncatedVerses.push({
                    book: bookName,
                    chapter: chapterNum,
                    verse: verseNum,
                    text: verse.slice(-50),
                    fullText: verse,
                    issue: `TRUNCATED (ends with "${lastChar}")`
                });
            }
        }
    }
}

console.log(`\nFound ${truncatedVerses.length} potentially truncated verses:\n`);

// Group by book for readability
const byBook = {};
for (const v of truncatedVerses) {
    if (!byBook[v.book]) byBook[v.book] = [];
    byBook[v.book].push(v);
}

for (const [book, verses] of Object.entries(byBook)) {
    console.log(`\n=== ${book} (${verses.length} issues) ===`);
    for (const v of verses) {
        console.log(`  ${v.chapter}:${v.verse} - ${v.issue}`);
        console.log(`    "...${v.text}"`);
    }
}

// Save detailed report
fs.writeFileSync('bible_audit_report.json', JSON.stringify(truncatedVerses, null, 2), 'utf8');
console.log('\n\nFull report saved to bible_audit_report.json');
