const fs = require('fs');
const html = fs.readFileSync('test-out.html', 'utf8');
const regex = /<a href="\/product\/[^>]+>\s*(.*?)\s*<\/a>/gs;
const matches = [...html.matchAll(regex)].map(m => m[1].replace(/\s+/g, ' ').trim());
console.log(matches.filter(m => !m.includes('<img') && m.length > 0));
