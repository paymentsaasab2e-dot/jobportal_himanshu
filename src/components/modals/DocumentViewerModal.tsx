'use client';

import { X, Download, ExternalLink, FileText, Image as ImageIcon, File } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

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

  if (!isOpen || !mounted) return null;

  // Improved detection of file types
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(documentUrl) || documentUrl.startsWith('data:image/');
  const isPdf = /\.pdf$/i.test(documentUrl) || documentUrl.startsWith('data:application/pdf');

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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4 sm:px-7">
          <div className="flex items-center gap-4 min-w-0">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isPdf ? 'bg-red-50 text-red-600' : isImage ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600'}`}>
              {isPdf ? (
                <FileText className="h-6 w-6" />
              ) : isImage ? (
                <ImageIcon className="h-6 w-6" />
              ) : (
                <File className="h-6 w-6" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900 tracking-tight">{documentName}</h3>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Document Preview</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const response = await fetch(documentUrl);
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = documentName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                } catch (error) {
                  const link = document.createElement('a');
                  link.href = documentUrl;
                  link.download = documentName;
                  link.target = "_blank";
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
              href={documentUrl}
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

        {/* Content */}
        <div className="relative flex-1 overflow-auto bg-slate-100/50 p-4 sm:p-6 md:p-8">
          {isImage ? (
            <div className="flex h-full items-center justify-center">
              <img
                src={documentUrl}
                alt={documentName}
                className="max-h-full max-w-full rounded-xl shadow-lg object-contain bg-white transition-transform duration-300"
              />
            </div>
          ) : isPdf ? (
            <div className="h-full w-full rounded-2xl overflow-hidden shadow-lg bg-white">
              <iframe
                src={`${documentUrl}#toolbar=0`}
                className="h-full w-full border-0"
                title={documentName}
              />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center p-10">
              <div className="mb-6 rounded-[28px] bg-white p-8 shadow-sm">
                <File className="h-16 w-16 text-slate-300" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">Preview not available</h4>
              <p className="mt-2 max-w-xs text-[15px] font-medium text-slate-500 leading-relaxed">
                This file type cannot be previewed directly. Please download it or open it in a new tab.
              </p>
              <div className="mt-8 flex gap-4">
                <a
                  href={documentUrl}
                  download={documentName}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95"
                >
                  Download File
                </a>
                <a
                  href={documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-xl bg-white px-8 py-3 text-sm font-bold text-slate-700 border border-slate-200 transition-all hover:bg-slate-50 active:scale-95"
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
