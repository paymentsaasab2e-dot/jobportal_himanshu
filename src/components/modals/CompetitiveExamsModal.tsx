'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';

interface CompetitiveExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CompetitiveExamsData) => void;
  initialData?: CompetitiveExamsData;
}

export interface CompetitiveExamDocument {
  id: string;
  file?: File;
  name: string;
  url?: string;
  size?: number;
}

export interface CompetitiveExamsData {
  id?: string;
  examName: string;
  yearTaken: string;
  resultStatus: string;
  scoreMarks: string;
  scoreType: string;
  validUntil: string;
  additionalNotes: string;
  documents?: CompetitiveExamDocument[];
}

export default function CompetitiveExamsModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CompetitiveExamsModalProps) {
  const isEditMode = Boolean(initialData);
  const [examName, setExamName] = useState(initialData?.examName || '');
  const [yearTaken, setYearTaken] = useState(initialData?.yearTaken || '');
  const [resultStatus, setResultStatus] = useState(initialData?.resultStatus || '');
  const [scoreMarks, setScoreMarks] = useState(initialData?.scoreMarks || '');
  const [scoreType, setScoreType] = useState(initialData?.scoreType || '');
  const [validUntil, setValidUntil] = useState(initialData?.validUntil || '');
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.additionalNotes || '');
  const [documents, setDocuments] = useState<CompetitiveExamDocument[]>(initialData?.documents || []);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update values when initialData changes
  useEffect(() => {
    if (initialData) {
      setExamName(initialData.examName || '');
      setYearTaken(initialData.yearTaken || '');
      setResultStatus(initialData.resultStatus || '');
      setScoreMarks(initialData.scoreMarks || '');
      setScoreType(initialData.scoreType || '');
      setValidUntil(initialData.validUntil || '');
      setAdditionalNotes(initialData.additionalNotes || '');
      // Normalize documents to ensure each has a unique id
      if (initialData.documents) {
        const normalizedDocs = initialData.documents.map((doc: string | { id?: string; name?: string; url?: string; file?: File; size?: number }, index) => {
          if (typeof doc === 'string') {
            return {
              id: `doc-${index}-${Date.now()}`,
              name: doc.split('/').pop() || 'Document',
              url: doc,
            };
          }
          return {
            id: doc.id || `doc-${index}-${Date.now()}`,
            name: doc.name || 'Document',
            url: doc.url,
            file: doc.file,
            size: doc.size,
          };
        });
        setDocuments(normalizedDocs);
      } else {
        setDocuments([]);
      }
    } else {
      // Clear all fields for "Add" mode
      setExamName('');
      setYearTaken('');
      setResultStatus('');
      setScoreMarks('');
      setScoreType('');
      setValidUntil('');
      setAdditionalNotes('');
      setDocuments([]);
    }
  }, [initialData, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    Array.from(e.target.files).forEach((file) => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only PDF, PNG, and JPG files are allowed.`);
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 10MB.`);
        return;
      }

      const newDoc: CompetitiveExamDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
      };
      setDocuments([...documents, newDoc]);
    });
  };

  const handleRemoveFile = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (!e.dataTransfer.files) return;

    Array.from(e.dataTransfer.files).forEach((file) => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only PDF, PNG, and JPG files are allowed.`);
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 10MB.`);
        return;
      }

      const newDoc: CompetitiveExamDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
      };
      setDocuments([...documents, newDoc]);
    });
  };

  const missingRequiredFields: string[] = [];
  if (!String(examName || '').trim()) missingRequiredFields.push('Exam Name');
  if (!String(yearTaken || '').trim()) missingRequiredFields.push('Year Taken');
  if (!String(resultStatus || '').trim()) missingRequiredFields.push('Result Status');
  if (!String(scoreMarks || '').trim()) missingRequiredFields.push('Score / Marks');
  if (!String(scoreType || '').trim()) missingRequiredFields.push('Score Type');

  const isFormValid = missingRequiredFields.length === 0;

  const handleSave = () => {
    if (!isFormValid) {
      alert(`Please complete all required fields: ${missingRequiredFields.join(', ')}`);
      return;
    }
    onSave({
      examName: examName.trim(),
      yearTaken,
      resultStatus,
      scoreMarks: scoreMarks.trim(),
      scoreType,
      validUntil,
      additionalNotes: additionalNotes.trim(),
      documents,
    });
    onClose();
  };

  const inputClassName =
    'h-11 w-full rounded-lg border border-gray-200 px-4 text-sm text-gray-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300';
  const selectClassName =
    'h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300';
  const textareaClassName =
    'min-h-[100px] w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 resize-none';

  // Generate year options (last 50 years to current year)
  const currentYear = new Date().getFullYear();
  const yearOptions = [];
  for (let i = currentYear; i >= currentYear - 50; i--) {
    yearOptions.push(i);
  }

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Competitive Exam' : 'Add Competitive Exam'}
      widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
      footer={(
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {isFormValid && (
            <button
              onClick={handleSave}
              className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600"
            >
              {isEditMode ? 'Update Exam' : 'Save Exam'}
            </button>
          )}
        </div>
      )}
    >
            <div className="space-y-6">
              {/* Exam Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Exam Name <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <select
                    value={examName}
                    onChange={(e) => setExamName(e.target.value)}
                    className={`${selectClassName} ${!examName && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'} appearance-none pr-10`}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2399A1AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                    }}
                  >
                    <option value="">Select exam...</option>
                    <option value="GATE">GATE</option>
                    <option value="CAT">CAT</option>
                    <option value="UPSC">UPSC</option>
                    <option value="GRE">GRE</option>
                    <option value="GMAT">GMAT</option>
                    <option value="TOEFL">TOEFL</option>
                    <option value="IELTS">IELTS</option>
                    <option value="SSC">SSC</option>
                    <option value="Bank PO">Bank PO</option>
                    <option value="JEE">JEE</option>
                    <option value="NEET">NEET</option>
                    <option value="CLAT">CLAT</option>
                    <option value="Other">Other</option>
                  </select>
                  {!examName && (
                    <p className="mt-1 text-xs text-amber-600">Exam name is required</p>
                  )}
                </div>
              </div>

              {/* Year Taken */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year Taken <span className="text-amber-600">*</span>
                </label>
                <select
                  value={yearTaken}
                  onChange={(e) => setYearTaken(e.target.value)}
                  className={`${selectClassName} ${!yearTaken && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'} appearance-none`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2399A1AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '40px'
                  }}
                >
                  <option value="">Select year</option>
                  {yearOptions.map((yearOption) => (
                    <option key={yearOption} value={yearOption.toString()}>
                      {yearOption}
                    </option>
                  ))}
                </select>
                {!yearTaken && (
                  <p className="mt-1 text-xs text-amber-600">Year taken is required</p>
                )}
              </div>

              {/* Result Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Result Status <span className="text-amber-600">*</span>
                </label>
                <select
                  value={resultStatus}
                  onChange={(e) => setResultStatus(e.target.value)}
                  className={`${selectClassName} ${!resultStatus && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'} appearance-none`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2399A1AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '40px'
                  }}
                >
                  <option value="">Select status</option>
                  <option value="Passed">Passed</option>
                  <option value="Failed">Failed</option>
                  <option value="Appeared">Appeared</option>
                  <option value="Qualified">Qualified</option>
                  <option value="Not Qualified">Not Qualified</option>
                </select>
                {!resultStatus && (
                  <p className="mt-1 text-xs text-amber-600">Result status is required</p>
                )}
              </div>

              {/* Score / Marks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score / Marks <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  value={scoreMarks}
                  onChange={(e) => {
                    const numericOnly = e.target.value.replace(/\D/g, '');
                    setScoreMarks(numericOnly);
                  }}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="Enter marks"
                  className={`${inputClassName} ${!scoreMarks.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                />
                {!scoreMarks.trim() && (
                  <p className="mt-1 text-xs text-amber-600">Score/Marks is required</p>
                )}
              </div>

              {/* Score Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score Type
                </label>
                <select
                  value={scoreType}
                  onChange={(e) => setScoreType(e.target.value)}
                  className={`${selectClassName} ${!scoreType && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'} appearance-none pr-10`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2399A1AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                  }}
                >
                  <option value="">Select score type</option>
                  <option value="Bands">Bands</option>
                  <option value="Score">Score</option>
                  <option value="Percentile">Percentile</option>
                  <option value="Rank">Rank</option>
                  <option value="Marks">Marks</option>
                  <option value="Percentage">Percentage</option>
                  <option value="CGPA">CGPA</option>
                  <option value="Other">Other</option>
                </select>
                {!scoreType && (
                  <p className="mt-1 text-xs text-amber-600">Score type is required</p>
                )}
              </div>

              {/* Valid Until */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valid Until <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  placeholder="Pick a date"
                  onFocus={(e) => {
                    if (e.target.type !== 'date') {
                      e.target.type = 'date';
                    }
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) {
                      e.target.type = 'text';
                    }
                  }}
                  className={inputClassName}
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Add any notes such as attempts, section scores, or additional details..."
                  rows={4}
                  className={textareaClassName}
                />
              </div>

              {/* Upload Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Competitive Exam Certificates/Documents
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-amber-200 bg-amber-50/50 focus:ring-amber-500 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="text-sm text-gray-600 text-center">
                      <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG (MAX. 10MB each)</p>
                  </div>
                </div>
                {documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <svg
                            className="w-5 h-5 text-gray-400 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                            {doc.size && (
                              <p className="text-xs text-gray-500">
                                {(doc.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            )}
                          </div>
                            <div className="flex items-center gap-3 shrink-0 ml-2">
                              {doc.url && (
                                <>
                                  <a
                                    href={resolveDocumentUrl(doc.url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-700 transition-colors"
                                    title="View Document"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  </a>
                                  <a
                                    href={resolveDocumentUrl(doc.url)}
                                    download={doc.name}
                                    className="text-orange-600 hover:text-orange-700 transition-colors"
                                    title="Download Document"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(doc.id)}
                          className="ml-2 p-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

    </ProfileDrawer>
  );
}
