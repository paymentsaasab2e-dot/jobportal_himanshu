import fs from 'fs';

const path = new URL('../src/app/profile/page.tsx', import.meta.url);
const raw = fs.readFileSync(path, 'utf8');
const hadCRLF = raw.includes('\r\n');
let s = hadCRLF ? raw.replace(/\r\n/g, '\n') : raw;

function extractSectionAt(str, start) {
  let depth = 1;
  let i = str.indexOf('>', start) + 1;
  if (i <= start) return null;
  while (i < str.length && depth > 0) {
    const nextOpen = str.indexOf('<section', i);
    const nextClose = str.indexOf('</section>', i);
    if (nextClose < 0) return null;
    if (nextOpen >= 0 && nextOpen < nextClose) {
      depth++;
      i = nextOpen + 8;
    } else {
      depth--;
      i = nextClose + 10;
    }
  }
  return str.slice(start, i);
}

function extractById(middle, id) {
  const needle = `id="${id}"`;
  const idPos = middle.indexOf(needle);
  if (idPos < 0) return null;
  const start = middle.lastIndexOf('<section', idPos);
  if (start < 0) return null;
  return extractSectionAt(middle, start);
}

function removeSlice(middle, slice) {
  const idx = middle.indexOf(slice);
  if (idx < 0) return middle;
  return middle.slice(0, idx) + middle.slice(idx + slice.length);
}

function innerOfSection(sec) {
  const gt = sec.indexOf('>');
  const end = sec.lastIndexOf('</section>');
  if (gt < 0 || end < 0 || end <= gt) return sec;
  return sec.slice(gt + 1, end);
}

// 1) Remove projects from education
const projStart = s.indexOf(
  '                <div\n                  id="workspace-projects"\n                  className="scroll-mt-28 space-y-4"\n                >',
);
const projEndMarker = '\n\n                {/* Competitive Exams Card Display */}';
const projEnd = s.indexOf(projEndMarker, projStart);
if (projStart < 0 || projEnd < 0) {
  console.error('Projects block markers not found');
  process.exit(1);
}
const projectsBlock = s.slice(projStart, projEnd);
s = s.slice(0, projStart) + s.slice(projEnd);

const coursesIdPos = s.indexOf('id="workspace-courses-certifications"');
const jobIdPos = s.indexOf('id="workspace-job-preferences"');
if (coursesIdPos < 0 || jobIdPos < 0) {
  console.error('Courses or job section id not found');
  process.exit(1);
}
const middleStart = s.lastIndexOf('<section', coursesIdPos);
const middleEnd = s.lastIndexOf('<section', jobIdPos);
if (middleStart < 0 || middleEnd < 0 || middleEnd <= middleStart) {
  console.error('Could not slice middle region');
  process.exit(1);
}

let middle = s.slice(middleStart, middleEnd);
const beforeMiddle = s.slice(0, middleStart);
const afterMiddle = s.slice(middleEnd);

const courses = extractById(middle, 'workspace-courses-certifications');
middle = removeSlice(middle, courses);
const awards = extractById(middle, 'workspace-awards');
middle = removeSlice(middle, awards);
const skills = extractById(middle, 'workspace-skills');
middle = removeSlice(middle, skills);
const language = extractById(middle, 'workspace-language');
middle = removeSlice(middle, language);
const social = extractById(middle, 'workspace-social-links');
middle = removeSlice(middle, social);

if (middle.trim().length > 0) {
  console.warn('Unexpected content left in middle:', middle.slice(0, 300));
}

if (!courses || !awards || !skills || !language || !social) {
  console.error('Missing section', {
    courses: !!courses,
    awards: !!awards,
    skills: !!skills,
    language: !!language,
    social: !!social,
  });
  process.exit(1);
}

const coursesInner = `<div className="space-y-4">${innerOfSection(courses)}</div>`;
const awardsInner = `<div className="space-y-4">${innerOfSection(awards)}</div>`;
const socialInner = `<div className="space-y-4">${innerOfSection(social)}</div>`;

const skillsAndLang = `<section id="profile-group-skills" className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4">
                <div className="space-y-4">${innerOfSection(skills)}</div>
                <div className="space-y-4">${innerOfSection(language)}</div>
              </section>`;

const projectsStyled = projectsBlock
  .replace('id="workspace-projects"', 'id="section-profile-projects"')
  .replace('className="scroll-mt-28 space-y-4"', 'className="space-y-4"');

const projectsGroup = `              <section
                id="profile-group-projects-certifications"
                className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4"
              >
${projectsStyled}
${socialInner}
${coursesInner}
${awardsInner}
              </section>`;

const newMiddle = `\n\n${skillsAndLang}\n\n${projectsGroup}\n\n`;

s = beforeMiddle + newMiddle + afterMiddle;

s = s.replace(
  '<section id="workspace-education" className="scroll-mt-28 space-y-4">',
  '<section id="profile-group-education" className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4">',
);

s = s.replace(
  '<section\n                id="workspace-job-preferences"\n                className="scroll-mt-28 space-y-4"\n              >',
  '<section\n                id="profile-group-job-preferences"\n                className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4"\n              >',
);

s = s.replace(
  '<section id="workspace-eligibility" className="scroll-mt-28 space-y-4">',
  '<section id="profile-group-personal-details" className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4">',
);

if (hadCRLF) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync(path, s);
console.log('Relayout complete.');
