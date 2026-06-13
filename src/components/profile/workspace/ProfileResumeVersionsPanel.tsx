'use client';

import { Download, Eye, FileText, Loader2, Pencil, Sparkles, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import {
  deleteResumeRoleVersion,
  exportResumePdf,
  fetchResumeRoleVersion,
  type ResumeRoleVersionItem,
  type ResumeVersionsResponse,
} from '@/app/lms/api/client';
import { localizePath } from '@/lib/i18n';
import { downloadProfileDocument, openProfileDocumentInNewTab } from '@/lib/profile-documents';
import {
  downloadBlobFile,
  getResumeExtension,
  openResumeStudioHtmlInNewTab,
} from '@/lib/resumePreview';

function formatVersionDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function buildPdfFilename(label: string) {
  const base = String(label || 'CV')
    .replace(/[\\/:*?"<>|]+/g, '_')
    .trim() || 'CV';
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

async function downloadStudioCvAsPdf(html: string, label: string) {
  const blob = await exportResumePdf(html);
  if (!blob) {
    throw new Error('PDF export is unavailable. Please sign in and try again.');
  }
  downloadBlobFile(blob, buildPdfFilename(label));
}

function VersionCard({
  label,
  subtitle,
  dateLabel,
  badge,
  badgeTone = 'slate',
  onView,
  onDownloadPdf,
  onEditHref,
  onDelete,
  busy,
  canView,
  canDownloadPdf,
  downloadLabel = 'PDF',
}: {
  label: string;
  subtitle?: string | null;
  dateLabel?: string | null;
  badge: string;
  badgeTone?: 'slate' | 'sky' | 'violet';
  onView: () => void;
  onDownloadPdf: () => void;
  onEditHref?: string;
  onDelete?: () => void;
  busy?: boolean;
  canView?: boolean;
  canDownloadPdf?: boolean;
  downloadLabel?: string;
}) {
  const badgeClass =
    badgeTone === 'sky'
      ? 'border-sky-200 bg-sky-50 text-sky-700'
      : badgeTone === 'violet'
        ? 'border-violet-200 bg-violet-50 text-violet-700'
        : 'border-slate-200 bg-slate-50 text-slate-600';

  return (
    <article className="flex min-h-[7.5rem] flex-col rounded-lg border border-gray-200/90 bg-white p-2.5 shadow-sm transition hover:border-sky-200/80 hover:shadow-md">
      <div className="flex min-h-0 flex-1 items-start gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600">
          <FileText className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1.5">
            <p className="line-clamp-2 text-xs font-semibold leading-snug text-gray-900">{label}</p>
            <span
              className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badgeClass}`}
            >
              {badge}
            </span>
          </div>
          {subtitle ? (
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-gray-500">{subtitle}</p>
          ) : null}
          {dateLabel ? <p className="mt-1 text-[10px] text-gray-400">Saved {dateLabel}</p> : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1 border-t border-gray-100 pt-2">
        <button
          type="button"
          onClick={onView}
        disabled={busy}
        className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-2.5"
          title="View CV"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
          View
        </button>
        <button
          type="button"
          onClick={onDownloadPdf}
        disabled={busy}
        className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-orange-200 bg-orange-50/80 px-2 py-1 text-[10px] font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-2.5"
          title="Download as PDF"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
          {downloadLabel}
        </button>
        {onEditHref ? (
          <Link
            href={onEditHref}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-50 sm:flex-none sm:px-2.5"
            title="Edit in resume studio"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </Link>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-red-200 bg-red-50/80 px-2 py-1 text-[10px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none sm:px-2.5"
            title="Delete this CV version"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
            Delete
          </button>
        ) : null}
      </div>
    </article>
  );
}

export function ProfileResumeVersionsPanel({
  locale,
  versionsData,
  hideOriginal = false,
  onOpenOriginal,
  onVersionsChanged,
}: {
  locale: string;
  versionsData: ResumeVersionsResponse | null;
  hideOriginal?: boolean;
  onOpenOriginal?: () => void;
  onVersionsChanged?: () => void | Promise<void>;
}) {
  const [busyVersionId, setBusyVersionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const resolveVersionDetail = useCallback(async (item: ResumeRoleVersionItem) => {
    if (item.resumeHtml?.trim()) return item;
    if (item.fileUrl && !item.hasStoredVersion) return item;
    const fetched = await fetchResumeRoleVersion(item.id);
    return fetched || item;
  }, []);

  const handleViewVersion = useCallback(
    async (item: ResumeRoleVersionItem) => {
      setActionError(null);
      setBusyVersionId(item.id);
      try {
        const detail = (await resolveVersionDetail(item)) || item;
        if (detail.fileUrl) {
          openProfileDocumentInNewTab(detail.fileUrl, detail.fileName || detail.label);
          return;
        }
        if (detail.resumeHtml?.trim()) {
          openResumeStudioHtmlInNewTab(detail.resumeHtml, detail.label);
          return;
        }
        setActionError('No preview yet. Tap Edit and save once in the resume studio.');
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Could not open CV preview');
      } finally {
        setBusyVersionId(null);
      }
    },
    [resolveVersionDetail],
  );

  const handleDownloadVersionPdf = useCallback(
    async (item: ResumeRoleVersionItem) => {
      setActionError(null);
      setBusyVersionId(item.id);
      try {
        const detail = (await resolveVersionDetail(item)) || item;

        if (detail.resumeHtml?.trim()) {
          await downloadStudioCvAsPdf(detail.resumeHtml, detail.label);
          return;
        }

        if (detail.fileUrl) {
          const ext = getResumeExtension(detail.fileUrl);
          const filename =
            detail.fileName?.trim() ||
            buildPdfFilename(detail.label);
          if (ext === 'pdf') {
            await downloadProfileDocument(detail.fileUrl, filename);
            return;
          }
          throw new Error(
            'This version is not stored as studio HTML. Open Edit, save, then export PDF.',
          );
        }

        setActionError('No PDF available yet. Open Edit and save from the resume studio.');
      } catch (error) {
        setActionError(
          error instanceof Error ? error.message : 'Could not export CV as PDF. Try again shortly.',
        );
      } finally {
        setBusyVersionId(null);
      }
    },
    [resolveVersionDetail],
  );

  const handleDeleteVersion = useCallback(
    async (item: ResumeRoleVersionItem) => {
      const confirmed = window.confirm(
        `Delete "${item.label}"? This tailored CV version will be removed permanently.`,
      );
      if (!confirmed) return;

      setActionError(null);
      setBusyVersionId(item.id);
      try {
        await deleteResumeRoleVersion(item.id);
        await onVersionsChanged?.();
      } catch (error) {
        setActionError(error instanceof Error ? error.message : 'Could not delete CV version');
      } finally {
        setBusyVersionId(null);
      }
    },
    [onVersionsChanged],
  );

  if (!versionsData) return null;

  const roleVersions = (versionsData.versions || []).filter(
    (item) => item.versionType !== 'original',
  );
  const hasOriginal =
    !hideOriginal && Boolean(versionsData.original?.fileUrl || versionsData.original?.fileName);
  const hasRoleVersions = roleVersions.length > 0;

  if (!hasOriginal && !hasRoleVersions) return null;

  const renderRoleVersion = (item: ResumeRoleVersionItem) => {
    const subtitle = item.company
      ? `${item.jobTitle || 'Role'} @ ${item.company}`
      : item.jobTitle || 'Tailored in resume studio';
    const editorHref = item.jobId
      ? localizePath(
          `/lms/resume-builder/editor?job=${encodeURIComponent(item.jobId)}&tailor=1`,
          locale as 'en' | 'fr',
        )
      : localizePath('/lms/resume-builder/editor', locale as 'en' | 'fr');
    const canPreview = Boolean(item.hasStoredVersion ?? true);
    const canDownloadPdf = canPreview;
    const busy = busyVersionId === item.id;

    return (
      <VersionCard
        key={item.id}
        label={item.label}
        subtitle={subtitle}
        dateLabel={formatVersionDate(item.updatedAt || item.createdAt)}
        badge={item.versionType === 'role-tailored' ? 'Role CV' : 'Studio'}
        badgeTone="violet"
        busy={busy}
        canView={canPreview}
        canDownloadPdf={canDownloadPdf}
        onView={() => void handleViewVersion(item)}
        onDownloadPdf={() => void handleDownloadVersionPdf(item)}
        onEditHref={editorHref}
        onDelete={() => void handleDeleteVersion(item)}
        downloadLabel="PDF"
      />
    );
  };

  const original = versionsData.original;
  const originalCanPreview = Boolean(original?.fileUrl);
  const originalIsPdf = original?.fileUrl ? getResumeExtension(original.fileUrl) === 'pdf' : false;

  return (
    <div className="mt-4 space-y-2.5 border-t border-gray-100 pt-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-sky-600" strokeWidth={2.2} />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">CV versions</p>
      </div>

      {actionError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800">
          {actionError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {hasOriginal && original ? (
          <VersionCard
            label={original.label || 'Original CV'}
            subtitle={original.fileName || 'Uploaded resume file'}
            dateLabel={formatVersionDate(original.uploadedAt || original.updatedAt)}
            badge="Original"
            badgeTone="sky"
            busy={busyVersionId === original.id}
            canView={originalCanPreview}
            canDownloadPdf={originalCanPreview && originalIsPdf}
            downloadLabel={originalIsPdf ? 'PDF' : 'File'}
            onView={() => {
              if (original.fileUrl) {
                openProfileDocumentInNewTab(original.fileUrl, original.fileName || original.label);
                return;
              }
              onOpenOriginal?.();
            }}
            onDownloadPdf={() => {
              if (!original.fileUrl) return;
              void downloadProfileDocument(
                original.fileUrl,
                original.fileName || buildPdfFilename(original.label || 'Original CV'),
              );
            }}
          />
        ) : null}

        {hasRoleVersions ? roleVersions.map(renderRoleVersion) : null}
      </div>
    </div>
  );
}
