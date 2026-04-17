import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const file = path.join(__dirname, '../src/app/profile/page.tsx');
let s = fs.readFileSync(file, 'utf8');

function gapReplace() {
  const anchor = 'title="Gap Explanation"';
  const ai = s.indexOf(anchor);
  if (ai < 0) return console.log('no gap anchor');
  let start = s.indexOf(
    '\n                      <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">',
    ai,
  );
  if (start < 0) {
    start = s.indexOf(
      '\r\n                      <div className="relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">',
      ai,
    );
  }
  if (start < 0) return console.log('gap: already using preview');
  const endPat =
    '\n                    ) : (\n                      <div className="text-center py-12">';
  const endPatCr = endPat.replace(/\n/g, '\r\n');
  let end = s.indexOf(endPat, start);
  let usedEnd = endPat;
  if (end < 0) {
    end = s.indexOf(endPatCr, start);
    usedEnd = endPatCr;
  }
  if (end < 0) {
    console.error('gap end');
    process.exit(1);
  }
  const insert = `
                      <ProfileGapExplanationFilled
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
                      <div className="text-center py-12">`;
  s = s.slice(0, start) + insert + s.slice(end + usedEnd.length);
  console.log('gap ok');
}

function educationMapReplace() {
  const mapTag = '{educationData.educations.map((entry, index) => {';
  const mapStart = s.indexOf(mapTag);
  if (mapStart < 0) return console.log('no education map');
  const from = s.indexOf('const cardKey = entry.id', mapStart);
  if (from < 0) return console.log('education: bad from');
  let closeMap = '                        })}\n                      </div>';
  let idx = s.indexOf(closeMap, from);
  if (idx < 0) {
    closeMap = '                        })}\r\n                      </div>';
    idx = s.indexOf(closeMap, from);
  }
  if (idx < 0) {
    console.error('education closeMap');
    process.exit(1);
  }
  const endExclusive2 = idx + closeMap.length;
  const block = `const cardKey = entry.id ?? \`education-\${index}\`;
                          const isCardExpanded = expandedEducationCards[cardKey] === true;
                          const toggleCard = () => {
                            setExpandedEducationCards(prev => ({
                              ...prev,
                              [cardKey]: !isCardExpanded
                            }));
                          };
                          return (
                            <EducationEntryPreview
                              key={cardKey}
                              entry={entry}
                              isExpanded={isCardExpanded}
                              onToggleExpand={toggleCard}
                              onEdit={() => {
                                setEditingEducationId(entry.id ?? null);
                                setIsEducationModalOpen(true);
                              }}
                              onDelete={async () => {
                                if (confirm(\`Are you sure you want to delete this education: \${entry.degreeProgram} at \${entry.institutionName}?\`)) {
                                  const candidateId = sessionStorage.getItem('candidateId');
                                  if (!candidateId) {
                                    alert('Candidate ID not found. Please refresh the page.');
                                    return;
                                  }
                                  try {
                                    const response = await fetch(\`\${API_BASE_URL}/profile/education/\${entry.id}\`, {
                                      method: 'DELETE',
                                      headers: { 'Content-Type': 'application/json' },
                                    });
                                    if (!response.ok) {
                                      const errorData = await response.json().catch(() => ({}));
                                      throw new Error(errorData.message || 'Failed to delete education');
                                    }
                                    await refreshProfileData(candidateId);
                                    alert('Education deleted successfully');
                                  } catch (error) {
                                    console.error('Error deleting education:', error);
                                    alert(error instanceof Error ? error.message : 'Error deleting education');
                                  }
                                }
                              }}
                              getDocumentName={getDocumentName}
                              resolveDocHref={resolveProfileDocHref}
                            />
                          );
                        `;
  s = s.slice(0, from) + block + s.slice(endExclusive2);
  console.log('education ok');
}

gapReplace();
educationMapReplace();
fs.writeFileSync(file, s);
console.log('done');
