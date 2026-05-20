import { resolveDocumentUrl } from '@/lib/api-base';

/** Shared profile document item used across profile drawers. */
export interface ProfileDocumentItem {
  id: string;
  file?: File;
  name: string;
  url?: string;
  size?: number;
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

/** Cloud/S3 keys often look like: {candidateId}_{timestamp}_{originalFileName} */
export function stripStorageFilePrefix(fileName: string): string {
  if (!fileName?.trim()) return '';
  let name = fileName.trim();
  try {
    const pathOnly = name.split('?')[0] || name;
    name = decodeURIComponent(pathOnly.split('/').pop() || pathOnly);
  } catch {
    name = name.split('/').pop()?.split('?')[0] || name;
  }
  const stripped = name.replace(/^[a-f0-9]{24}_\d+_/i, '');
  return humanizeUnderscoreFileName(stripped || name);
}

function humanizeUnderscoreFileName(fileName: string): string {
  if (!fileName.includes('_')) return fileName;
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot <= 0) {
    return fileName.replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const base = fileName.slice(0, lastDot).replace(/_/g, ' ');
  const ext = fileName.slice(lastDot);
  return `${base.replace(/\s+/g, ' ').trim()}${ext}`;
}

type ProfileDocumentLike =
  | ProfileDocumentItem
  | string
  | { name?: string; url?: string; file?: string | File | unknown };

/** Resolve a stored document URL from API/modal shapes (string URL or legacy object). */
export function extractStoredDocumentUrl(doc: unknown): string {
  if (!doc) return '';
  if (typeof doc === 'string') {
    const s = doc.trim();
    if (!s || s === '[object Object]') return '';
    return s;
  }
  if (typeof doc !== 'object') return '';

  const record = doc as Record<string, unknown>;
  if (typeof record.url === 'string' && record.url.trim()) {
    return record.url.trim();
  }
  if (typeof record.file === 'string') {
    const file = record.file.trim();
    if (
      file.startsWith('http://') ||
      file.startsWith('https://') ||
      file.startsWith('//')
    ) {
      return file;
    }
  }
  return '';
}

/** Collapse visa/profile document arrays to URL strings for API save. */
export function profileDocumentsToUrlList(docs: unknown): string[] {
  if (!Array.isArray(docs)) return [];
  return docs.map(extractStoredDocumentUrl).filter((url) => url.length > 0);
}

/** Normalize visa/profile documents for UI lists and previews. */
export function normalizeVisaDocumentsForUi(docs: unknown): ProfileDocumentItem[] {
  const stored = normalizeProfileDocuments(profileDocumentsToUrlList(docs));
  if (!Array.isArray(docs)) return stored;

  const pending: ProfileDocumentItem[] = [];
  for (let index = 0; index < docs.length; index += 1) {
    const doc = docs[index];
    if (!doc || typeof doc !== 'object') continue;
    const record = doc as ProfileDocumentItem;
    if (!(record.file instanceof File)) continue;
    pending.push({
      id: record.id || `pending-${index}-${record.file.name}`,
      name: record.name || record.file.name,
      file: record.file,
      size: record.size ?? record.file.size,
    });
  }

  return [...stored, ...pending];
}

export function getProfileDocumentDisplayName(doc: ProfileDocumentLike): string {
  if (typeof doc === 'string') {
    const cleaned = stripStorageFilePrefix(doc);
    return cleaned || 'Document';
  }
  const storedUrl = extractStoredDocumentUrl(doc);
  if (storedUrl) {
    return getProfileDocumentDisplayName(storedUrl);
  }
  if (doc.name?.trim() && doc.name.trim() !== '[object Object]') {
    const cleaned = stripStorageFilePrefix(doc.name);
    return cleaned || 'Document';
  }
  if (doc.url) return getProfileDocumentDisplayName(doc.url);
  return 'Document';
}

export function normalizeProfileDocuments(
  input?: Array<string | ProfileDocumentItem> | null,
): ProfileDocumentItem[] {
  if (!input?.length) return [];
  return input.map((doc, index) => {
    if (typeof doc === 'string') {
      return {
        id: `doc-${index}-${doc.slice(-12)}`,
        name: getProfileDocumentDisplayName(doc),
        url: doc,
      };
    }
    return {
      id: doc.id || `doc-${index}-${Date.now()}`,
      name: doc.name || (doc.url ? getProfileDocumentDisplayName(doc.url) : 'Document'),
      url: doc.url,
      file: doc.file,
      size: doc.size,
    };
  });
}

export function validateProfileDocumentFile(
  file: File,
  maxSizeMb = 5,
): { ok: true } | { ok: false; message: string } {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, message: `${file.name}: Please upload a PDF, PNG, or JPG file.` };
  }
  if (file.size > maxSizeMb * 1024 * 1024) {
    return { ok: false, message: `${file.name}: File must be under ${maxSizeMb}MB.` };
  }
  return { ok: true };
}

export function filesFromProfileDocuments(docs: ProfileDocumentItem[]): File[] {
  return docs.map((d) => d.file).filter((f): f is File => f instanceof File);
}

export function existingUrlsFromProfileDocuments(docs: ProfileDocumentItem[]): string[] {
  return docs.filter((d) => isStoredProfileDocument(d)).map((d) => d.url!).filter(Boolean);
}

/** True when the document is already saved (has a server URL, not a pending local File). */
export function isStoredProfileDocument(
  doc: ProfileDocumentLike | { url?: string; file?: File | unknown } | null | undefined,
): boolean {
  if (!doc) return false;
  if (typeof doc === 'object' && doc !== null && 'file' in doc && doc.file instanceof File) {
    return false;
  }
  return extractStoredDocumentUrl(doc).length > 0;
}

/** Normalize visa work authorization payload from API for UI (fixes legacy [object Object] docs). */
export function normalizeVisaWorkAuthorizationFromApi<T extends {
  visaDetailsInitial?: { documents?: unknown };
  visaDetailsExpected?: { documents?: unknown };
  visaEntries?: Array<{ visaDetails?: { documents?: unknown } }>;
}>(data: T | null | undefined): T | undefined {
  if (!data) return undefined;

  const mapSection = <S extends { documents?: unknown }>(section?: S) =>
    section
      ? {
          ...section,
          documents: normalizeVisaDocumentsForUi(section.documents),
        }
      : section;

  return {
    ...data,
    visaDetailsInitial: mapSection(data.visaDetailsInitial),
    visaDetailsExpected: mapSection(data.visaDetailsExpected),
    visaEntries: Array.isArray(data.visaEntries)
      ? data.visaEntries.map((entry) => ({
          ...entry,
          visaDetails: entry.visaDetails ? mapSection(entry.visaDetails) : entry.visaDetails,
        }))
      : data.visaEntries,
  };
}

export function formatProfileDocumentSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Open a resolved profile document URL in a new browser tab. */
export function openProfileDocumentInNewTab(url: string): void {
  const href = url?.trim();
  if (!href) return;
  const opened = window.open(href, '_blank', 'noopener,noreferrer');
  if (!opened) {
    const link = document.createElement('a');
    link.href = href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/** Open a stored or pending profile document item in a new tab. */
export function openProfileDocumentItemInNewTab(
  doc: { url?: string; file?: File } | null | undefined,
): void {
  if (!doc) return;
  let href = '';
  if (doc.url) {
    href = resolveDocumentUrl(doc.url);
  } else if (doc.file instanceof File) {
    href = URL.createObjectURL(doc.file);
  }
  openProfileDocumentInNewTab(href);
}
