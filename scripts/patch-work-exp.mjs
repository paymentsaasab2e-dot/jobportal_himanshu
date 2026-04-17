import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../src/app/profile/page.tsx');
const s = fs.readFileSync(file, 'utf8');
const needle = '{workExperienceData.workExperiences.map((entry, index) => {';
const start = s.indexOf(needle);
if (start < 0) {
  console.error('needle not found');
  process.exit(1);
}
const from = s.indexOf('const cardKey = entry.id', start);
const marker =
  '                        })}\r\n                      </div>';
let idx = s.indexOf(marker, start);
if (idx < 0) {
  idx = s.indexOf('                        })}\n                      </div>', start);
}
if (idx < 0) {
  console.error('marker not found');
  process.exit(1);
}
const endExclusive = idx + '                        })}\n'.length;
const before = s.slice(0, from);
const after = s.slice(endExclusive);
const newBlock = `const cardKey = entry.id ?? \`work-\${index}\`;
                          const isExpanded = expandedWorkExperienceCards[cardKey] === true;
                          const toggleCard = () => {
                            setExpandedWorkExperienceCards(prev => ({
                              ...prev,
                              [cardKey]: !isExpanded
                            }));
                          };

                          return (
                            <WorkExperienceEntryCard
                              key={cardKey}
                              entry={entry}
                              formatEnum={formatEnumValue}
                              getDocumentName={getDocumentName}
                              resolveDocHref={resolveProfileDocHref}
                              isExpanded={isExpanded}
                              onToggleExpand={toggleCard}
                              onEdit={() => {
                                setEditingWorkExperienceId(entry.id ?? null);
                                setIsWorkExperienceModalOpen(true);
                              }}
                              onDelete={async () => {
                                if (confirm(\`Are you sure you want to delete this work experience: \${entry.jobTitle} at \${entry.companyName}?\`)) {
                                  const candidateId = sessionStorage.getItem('candidateId');
                                  if (!candidateId) {
                                    alert('Candidate ID not found. Please refresh the page.');
                                    return;
                                  }

                                  try {
                                    const response = await fetch(\`\${API_BASE_URL}/profile/work-experience/\${entry.id}\`, {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                    });

                                    if (!response.ok) {
                                      const errorData = await response.json().catch(() => ({}));
                                      throw new Error(errorData.message || 'Failed to delete work experience');
                                    }

                                    await refreshProfileData(candidateId);
                                    alert('Work experience deleted successfully');
                                  } catch (error) {
                                    console.error('Error deleting work experience:', error);
                                    alert(error instanceof Error ? error.message : 'Error deleting work experience');
                                  }
                                }
                              }}
                            />
                          );
                        `;
fs.writeFileSync(file, before + newBlock + after);
console.log('patched work experience block');
