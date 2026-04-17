import fs from 'fs';

const path = new URL('../src/app/profile/page.tsx', import.meta.url);
const raw = fs.readFileSync(path, 'utf8');
const hadCRLF = raw.includes('\r\n');
const s = hadCRLF ? raw.replace(/\r\n/g, '\n') : raw;

const anchor =
  '              <section\n                id="workspace-work-experience"';
const endRe = /\n\n\s+<section id="workspace-education"/;
const i0 = s.indexOf(anchor);
const m = i0 >= 0 ? endRe.exec(s.slice(i0)) : null;
if (i0 < 0 || !m) {
  console.error('Could not find work experience section boundaries');
  process.exit(1);
}

const closeTag = '              </section>';
const gapStart = i0 + m.index;
const beforeGap = s.slice(i0, gapStart);
const closeIdx = beforeGap.lastIndexOf(closeTag);
if (closeIdx < 0) {
  console.error('Could not find closing </section> for work block');
  process.exit(1);
}
const sectionCloseEnd = i0 + closeIdx + closeTag.length;
const oldFull = s.slice(i0, sectionCloseEnd);

const openClose = '\n              >\n';
const gt = oldFull.indexOf(openClose);
if (gt < 0) {
  console.error('Could not find section > opener');
  process.exit(1);
}
const innerStart = gt + openClose.length;
const innerEnd = oldFull.lastIndexOf(closeTag);
const innerOld = oldFull.slice(innerStart, innerEnd);

const gapStart =
  '                {(\n                  <div>\n                    {gapExplanationData ?';
const workStart =
  '                {(\n                  <div>\n                    {workExperienceData?.workExperiences?.length';
const internOpen =
  '                {(\n                  <div>\n                    {internshipData ?';

const iGap = innerOld.indexOf(gapStart);
const iWork = innerOld.indexOf(workStart);
const iIntern = innerOld.indexOf(internOpen, iWork + 1);
if (iGap < 0 || iWork < 0 || iIntern < 0) {
  console.error('Could not find gap/work/intern markers', { iGap, iWork, iIntern });
  process.exit(1);
}

const gapBlock = innerOld.slice(iGap, iWork);
const workBlock = innerOld.slice(iWork, iIntern);
const internBlock = innerOld.slice(iIntern);
const reorderedInner = workBlock + internBlock + gapBlock;

let header = oldFull.slice(0, innerStart);
header = header
  .replace('id="workspace-work-experience"', 'id="profile-group-work-experience"')
  .replace('className="scroll-mt-28 space-y-4"', 'className="scroll-mt-[var(--profile-scroll-pad,7rem)] space-y-4"');

const newFull = header + reorderedInner + oldFull.slice(innerEnd);

let out = s.slice(0, i0) + newFull + s.slice(sectionCloseEnd);
if (hadCRLF) out = out.replace(/\n/g, '\r\n');
fs.writeFileSync(path, out);
console.log('Reordered work section: Work → Internships → Gap; updated group id.');
