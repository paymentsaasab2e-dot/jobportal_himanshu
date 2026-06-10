'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';
import ProfileDatePicker from '@/components/profile/ProfileDatePicker';
import { profileFieldClass, profileTextareaClass } from '@/lib/profile-modal-ui';
import {
  downloadProfileDocumentItem,
  getProfileDocumentDisplayName,
  isStoredProfileDocument,
  openProfileDocumentInNewTab,
  validateProfileDocumentFile,
} from '@/lib/profile-documents';

interface CompetitiveExamsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CompetitiveExamsData) => void | Promise<void>;
  initialData?: CompetitiveExamsData;
  mode?: 'add' | 'edit';
  editingEntryId?: string | null;
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

function normalizeCompetitiveExamDocuments(
  documents: CompetitiveExamsData['documents'],
): CompetitiveExamDocument[] {
  return (documents || []).map((doc, index) => {
    if (typeof doc === 'string') {
      return {
        id: `doc-${index}-${doc}`,
        url: doc,
        name: getProfileDocumentDisplayName(doc),
      };
    }
    if (doc && typeof doc === 'object') {
      const storedUrl =
        typeof doc.url === 'string' && doc.url.trim()
          ? doc.url
          : typeof (doc as { file?: string }).file === 'string'
            ? String((doc as { file?: string }).file)
            : undefined;
      return {
        id: doc.id || `doc-${index}-${storedUrl || doc.name || 'document'}`,
        file: doc.file instanceof File ? doc.file : undefined,
        name: doc.name || (storedUrl ? getProfileDocumentDisplayName(storedUrl) : 'Document'),
        url: storedUrl,
        size: doc.size,
      };
    }
    return {
      id: `doc-${index}`,
      name: 'Document',
    };
  });
}

export default function CompetitiveExamsModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'edit',
  editingEntryId = null,
}: CompetitiveExamsModalProps) {
  const isEditMode = mode === 'edit' && Boolean(initialData);
  const [examName, setExamName] = useState(initialData?.examName || '');
  const [yearTaken, setYearTaken] = useState(initialData?.yearTaken || '');
  const [resultStatus, setResultStatus] = useState(initialData?.resultStatus || '');
  const [scoreMarks, setScoreMarks] = useState(initialData?.scoreMarks || '');
  const [scoreType, setScoreType] = useState(initialData?.scoreType || '');
  const [validUntil, setValidUntil] = useState(initialData?.validUntil || '');
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.additionalNotes || '');
  const [documents, setDocuments] = useState<CompetitiveExamDocument[]>(
    normalizeCompetitiveExamDocuments(initialData?.documents),
  );
  const [dragActive, setDragActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionInitKeyRef = useRef<string | null>(null);

  const resetForm = useCallback(() => {
    setExamName('');
    setYearTaken('');
    setResultStatus('');
    setScoreMarks('');
    setScoreType('');
    setValidUntil('');
    setAdditionalNotes('');
    setDocuments([]);
  }, []);

  const populateFormFromExam = useCallback((data: CompetitiveExamsData) => {
    setExamName(data.examName || '');
    setYearTaken(data.yearTaken || '');
    setResultStatus(data.resultStatus || '');
    setScoreMarks(data.scoreMarks || '');
    setScoreType(data.scoreType || '');
    setValidUntil(data.validUntil || '');
    setAdditionalNotes(data.additionalNotes || '');
    setDocuments(normalizeCompetitiveExamDocuments(data.documents));
  }, []);

  // Initialize only when the drawer opens or the edited entry changes —
  // not on every parent re-render (which used to wipe newly added documents).
  useEffect(() => {
    if (!isOpen) {
      sessionInitKeyRef.current = null;
      return;
    }

    const initKey = mode === 'add' || !editingEntryId ? 'add' : `edit:${editingEntryId}`;
    if (sessionInitKeyRef.current === initKey) {
      return;
    }
    sessionInitKeyRef.current = initKey;

    if (mode === 'add' || !editingEntryId || !initialData) {
      resetForm();
      return;
    }

    populateFormFromExam(initialData);
  }, [isOpen, mode, editingEntryId, initialData, populateFormFromExam, resetForm]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const nextDocs: CompetitiveExamDocument[] = [];
    for (const file of Array.from(files)) {
      const validation = validateProfileDocumentFile(file);
      if (!validation.ok) {
        alert(validation.message);
        continue;
      }

      nextDocs.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
      });
    }

    if (nextDocs.length > 0) {
      setDocuments((prev) => [...prev, ...nextDocs]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
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
    handleFileSelect(e.dataTransfer.files);
  };

  const handleSave = async () => {
    const hasAnyFormData = Boolean(
      examName.trim() ||
        yearTaken ||
        resultStatus ||
        scoreMarks.trim() ||
        scoreType ||
        validUntil ||
        additionalNotes.trim() ||
        documents.length > 0,
    );

    if (!hasAnyFormData) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id ?? editingEntryId ?? undefined,
        examName: examName.trim(),
        yearTaken,
        resultStatus,
        scoreMarks: scoreMarks.trim(),
        scoreType,
        validUntil,
        additionalNotes: additionalNotes.trim(),
        documents: documents.length > 0 ? documents : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving competitive exam:', error);
      alert(
        error instanceof Error ? error.message : 'Error saving competitive exam. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName = profileFieldClass();
  const selectClassName = `${profileFieldClass()} appearance-none bg-white`;
  const textareaClassName = `${profileTextareaClass} min-h-[100px]`;

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
          <button
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Update Exam' : 'Save Exam'}
          </button>
        </div>
      )}
    >
      <div className="space-y-6">
        {/* Exam Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam Name
          </label>
          <div className="relative">
            <select
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className={`${selectClassName} appearance-none pr-10`}
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
          </div>
        </div>

        {/* Year Taken */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Taken
          </label>
          <select
            value={yearTaken}
            onChange={(e) => setYearTaken(e.target.value)}
            className={`${selectClassName} appearance-none`}
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
        </div>

        {/* Result Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Result Status
          </label>
          <select
            value={resultStatus}
            onChange={(e) => setResultStatus(e.target.value)}
            className={`${selectClassName} appearance-none`}
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
        </div>

        {/* Score / Marks */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Score / Marks
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
            className={inputClassName}
          />
        </div>

        {/* Score Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Score Type
          </label>
          <select
            value={scoreType}
            onChange={(e) => setScoreType(e.target.value)}
            className={`${selectClassName} appearance-none pr-10`}
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
        </div>

        {/* Valid Until */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Valid Until
          </label>
          <ProfileDatePicker
            value={validUntil}
            onChange={setValidUntil}
          />
        </div>

        {/* Additional Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
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
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragActive
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
                      {isStoredProfileDocument(doc) && (
                        <>
                          <button
                            type="button"
                            onClick={() => openProfileDocumentInNewTab(doc.url!, doc.name)}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="View Document"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => void downloadProfileDocumentItem(doc, doc.name)}
                            className="text-orange-600 hover:text-orange-700 transition-colors"
                            title="Download Document"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
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
