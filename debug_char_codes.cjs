
const fs = require('fs');
const easyPath = 'public/bible/ko_easy.json';
const easy = JSON.parse(fs.readFileSync(easyPath, 'utf8'));

const text = easy['창세기']['25']['7'];
console.log('Text:', text);
console.log('Length:', text.length);
for (let i = 0; i < Math.min(text.length, 20); i++) {
    console.log(`${i}: ${text[i]} (${text.charCodeAt(i)})`);
}

const text26_1 = easy['창세기']['26']['1'];
console.log('Gen 26:1:', text26_1);
