'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';

interface AcademicAchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AcademicAchievementData) => void;
  initialData?: AcademicAchievementData;
}

export interface AcademicAchievementDocument {
  id: string;
  file?: File;
  name: string;
  url?: string;
  size?: number;
}

export interface AcademicAchievementData {
  id?: string;
  achievementTitle: string;
  awardedBy: string;
  yearReceived: string;
  categoryType: string;
  description: string;
  documents?: AcademicAchievementDocument[];
}

export default function AcademicAchievementModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AcademicAchievementModalProps) {
  const [achievementTitle, setAchievementTitle] = useState(initialData?.achievementTitle || '');
  const [awardedBy, setAwardedBy] = useState(initialData?.awardedBy || '');
  const [yearReceived, setYearReceived] = useState(initialData?.yearReceived || '');
  const [categoryType, setCategoryType] = useState(initialData?.categoryType || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [documents, setDocuments] = useState<AcademicAchievementDocument[]>(initialData?.documents || []);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update values when initialData changes
  useEffect(() => {
    if (initialData) {
      setAchievementTitle(initialData.achievementTitle || '');
      setAwardedBy(initialData.awardedBy || '');
      setYearReceived(initialData.yearReceived || '');
      setCategoryType(initialData.categoryType || '');
      setDescription(initialData.description || '');
      
      // Normalize documents to ensure they all have unique IDs
      const normalizedDocuments: AcademicAchievementDocument[] = (initialData.documents || []).map((doc: any, index) => {
        if (typeof doc === 'string') {
          // If it's a string (URL from database), convert to object
          return {
            id: `doc-${Date.now()}-${index}`,
            url: doc,
            name: doc.split('/').pop() || 'Document',
          };
        } else if (doc && typeof doc === 'object') {
          // If it's already an object, ensure it has an id
          return {
            id: doc.id || `doc-${Date.now()}-${index}`,
            file: doc.file,
            name: doc.name || 'Document',
            url: doc.url,
            size: doc.size,
          };
        } else {
          // Fallback for any other type
          return {
            id: `doc-${Date.now()}-${index}`,
            name: 'Document',
          };
        }
      });
      setDocuments(normalizedDocuments);
    } else {
      // Clear all fields for "Add" mode
      setAchievementTitle('');
      setAwardedBy('');
      setYearReceived('');
      setCategoryType('');
      setDescription('');
      setDocuments([]);
    }
  }, [initialData, isOpen]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only PDF, PNG, and JPG files are allowed.`);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 5MB.`);
        return;
      }

      const newDoc: AcademicAchievementDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
      };
      setDocuments((prev) => [...prev, newDoc]);
    });
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

  const missingRequiredFields: string[] = [];
  if (!String(achievementTitle || '').trim()) missingRequiredFields.push('Achievement Title');
  if (!String(awardedBy || '').trim()) missingRequiredFields.push('Awarded By');
  if (!yearReceived) missingRequiredFields.push('Year Received');
  if (!String(categoryType || '').trim()) missingRequiredFields.push('Category / Type');
  if (!String(description || '').trim()) missingRequiredFields.push('Description');
  if (documents.length === 0) missingRequiredFields.push('Achievement Certificates/Documents');

  const isFormValid = missingRequiredFields.length === 0;

  const handleSave = () => {
    if (!isFormValid) {
      alert(`Please complete all required fields: ${missingRequiredFields.join(', ')}`);
      return;
    }

    onSave({
      achievementTitle: achievementTitle.trim(),
      awardedBy: awardedBy.trim(),
      yearReceived,
      categoryType,
      description: description.trim(),
      documents: documents.length > 0 ? documents : undefined,
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
      title="Add Academic Achievement"
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
            onClick={handleSave}
            disabled={!isFormValid}
            className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            Save Achievement
          </button>
        </div>
      )}
    >
            <div className="space-y-6">
              {/* Achievement Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Achievement Title <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  value={achievementTitle}
                  onChange={(e) => setAchievementTitle(e.target.value)}
                  placeholder="e.g., Academic Excellence Award, Top 1% in Class, Dean's List"
                  className={`${inputClassName} ${!achievementTitle.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                />
                {!achievementTitle.trim() && (
                  <p className="mt-1 text-xs text-amber-600">Achievement title is required</p>
                )}
              </div>

              {/* Awarded By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Awarded By <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  value={awardedBy}
                  onChange={(e) => setAwardedBy(e.target.value)}
                  placeholder="University / Board / Institution name"
                  className={`${inputClassName} ${!awardedBy.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                />
                {!awardedBy.trim() && (
                  <p className="mt-1 text-xs text-amber-600">Awarded by is required</p>
                )}
              </div>

              {/* Year Received */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year Received <span className="text-amber-600">*</span>
                </label>
                <select
                  value={yearReceived}
                  onChange={(e) => setYearReceived(e.target.value)}
                  className={`${selectClassName} ${!yearReceived && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'} appearance-none`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2399A1AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '40px'
                  }}
                >
                  <option value="">Select year</option>
                  {yearOptions.map((year) => (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  ))}
                </select>
                {!yearReceived && (
                  <p className="mt-1 text-xs text-amber-600">Year received is required</p>
                )}
              </div>

              {/* Category / Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category / Type <span className="text-amber-600">*</span>
                </label>
                <select
                  value={categoryType}
                  onChange={(e) => setCategoryType(e.target.value)}
                  className={`${selectClassName} ${!categoryType.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'} appearance-none`}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 12 12' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%2399A1AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    paddingRight: '40px'
                  }}
                >
                  <option value="">Select a category</option>
                  <option value="Academic Excellence">Academic Excellence</option>
                  <option value="Scholarship">Scholarship</option>
                  <option value="Competition">Competition</option>
                  <option value="Research">Research</option>
                  <option value="Publication">Publication</option>
                  <option value="Honor Society">Honor Society</option>
                  <option value="Other">Other</option>
                </select>
                {!categoryType.trim() && (
                  <p className="mt-1 text-xs text-amber-600">Category is required</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-amber-600">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description of the achievement, criteria, rank, and significance."
                  rows={4}
                  className={`${textareaClassName} ${!description.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                />
                {!description.trim() && (
                  <p className="mt-1 text-xs text-amber-600">Description is required</p>
                )}
              </div>

              {/* Upload Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Academic Achievements Certificates/Documents <span className="text-amber-600">*</span>
                </label>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />

                {/* Drag and drop area */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : documents.length === 0
                      ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
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
                      className={documents.length === 0 ? 'text-amber-600' : 'text-gray-400'}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className={`text-sm text-center ${documents.length === 0 ? 'text-amber-600' : 'text-gray-600'}`}>
                      <span className={documents.length === 0 ? 'text-amber-700 font-medium' : 'text-blue-600 font-medium'}>Click to upload</span> or drag and drop
                    </p>
                    <p className={`text-xs ${documents.length === 0 ? 'text-amber-600' : 'text-gray-500'}`}>PDF, PNG, JPG (Max 5MB per file)</p>
                  </div>
                </div>
                {documents.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">At least one document is required</p>
                )}

                {/* Display uploaded files */}
                {documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Uploaded Documents ({documents.length})
                    </p>
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
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
                          <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                          {doc.size && (
                            <span className="text-xs text-gray-500">
                              ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
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
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(doc.id)}
                          className="ml-2 p-1 text-amber-600 hover:text-amber-700 hover:bg-red-50 rounded transition-colors"
                          aria-label="Remove file"
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

              {missingRequiredFields.length > 0 && (
                <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                  <p className="text-xs font-medium text-amber-700">
                    Missing required fields: {missingRequiredFields.join(', ')}
                  </p>
                </div>
              )}
            </div>

    </ProfileDrawer>
  );
}
