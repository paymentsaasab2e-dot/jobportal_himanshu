/** Shared profile document item used across profile drawers. */
export interface ProfileDocumentItem {
  id: string;
  file?: File;
  name: string;
  url?: string;
  size?: number;
}

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

export function getProfileDocumentDisplayName(doc: ProfileDocumentItem | string): string {
  if (typeof doc === 'string') {
    const fromPath = decodeURIComponent(doc.split('/').pop()?.split('?')[0] || '');
    if (!fromPath || fromPath.startsWith('http')) return 'Document';
    return fromPath.replace(/^[a-f0-9]{24}_\d+_/i, '') || fromPath;
  }
  if (doc.name?.trim()) return doc.name;
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
  return docs.filter((d) => d.url && !d.file).map((d) => d.url!).filter(Boolean);
}

export function formatProfileDocumentSize(bytes?: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
