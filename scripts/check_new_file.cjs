const fs = require('fs');

// Try to read and parse the new file
try {
    const raw = fs.readFileSync('temp_ko_bible2.json', 'utf8');
    console.log('File size:', raw.length, 'bytes');
    console.log('First 200 chars:', raw.substring(0, 200));

    const data = JSON.parse(raw);
    console.log('Total books:', data.length);
    console.log('First book abbrev:', data[0].abbrev);
    console.log('Genesis chapter count:', data[0].chapters.length);

    // Genesis 27:19 (chapter index 26, verse index 18)
    const verse = data[0].chapters[26][18];
    console.log('\n=== Genesis 27:19 ===');
    console.log('Verse:', verse);
    console.log('Length:', verse.length);

    // Save to file
    fs.writeFileSync('github_genesis27_19.txt', verse, 'utf8');
    console.log('\nSaved to github_genesis27_19.txt');
} catch (e) {
    console.error('Error:', e.message);
}
