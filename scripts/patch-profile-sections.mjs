import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../src/app/profile/page.tsx');
let s = fs.readFileSync(file, 'utf8');

function replaceAfter(anchor, startPat, endPat, insert, label) {
  const anchorIdx = s.indexOf(anchor);
  if (anchorIdx < 0) throw new Error(`${label}: anchor not found`);
  const a = s.indexOf(startPat, anchorIdx);
  if (a < 0) throw new Error(`${label}: start not found`);
  const b = s.indexOf(endPat, a + startPat.length);
  if (b < 0) throw new Error(`${label}: end not found`);
  s = s.slice(0, a) + insert + s.slice(b);
  console.log('patched', label);
}

replaceAfter(
  'title="Internships"',
  `\r\n                      <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">`,
  `\r\n                    ) : (\r\n                      <div className="text-center py-12">\r\n                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">\r\n                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />\r\n                        </svg>\r\n                        <p className="mt-4 text-base font-medium text-gray-900">No internship added yet</p>`,
  `                      <ProfileInternshipFilled
                        data={internshipData}
                        formatEnum={formatEnumValue}
                        isExpanded={isInternshipCardExpanded}
                        onToggleExpand={() =>
                          setIsInternshipCardExpanded(!isInternshipCardExpanded)
                        }
                        onEdit={() => setIsInternshipModalOpen(true)}
                        onDelete={async () => {
                          if (
                            confirm(
                              \`Are you sure you want to delete this internship: \${internshipData.internshipTitle} at \${internshipData.companyName}?\`,
                            )
                          ) {
                            const candidateId = sessionStorage.getItem('candidateId');
                            if (!candidateId) {
                              alert('Candidate ID not found. Please refresh the page.');
                              return;
                            }
                            try {
                              const response = await fetch(
                                \`\${API_BASE_URL}/profile/internship/\${candidateId}\`,
                                {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                },
                              );
                              if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(errorData.message || 'Failed to delete internship');
                              }
                              await refreshProfileData(candidateId);
                              alert('Internship deleted successfully');
                            } catch (error) {
                              console.error('Error deleting internship:', error);
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : 'Error deleting internship',
                              );
                            }
                          }
                        }}
                        getDocumentName={getDocumentName}
                        resolveDocHref={resolveProfileDocHref}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No internship added yet</p>`.replace(/\n/g, '\r\n'),
  'internship',
);

fs.writeFileSync(file, s);
console.log('done');
