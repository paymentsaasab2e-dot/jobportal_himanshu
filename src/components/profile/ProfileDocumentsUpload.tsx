'use client';

import { useRef, useState } from 'react';
import { resolveDocumentUrl } from '@/lib/api-base';
import {
  downloadProfileDocumentItem,
  formatProfileDocumentSize,
  getProfileDocumentDisplayName,
  isStoredProfileDocument,
  type ProfileDocumentItem,
  validateProfileDocumentFile,
} from '@/lib/profile-documents';

export interface ProfileDocumentsUploadProps {
  label: string;
  optionalHint?: string;
  helperText?: string;
  documents: ProfileDocumentItem[];
  onChange: (documents: ProfileDocumentItem[]) => void;
  accept?: string;
  maxSizeMb?: number;
  className?: string;
}

export function ProfileDocumentsUpload({
  label,
  optionalHint = '(Optional)',
  helperText = 'PDF, PNG, or JPG up to 5MB each. You can add multiple files.',
  documents,
  onChange,
  accept = '.pdf,.png,.jpg,.jpeg',
  maxSizeMb = 5,
  className = '',
}: ProfileDocumentsUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList?.length) return;
    const next = [...documents];
    for (const file of Array.from(fileList)) {
      const check = validateProfileDocumentFile(file, maxSizeMb);
      if (!check.ok) {
        alert(check.message);
        continue;
      }
      next.push({
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
      });
    }
    onChange(next);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDoc = (id: string) => {
    onChange(documents.filter((d) => d.id !== id));
  };

  return (
    <div className={className}>
      <label className="profile-modal-label mb-2 block">
        {label}{' '}
        {optionalHint ? (
          <span className="profile-modal-helper font-normal inline">{optionalHint}</span>
        ) : null}
      </label>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
        }`}
      >
        <p className="profile-modal-helper text-gray-600">
          <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
        </p>
        <p className="profile-modal-helper mt-1 text-gray-500">
          {documents.length > 0 ? 'Add more documents' : 'Select one or more files'}
        </p>
      </div>

      {helperText ? <p className="profile-modal-helper mt-1 text-gray-500">{helperText}</p> : null}

      {documents.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="profile-modal-label mb-0">
            Uploaded documents ({documents.length})
          </p>
          {documents.map((doc) => {
            const displayName = getProfileDocumentDisplayName(doc);
            const href = isStoredProfileDocument(doc) && doc.url ? resolveDocumentUrl(doc.url) : undefined;
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 min-w-0"
              >
                <svg
                  className="h-5 w-5 shrink-0 text-[#9095A1]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900" title={displayName}>
                    {displayName}
                  </p>
                  {doc.size ? (
                    <p className="profile-modal-helper text-gray-500">{formatProfileDocumentSize(doc.size)}</p>
                  ) : doc.file ? (
                    <p className="profile-modal-helper text-gray-500">Ready to upload on save</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {href ? (
                    <>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                        onClick={(e) => e.stopPropagation()}
                        title="View document"
                        aria-label={`View ${displayName}`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void downloadProfileDocumentItem(doc, displayName);
                        }}
                        className="rounded-lg p-1.5 text-orange-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
                        title="Download document"
                        aria-label={`Download ${displayName}`}
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </>
                  ) : null}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeDoc(doc.id);
                    }}
                    className="p-1 text-[#9095A1] hover:text-amber-700"
                    title="Remove"
                    aria-label={`Remove ${displayName}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
