'use client';

import { X, ExternalLink, FileText, Image as ImageIcon, File } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveDocumentUrl } from '@/lib/api-base';
import {
  buildResumeHtmlPreviewUrl,
  buildResumeViewerUrl,
  canPreviewResumeAsHtml,
  canPreviewResumeInline,
  getResumeExtension,
  normalizeResumeHref,
} from '@/lib/resumePreview';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentName: string;
}

export default function DocumentViewerModal({
  isOpen,
  onClose,
  documentUrl,
  documentName,
}: DocumentViewerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [htmlLoading, setHtmlLoading] = useState(false);
  const [htmlError, setHtmlError] = useState<string | null>(null);

  const href = documentUrl ? normalizeResumeHref(resolveDocumentUrl(documentUrl)) : '';
  const isImage =
    /\.(jpg|jpeg|png|gif|webp)$/i.test(href) || href.startsWith('data:image/');
  const canPdf = Boolean(href && canPreviewResumeInline(href));
  const canHtml = Boolean(href && canPreviewResumeAsHtml(href));
  const extension = getResumeExtension(href);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !href || !canHtml) {
      setHtmlPreview(null);
      setHtmlLoading(false);
      setHtmlError(null);
      return;
    }

    let cancelled = false;
    setHtmlLoading(true);
    setHtmlError(null);
    setHtmlPreview(null);

    const loadPreview = async () => {
      try {
        const response = await fetch(buildResumeHtmlPreviewUrl(href), { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Failed to load preview (${response.status})`);
        }
        const html = await response.text();
        if (!cancelled) setHtmlPreview(html);
      } catch (error: unknown) {
        if (!cancelled) {
          setHtmlError(error instanceof Error ? error.message : 'Preview unavailable');
          setHtmlPreview(null);
        }
      } finally {
        if (!cancelled) setHtmlLoading(false);
      }
    };

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [isOpen, href, canHtml]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 md:p-10"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      <div className="relative z-10 flex h-full w-full max-w-5xl flex-col overflow-hidden rounded-[24px] bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                canPdf ? 'bg-red-50 text-red-600' : isImage ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'
              }`}
            >
              {canPdf ? (
                <FileText className="h-6 w-6" />
              ) : isImage ? (
                <ImageIcon className="h-6 w-6" />
              ) : (
                <File className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold tracking-tight text-slate-900">{documentName}</h3>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Document Preview</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const response = await fetch(href);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = documentName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch {
                  const link = document.createElement('a');
                  link.href = href;
                  link.download = documentName;
                  link.target = '_blank';
                  link.click();
                }
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
              title="Download"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
              title="Open in new tab"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-all hover:bg-red-50 hover:text-red-600"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 overflow-auto bg-slate-100/50 p-4 sm:p-6 md:p-8">
          {isImage ? (
            <div className="flex h-full items-center justify-center">
              <img
                src={href}
                alt={documentName}
                className="max-h-full max-w-full rounded-xl bg-white object-contain shadow-lg transition-transform duration-300"
              />
            </div>
          ) : canPdf ? (
            <div className="h-full min-h-[min(70vh,640px)] w-full overflow-hidden rounded-2xl bg-white shadow-lg">
              <iframe
                src={buildResumeViewerUrl(href)}
                className="h-full w-full border-0"
                title={documentName}
              />
            </div>
          ) : canHtml ? (
            htmlLoading ? (
              <div className="flex h-full min-h-[min(70vh,640px)] items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <div className="text-center">
                  <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
                  <p className="text-sm text-slate-600">Loading document preview...</p>
                </div>
              </div>
            ) : htmlError ? (
              <div className="flex h-full min-h-[320px] items-center justify-center">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <h4 className="text-base font-semibold text-slate-900">Preview unavailable</h4>
                  <p className="mt-2 text-sm text-slate-500">{htmlError}</p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      Open file
                    </a>
                  </div>
                </div>
              </div>
            ) : htmlPreview ? (
              <iframe
                title={documentName}
                srcDoc={htmlPreview}
                sandbox="allow-same-origin"
                className="h-full min-h-[min(70vh,640px)] w-full rounded-xl border border-slate-200 bg-white"
              />
            ) : (
              <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-white">
                <p className="text-sm text-slate-500">No preview data available.</p>
              </div>
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center p-10 text-center">
              <div className="mb-6 rounded-[28px] bg-white p-8 shadow-sm">
                <File className="h-16 w-16 text-slate-300" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Preview not available</h4>
              <p className="mt-2 max-w-xs text-[15px] font-medium leading-relaxed text-slate-500">
                This file is stored as{' '}
                <span className="font-semibold">{extension.toUpperCase() || 'a document'}</span>. Please
                download it or open it in a new tab.
              </p>
              <div className="mt-8 flex gap-4">
                <a
                  href={href}
                  download={documentName}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                  Download File
                </a>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-xl border border-slate-200 bg-white px-8 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
                >
                  Open Original
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
