import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../src/app/profile/page.tsx');
let s = fs.readFileSync(file, 'utf8');

function patch(anchor, startPat, endPat, insert, label) {
  const ai = s.indexOf(anchor);
  if (ai < 0) throw new Error(`${label}: anchor`);
  const a = s.indexOf(startPat, ai);
  if (a < 0) throw new Error(`${label}: start`);
  const b = s.indexOf(endPat, a + startPat.length);
  if (b < 0) throw new Error(`${label}: end`);
  s = s.slice(0, a) + insert + s.slice(b);
  console.log('ok', label);
}

// --- Gap ---
patch(
  'title="Gap Explanation"',
  '\r\n                      <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">',
  '\r\n                        <p className="mt-4 text-base font-medium text-gray-900">No gap explanation added yet</p>',
  `\r\n                      <ProfileGapExplanationFilled
                        data={gapExplanationData}
                        formatEnum={formatEnumValue}
                        isExpanded={isGapExplanationCardExpanded}
                        onToggleExpand={() =>
                          setIsGapExplanationCardExpanded(!isGapExplanationCardExpanded)
                        }
                        onEdit={() => setIsGapExplanationModalOpen(true)}
                        onDelete={async () => {
                          if (confirm('Are you sure you want to delete this gap explanation?')) {
                            const candidateId = sessionStorage.getItem('candidateId');
                            if (!candidateId) {
                              alert('Candidate ID not found. Please refresh the page.');
                              return;
                            }
                            try {
                              const response = await fetch(
                                \`\${API_BASE_URL}/profile/gap-explanation/\${candidateId}\`,
                                {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json' },
                                },
                              );
                              if (!response.ok) {
                                const errorData = await response.json().catch(() => ({}));
                                throw new Error(errorData.message || 'Failed to delete gap explanation');
                              }
                              await refreshProfileData(candidateId);
                              alert('Gap explanation deleted successfully');
                            } catch (error) {
                              console.error('Error deleting gap explanation:', error);
                              alert(
                                error instanceof Error
                                  ? error.message
                                  : 'Error deleting gap explanation',
                              );
                            }
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="mt-4 text-base font-medium text-gray-900">No gap explanation added yet</p>`,
  'gap',
);

fs.writeFileSync(file, s);
console.log('written');
