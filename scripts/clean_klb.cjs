const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../public/bible/ko_klb.json');

try {
    const rawData = fs.readFileSync(filePath, 'utf8');
    const bibleData = JSON.parse(rawData);
    let modifiedCount = 0;

    // Recursive function to traverse specific structure or just loop if known
    // Structure: Book -> Chapter -> Verse (string)

    for (const bookName in bibleData) {
        const book = bibleData[bookName];
        for (const chapterKey in book) {
            const chapter = book[chapterKey];
            for (const verseKey in chapter) {
                let text = chapter[verseKey];

                // Regex to find "Sign Up for Bible Gateway..."
                // It usually appears at the end.
                const regex = /\s*Sign Up for Bible Gateway.*$/i;

                if (regex.test(text)) {
                    const newText = text.replace(regex, '').trim();
                    if (newText !== text) {
                        chapter[verseKey] = newText;
                        modifiedCount++;
                    }
                }
            }
        }
    }

    console.log(`Cleaned ${modifiedCount} verses.`);

    if (modifiedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(bibleData, null, 0), 'utf8'); // Minified write to save space
        console.log(`File saved: ${filePath}`);
    } else {
        console.log("No changes needed.");
    }

} catch (error) {
    console.error("Error cleaning KLB:", error);
}
