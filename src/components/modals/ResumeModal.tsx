'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';
import DocumentViewerModal from './DocumentViewerModal';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ResumeData) => void;
  initialData?: ResumeData;
}

export interface ResumeData {
  file?: File | string;
  fileName?: string;
  uploadedDate?: string;
  fileUrl?: string;
}

const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
};

export default function ResumeModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ResumeModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadedResume, setUploadedResume] = useState<{ name: string; date: string; size?: number; url?: string } | null>(
    initialData?.fileName ? {
      name: initialData.fileName,
      date: initialData.uploadedDate || new Date().toISOString(),
      url: initialData.fileUrl,
    } : null
  );
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Preview Modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: '',
    name: '',
  });

  useEffect(() => {
    if (initialData) {
      if (initialData.fileName) {
        setUploadedResume({
          name: initialData.fileName,
          date: initialData.uploadedDate || new Date().toISOString(),
          url: initialData.fileUrl,
        });
      }
      if (initialData.file instanceof File) {
        setResumeFile(initialData.file);
      }
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setResumeFile(null);
    setUploadedResume(null);
    setIsAnalyzing(false);
    setIsDragging(false);
    dragCounter.current = 0;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    // Check file type by extension and mime type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const validExtensions = ['.pdf', '.doc', '.docx'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert(`Please upload a PDF, DOC, or DOCX file. File type not supported: ${fileExtension || file.type || 'Unknown'}`);
      return;
    }

    setResumeFile(file);
    setUploadedResume({
      name: file.name,
      date: new Date().toISOString(),
      size: file.size,
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const handleDelete = () => {
    setResumeFile(null);
    setUploadedResume(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreview = () => {
    let url = '';
    if (resumeFile) {
      url = URL.createObjectURL(resumeFile);
    } else if (uploadedResume?.url) {
      url = resolveDocumentUrl(uploadedResume.url);
    }

    if (url) {
      setPreviewModal({
        isOpen: true,
        url,
        name: uploadedResume?.name || 'Resume',
      });
    } else if (uploadedResume) {
      alert('Preview not available since the file URL was not provided.');
    }
  };

  const handleDownload = async () => {
    let url = '';
    if (resumeFile) {
      url = URL.createObjectURL(resumeFile);
    } else if (uploadedResume?.url) {
      url = resolveDocumentUrl(uploadedResume.url);
    }

    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = uploadedResume?.name || 'resume';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = url;
      link.download = uploadedResume?.name || 'resume';
      link.target = "_blank";
      link.click();
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        file: resumeFile || undefined,
        fileName: uploadedResume?.name,
        uploadedDate: uploadedResume?.date,
      });
      setIsAnalyzing(false);
      onClose();
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Resume"
      widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
      footer={(
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || (!resumeFile && !uploadedResume)}
            className="h-10 flex min-w-[120px] items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white transition-all hover:bg-orange-600 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Save Resume'
            )}
          </button>
        </div>
      )}
    >
            <div className="space-y-6">
              {/* Drag and Drop Area */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed text-center transition-all duration-200 ease-in-out ${
                  isDragging
                    ? 'scale-[1.01] border-blue-500 bg-blue-100 shadow-sm'
                    : uploadedResume
                      ? 'border-gray-300 bg-gray-50 p-8 hover:border-blue-400 hover:bg-blue-50'
                      : 'border-amber-200 bg-amber-50/50 p-12 hover:border-amber-400 hover:bg-amber-50'
                  }`}
              >
                {!uploadedResume && (
                   <p className="mb-4 text-xs font-medium text-amber-600">Resume is required to save</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <svg
                  className="mx-auto mb-4 h-16 w-16 text-[#9095A1]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <p className="mb-2 text-lg font-semibold text-gray-800">
                  Drag & drop your resume
                </p>
                <p className="mb-4 text-sm text-gray-500">
                  or click to browse
                </p>
                <p className="text-xs text-[#9095A1]">
                  PDF, DOC, DOCX • Max 5 MB
                </p>
              </div>

              {/* Uploaded File Section */}
              {uploadedResume && (
                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
                  <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    <span>✔</span>
                    <span>Resume uploaded successfully</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex-shrink-0 rounded-lg bg-gray-100 p-2">
                      <svg
                        className="h-6 w-6 text-[#9095A1]"
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
                    </div>
                      <div className="min-w-0 space-y-1">
                        <p
                          className="truncate text-sm font-semibold text-gray-900"
                          title={uploadedResume.name}
                        >
                          {uploadedResume.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Uploaded on {formatDateForDisplay(uploadedResume.date)}
                        </p>
                        {uploadedResume.size && (
                          <p className="text-xs text-gray-500">
                            Size: {formatFileSize(uploadedResume.size)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-3">
                      {(resumeFile || uploadedResume?.url) && (
                        <>
                          <button
                            type="button"
                            onClick={handlePreview}
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="View Resume"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={handleDownload}
                            className="text-orange-600 hover:text-orange-700 transition-colors"
                            title="Download Resume"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                        </>
                      )}
                      <button
                        onClick={handleReplace}
                        className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                        title="Replace Resume"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-1 text-amber-600 hover:text-amber-700 hover:bg-red-50 rounded transition-colors"
                        title="Delete Resume"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
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
