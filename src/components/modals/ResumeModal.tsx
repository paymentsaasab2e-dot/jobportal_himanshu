'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { getProfileDocumentDisplayName } from '@/lib/profile-documents';

interface ResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ResumeData) => void | Promise<void>;
  initialData?: ResumeData;
}

export interface ResumeData {
  file?: File | string;
  fileName?: string;
  uploadedDate?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
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
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadedResume, setUploadedResume] = useState<{ name: string; date: string; size?: number; url?: string } | null>(
    initialData?.fileName || initialData?.fileUrl
      ? {
          name: getProfileDocumentDisplayName(
            initialData.fileName || initialData.fileUrl || 'Resume',
          ),
          date: initialData.uploadedDate || new Date().toISOString(),
          url: initialData.fileUrl,
          size: initialData.fileSize,
        }
      : null
  );
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const sessionInitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      sessionInitKeyRef.current = null;
      return;
    }

    const initKey = initialData?.fileUrl || initialData?.fileName || 'empty';
    if (sessionInitKeyRef.current === initKey) {
      return;
    }
    sessionInitKeyRef.current = initKey;

    if (initialData?.fileName || initialData?.fileUrl) {
      setUploadedResume({
        name: getProfileDocumentDisplayName(
          initialData.fileName || initialData.fileUrl || 'Resume',
        ),
        date: initialData.uploadedDate || new Date().toISOString(),
        url: initialData.fileUrl,
        size: initialData.fileSize,
      });
      setResumeFile(initialData.file instanceof File ? initialData.file : null);
    } else {
      resetForm();
    }
  }, [isOpen, initialData?.fileUrl, initialData?.fileName, initialData?.uploadedDate]);

  const resetForm = () => {
    setResumeFile(null);
    setUploadedResume(null);
    setIsDragging(false);
    dragCounter.current = 0;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

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
      url: undefined,
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave({
        file: resumeFile || undefined,
        fileName: uploadedResume?.name,
        uploadedDate: uploadedResume?.date,
        fileUrl: resumeFile ? undefined : uploadedResume?.url,
        fileSize: resumeFile?.size ?? uploadedResume?.size,
        mimeType: resumeFile?.type,
      });
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
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || (!resumeFile && !uploadedResume)}
            className="h-10 flex min-w-[120px] items-center justify-center rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-75"
          >
            {isSaving ? 'Saving…' : 'Save Resume'}
          </button>
        </div>
      )}
    >
      <div className="space-y-6">
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
          <p className="mb-2 text-lg font-semibold text-gray-800">Drag & drop your resume</p>
          <p className="mb-4 text-sm text-gray-500">or click to browse</p>
          <p className="text-xs text-[#9095A1]">PDF, DOC, DOCX • Max 5 MB</p>
        </div>

        {uploadedResume && (
          <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <span>✔</span>
              <span>Resume ready to save</span>
            </div>
            <div className="flex items-start gap-3">
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
                <p className="truncate text-sm font-semibold text-gray-900" title={uploadedResume.name}>
                  {uploadedResume.name}
                </p>
                <p className="text-xs text-gray-500">
                  {resumeFile ? 'Selected just now' : `Uploaded on ${formatDateForDisplay(uploadedResume.date)}`}
                </p>
                {uploadedResume.size ? (
                  <p className="text-xs text-gray-500">Size: {formatFileSize(uploadedResume.size)}</p>
                ) : null}
                <p className="text-xs text-gray-400">Use the upload area above to replace this file.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProfileDrawer>
  );
}
