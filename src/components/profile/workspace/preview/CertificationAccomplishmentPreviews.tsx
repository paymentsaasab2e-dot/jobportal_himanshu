'use client';

import type { Certification } from '@/components/modals/CertificationModal';
import type { Accomplishment } from '@/components/modals/AccomplishmentModal';
import {
  PreviewDocCount,
  PreviewEntryShell,
  PreviewMetaItem,
  textSnippet,
} from './PreviewPrimitives';
import { useState } from 'react';
import DocumentViewerModal from '@/components/modals/DocumentViewerModal';

type CertProps = {
  cert: Certification;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDocumentName: (doc: unknown) => string;
  resolveDocHref: (doc: unknown) => string;
};

export function CertificationEntryPreview({
  cert,
  isExpanded,
  onEdit,
  onDelete,
  getDocumentName,
  resolveDocHref,
}: CertProps) {
  const docCount = cert.documents?.length ?? 0;
  const expiryLine = cert.doesNotExpire
    ? 'No expiry'
    : cert.expiryDate || '—';

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: '',
    name: '',
  });

  const handlePreview = (url: string, name: string) => {
    setPreviewModal({
      isOpen: true,
      url,
      name,
    });
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.target = "_blank";
      link.click();
    }
  };

  return (
    <PreviewEntryShell accent="green">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h4 className="text-base font-bold text-gray-900">
              {cert.certificationName || '—'}
            </h4>
            <p className="text-sm font-semibold text-green-700">
              {cert.issuingOrganization || '—'}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            Issued <span className="font-medium text-gray-700">{cert.issueDate || '—'}</span>
            {' · '}
            Expires <span className="font-medium text-gray-700">{expiryLine}</span>
          </p>
          {cert.credentialId ? (
            <p className="text-xs text-gray-500">
              ID{' '}
              <span className="font-mono text-gray-700">{cert.credentialId}</span>
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <PreviewDocCount count={docCount} />
            {docCount === 1 && cert.documents?.[0] && (
              <div className="flex items-center gap-2 ml-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(resolveDocHref(cert.documents![0]), getDocumentName(cert.documents![0]));
                  }}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Certificate"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(resolveDocHref(cert.documents![0]), getDocumentName(cert.documents![0]));
                  }}
                  className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Download Certificate"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete certification"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {!isExpanded && cert.description ? (
        <p className="mt-2 text-xs leading-relaxed text-gray-600 line-clamp-2">
          {textSnippet(cert.description, 180)}
        </p>
      ) : null}

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          {!cert.doesNotExpire && cert.expiryDate ? (
            <PreviewMetaItem label="Expiry date" value={cert.expiryDate} />
          ) : null}
          {cert.doesNotExpire ? (
            <PreviewMetaItem
              label="Expiry"
              value="This certification does not expire"
            />
          ) : null}
          {cert.credentialUrl ? (
            <PreviewMetaItem
              label="Credential URL"
              value={
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-orange-700 hover:underline"
                >
                  {cert.credentialUrl}
                </a>
              }
            />
          ) : null}
          {cert.description ? (
            <PreviewMetaItem
              label="Description"
              value={
                <p className="whitespace-pre-wrap font-normal text-gray-700">
                  {cert.description}
                </p>
              }
            />
          ) : null}
          {docCount > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Documents
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {cert.documents!.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="truncate flex-1 font-medium">{getDocumentName(doc)}</span>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handlePreview(resolveDocHref(doc), getDocumentName(doc))}
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
                        onClick={() => handleDownload(resolveDocHref(doc), getDocumentName(doc))}
                        className="text-orange-600 hover:text-orange-700 transition-colors"
                        title="Download Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <DocumentViewerModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        documentUrl={previewModal.url}
        documentName={previewModal.name}
      />
    </PreviewEntryShell>
  );
}

type AccProps = {
  acc: Accomplishment;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getDocumentName: (doc: unknown) => string;
  resolveDocHref: (doc: unknown) => string;
};

export function AccomplishmentEntryPreview({
  acc,
  isExpanded,
  onEdit,
  onDelete,
  getDocumentName,
  resolveDocHref,
}: AccProps) {
  const docCount = acc.documents?.length ?? 0;

  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: '',
    name: '',
  });

  const handlePreview = (url: string, name: string) => {
    setPreviewModal({
      isOpen: true,
      url,
      name,
    });
  };

  const handleDownload = async (url: string, name: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.target = "_blank";
      link.click();
    }
  };

  return (
    <PreviewEntryShell accent="purple">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <h4 className="text-base font-bold text-gray-900">
              {acc.title || '—'}
            </h4>
            <p className="text-sm font-semibold text-purple-700">
              {acc.category || '—'}
            </p>
          </div>
          <p className="text-xs text-gray-500">
            {acc.organization ? (
              <span className="font-medium text-gray-700">
                {acc.organization}
              </span>
            ) : null}
            {acc.organization && acc.achievementDate ? ' · ' : null}
            {acc.achievementDate ? (
              <span>{acc.achievementDate}</span>
            ) : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <PreviewDocCount count={docCount} />
            {docCount === 1 && acc.documents?.[0] && (
              <div className="flex items-center gap-2 ml-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(resolveDocHref(acc.documents![0]), getDocumentName(acc.documents![0]));
                  }}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Document"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(resolveDocHref(acc.documents![0]), getDocumentName(acc.documents![0]));
                  }}
                  className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Download Document"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
            aria-label="Delete accomplishment"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {!isExpanded && acc.description ? (
        <p className="mt-2 text-xs leading-relaxed text-gray-600 line-clamp-2">
          {textSnippet(acc.description, 180)}
        </p>
      ) : null}

      {isExpanded ? (
        <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
          {acc.description ? (
            <PreviewMetaItem
              label="Description"
              value={
                <p className="whitespace-pre-wrap font-normal text-gray-700">
                  {acc.description}
                </p>
              }
            />
          ) : null}
          {docCount > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Supporting documents
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {acc.documents!.map((doc, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="truncate flex-1 font-medium">{getDocumentName(doc)}</span>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handlePreview(resolveDocHref(doc), getDocumentName(doc))}
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
                        onClick={() => handleDownload(resolveDocHref(doc), getDocumentName(doc))}
                        className="text-orange-600 hover:text-orange-700 transition-colors"
                        title="Download Document"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <DocumentViewerModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
        documentUrl={previewModal.url}
        documentName={previewModal.name}
      />
    </PreviewEntryShell>
  );
}
