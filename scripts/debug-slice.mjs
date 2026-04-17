import fs from 'fs';
const s = fs.readFileSync('src/app/profile/page.tsx', 'utf8');
const i = s.indexOf('title="Internships"');
const j = s.indexOf('No internship added yet', i);
console.log(JSON.stringify(s.slice(j - 250, j + 100)));
