'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';
import DocumentViewerModal from './DocumentViewerModal';

interface AccomplishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AccomplishmentsData) => void;
  initialData?: AccomplishmentsData;
  editingAccomplishmentId?: string | null;
}

export interface AccomplishmentDocument {
  id: string;
  file?: File;
  name: string;
  url?: string;
  size?: number;
}

export interface Accomplishment {
  id: string;
  title: string;
  category: string;
  organization?: string;
  achievementDate: string;
  description?: string;
  supportingDocument?: File | string;
  documents?: AccomplishmentDocument[];
}

export interface AccomplishmentsData {
  accomplishments: Accomplishment[];
}

const ACCOMPLISHMENT_CATEGORIES = [
  'Award',
  'Publication',
  'Research',
  'Competition',
  'Conference',
  'Patent',
  'Recognition',
  'Achievement',
  'Other'
];

const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

export default function AccomplishmentModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  editingAccomplishmentId: externalEditingAccomplishmentId,
}: AccomplishmentModalProps) {
  const [accomplishments, setAccomplishments] = useState<Accomplishment[]>(initialData?.accomplishments || []);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [organization, setOrganization] = useState('');
  const [achievementDate, setAchievementDate] = useState('');
  const [description, setDescription] = useState('');
  const [supportingDocument, setSupportingDocument] = useState<File | null>(null);
  const [documents, setDocuments] = useState<AccomplishmentDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [editingAccomplishmentId, setEditingAccomplishmentId] = useState<string | null>(null);
  
  // Error states
  const [errors, setErrors] = useState({
    title: '',
    category: '',
    achievementDate: '',
  });

  // Preview Modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: '',
    name: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const nextAccomplishments = initialData?.accomplishments || [];
    setAccomplishments(nextAccomplishments);

    if (externalEditingAccomplishmentId) {
      const accomplishmentToEdit = nextAccomplishments.find(
        acc => acc.id === externalEditingAccomplishmentId
      );

      if (accomplishmentToEdit) {
        setTitle(accomplishmentToEdit.title);
        setCategory(accomplishmentToEdit.category);
        setOrganization(accomplishmentToEdit.organization || '');
        setAchievementDate(accomplishmentToEdit.achievementDate);
        setDescription(accomplishmentToEdit.description || '');
        setEditingAccomplishmentId(accomplishmentToEdit.id);
        setSupportingDocument(
          accomplishmentToEdit.supportingDocument instanceof File
            ? accomplishmentToEdit.supportingDocument
            : null
        );
        setDocuments(
          (accomplishmentToEdit.documents || []).map((doc: string | { id?: string; file?: File; name?: string; url?: string; size?: number }, index) => {
            if (typeof doc === 'string') {
              return {
                id: `doc-${accomplishmentToEdit.id}-${index}`,
                url: doc,
                name: doc.split('/').pop() || 'Document',
              };
            }

            return {
              id: doc.id || `doc-${accomplishmentToEdit.id}-${index}`,
              file: doc.file,
              name: doc.name || 'Document',
              url: doc.url,
              size: doc.size,
            };
          })
        );
        setErrors({
          title: '',
          category: '',
          achievementDate: '',
        });
        return;
      }
    }

    resetForm();
  }, [externalEditingAccomplishmentId, initialData, isOpen]);

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setOrganization('');
    setAchievementDate('');
    setDescription('');
    setSupportingDocument(null);
    setDocuments([]);
    setDragActive(false);
    setEditingAccomplishmentId(null);
    setErrors({
      title: '',
      category: '',
      achievementDate: '',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateForm = (): boolean => {
    const newErrors = {
      title: '',
      category: '',
      achievementDate: '',
    };

    if (!title.trim()) {
      newErrors.title = 'Accomplishment Title is required.';
    }
    if (!category.trim()) {
      newErrors.category = 'Category / Type is required.';
    }
    if (!achievementDate.trim()) {
      newErrors.achievementDate = 'Achievement Date is required.';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles: AccomplishmentDocument[] = [];
    
    for (const file of files) {
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum file size is 5MB.`);
        continue;
      }
      // Check file type
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a valid file type. Please upload PDF, PNG, or JPG files.`);
        continue;
      }
      
      validFiles.push({
        id: `doc-${Date.now()}-${Math.random()}`,
        file: file,
        name: file.name,
        size: file.size,
      });
    }
    
    setDocuments([...documents, ...validFiles]);
  };

  const handleRemoveFile = (docId: string) => {
    setDocuments(documents.filter(doc => doc.id !== docId));
  };

  const handlePreviewDocument = (doc: AccomplishmentDocument) => {
    let url = '';
    if (doc.url) {
      url = resolveDocumentUrl(doc.url);
    } else if (doc.file) {
      url = URL.createObjectURL(doc.file);
    }

    if (url) {
      setPreviewModal({
        isOpen: true,
        url: url,
        name: doc.name,
      });
    }
  };

  const handleDownloadFile = async (doc: AccomplishmentDocument) => {
    let url = '';
    if (doc.url) {
      url = resolveDocumentUrl(doc.url);
    } else if (doc.file) {
      url = URL.createObjectURL(doc.file);
    }

    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      link.target = "_blank";
      link.click();
    }
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
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  };

  const buildAccomplishmentFromForm = (): Accomplishment => ({
    id: editingAccomplishmentId || Date.now().toString(),
    title: title.trim(),
    category,
    organization: organization.trim() || undefined,
    achievementDate,
    description: description.trim() || undefined,
    supportingDocument: supportingDocument || undefined,
    documents: documents.length > 0 ? documents : undefined,
  });

  const hasFormValues = Boolean(
    title.trim() ||
      category.trim() ||
      organization.trim() ||
      achievementDate.trim() ||
      description.trim() ||
      documents.length > 0 ||
      supportingDocument
  );

  const isFormComplete = Boolean(
    title.trim() &&
      category.trim() &&
      achievementDate.trim()
  );

  const handleEditAccomplishment = (acc: Accomplishment) => {
    setTitle(acc.title);
    setCategory(acc.category);
    setOrganization(acc.organization || '');
    setAchievementDate(acc.achievementDate);
    setDescription(acc.description || '');
    setEditingAccomplishmentId(acc.id);
    setSupportingDocument(acc.supportingDocument instanceof File ? acc.supportingDocument : null);
    setDocuments(acc.documents || []);
    setErrors({
      title: '',
      category: '',
      achievementDate: '',
    });
  };

  const handleDeleteAccomplishment = (accId: string) => {
    setAccomplishments(accomplishments.filter(acc => acc.id !== accId));
  };

  const handleSave = () => {
    let nextAccomplishments = accomplishments;

    if (editingAccomplishmentId || hasFormValues) {
      if (!validateForm()) {
        return;
      }

      const nextAccomplishment = buildAccomplishmentFromForm();
      nextAccomplishments = editingAccomplishmentId
        ? accomplishments.map(acc =>
            acc.id === editingAccomplishmentId ? nextAccomplishment : acc
          )
        : [...accomplishments, nextAccomplishment];
    }

    onSave({ accomplishments: nextAccomplishments });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingAccomplishmentId ? 'Edit Accomplishment' : 'Add Accomplishment'}
      widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
      footer={(
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {isFormComplete && (
            <button
              onClick={handleSave}
              className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600"
            >
              Save Accomplishment
            </button>
          )}
        </div>
      )}
    >
            <div className="space-y-6">
              {/* Accomplishment Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accomplishment Title <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (errors.title) {
                      setErrors({ ...errors, title: '' });
                    }
                  }}
                  placeholder="Enter accomplishment title..."
                  className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    (!title.trim() || errors.title) ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500' : 'border-gray-300'
                  }`}
                />
                {!title.trim() && (
                  <p className="mt-1 text-xs text-amber-600">Accomplishment title is required</p>
                )}
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                )}
              </div>

              {/* Category / Type and Organization - Two Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category / Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category / Type <span className="text-amber-600">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (errors.category) {
                        setErrors({ ...errors, category: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      (!category.trim() || errors.category) ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {ACCOMPLISHMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {!category.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Category is required</p>
                  )}
                  {errors.category && (
                    <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                  )}
                </div>

                {/* Organization / Authority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization / Authority <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., University, Company, Institution"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Achievement Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Achievement Date <span className="text-amber-600">*</span>
                </label>
                <div className="relative">
                  <input
                    type="month"
                    value={achievementDate}
                    onChange={(e) => {
                      setAchievementDate(e.target.value);
                      if (errors.achievementDate) {
                        setErrors({ ...errors, achievementDate: '' });
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      (!achievementDate.trim() || errors.achievementDate) ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {!achievementDate.trim() && (
                  <p className="mt-1 text-xs text-amber-600">Achievement date is required</p>
                )}
                {errors.achievementDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.achievementDate}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about the accomplishment, its significance, or your contribution..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Upload Supporting Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Supporting Documents <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  className={`w-full px-4 py-6 border-2 border-dashed rounded-lg transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-blue-300 bg-blue-50 hover:bg-blue-100'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center justify-center gap-2 text-blue-600"
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-medium">Click to upload or drag and drop</span>
                    <span className="text-xs text-gray-500">PDF, PNG, JPG (Max 5MB per file)</span>
                  </button>
                </div>
                {documents.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg
                            className="h-5 w-5 shrink-0 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                                  <div className="flex items-center gap-3 shrink-0 ml-2">
                                    {(doc.url || doc.file) && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handlePreviewDocument(doc)}
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
                                          onClick={() => handleDownloadFile(doc)}
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
                          className="ml-2 text-red-600 hover:text-red-800"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Previously Added Accomplishments */}
              {accomplishments.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Previously Added Accomplishments</h3>
                  <div className="space-y-3">
                    {accomplishments.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">
                            {acc.title}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span>{acc.category}</span>
                            {acc.organization && (
                              <>
                                <span>•</span>
                                <span>{acc.organization}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{formatDateForDisplay(acc.achievementDate)}</span>
                          </div>
                          {acc.description && (
                            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{acc.description}</p>
                          )}
                        </div>
                        <div className="ml-4 flex shrink-0 items-center gap-2">
                          <button
                            onClick={() => handleEditAccomplishment(acc)}
                            className="p-2 text-[#9095A1] hover:text-blue-600"
                            title="Edit"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteAccomplishment(acc.id)}
                            className="p-2 text-[#9095A1] hover:text-red-600"
                            title="Delete"
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="3 6 5 6 21 6"></polyline>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DocumentViewerModal
              isOpen={previewModal.isOpen}
              onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
              documentUrl={previewModal.url}
              documentName={previewModal.name}
            />
    </ProfileDrawer>
  );
}
