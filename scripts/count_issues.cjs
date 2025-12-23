const fs = require('fs');
const data = JSON.parse(fs.readFileSync('bible_audit_report.json', 'utf8'));
console.log('Total truncated verses:', data.length);
const bookCounts = {};
data.forEach(v => { bookCounts[v.book] = (bookCounts[v.book] || 0) + 1; });
console.log('\nBy Book:');
Object.entries(bookCounts).forEach(([book, count]) => console.log(`  ${book}: ${count}`));
