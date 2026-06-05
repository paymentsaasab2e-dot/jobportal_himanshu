import type { InternshipData } from '@/components/modals/InternshipModal';
import { API_BASE_URL } from '@/lib/api-base';
import { getAuthHeaders, getStoredToken } from '@/lib/auth-storage';
import { extractStoredDocumentUrl } from '@/lib/profile-documents';

const INTERNSHIP_ENTRIES_PREFIX = '__INTERNSHIP_ENTRIES__:';

function authHeadersForFormData(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Collect already-saved document URLs from modal state (string URLs or legacy file/url shapes). */
export function collectPersistedInternshipDocumentUrls(
  documents: InternshipData['documents'],
): string[] {
  if (!documents?.length) return [];

  const urls: string[] = [];
  for (const doc of documents) {
    if (typeof doc === 'string') {
      const trimmed = doc.trim();
      if (trimmed && !trimmed.startsWith(INTERNSHIP_ENTRIES_PREFIX)) {
        urls.push(trimmed);
      }
      continue;
    }
    if (doc.file instanceof File) continue;
    const stored = extractStoredDocumentUrl(doc);
    if (stored && !stored.startsWith(INTERNSHIP_ENTRIES_PREFIX)) {
      urls.push(stored);
    }
  }
  return [...new Set(urls)];
}

async function uploadInternshipDocumentFiles(
  candidateId: string,
  files: File[],
): Promise<string[]> {
  if (!files.length) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('documents', file));

  const uploadResponse = await fetch(
    `${API_BASE_URL}/profile/internship/documents/${candidateId}`,
    {
      method: 'POST',
      headers: authHeadersForFormData(),
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message ||
        'Failed to upload internship documents',
    );
  }

  const uploadResult = await uploadResponse.json();
  return (
    uploadResult.data?.documents?.map((d: { url: string }) => d.url).filter(Boolean) ||
    []
  );
}

/** Upload new files and merge with existing stored URLs for one internship entry. */
export async function resolveInternshipDocumentUrls(
  candidateId: string,
  documents: InternshipData['documents'],
): Promise<string[]> {
  if (!documents?.length) return [];

  const filesToUpload = documents
    .map((doc) => {
      if (typeof doc === 'object' && doc?.file instanceof File) return doc.file;
      return null;
    })
    .filter((file): file is File => file instanceof File);

  const uploadedUrls = await uploadInternshipDocumentFiles(candidateId, filesToUpload);
  const existingUrls = collectPersistedInternshipDocumentUrls(documents);

  return [...new Set([...uploadedUrls, ...existingUrls])];
}

export async function persistInternshipEntry(
  candidateId: string,
  data: InternshipData,
  options: { entryId?: string | null } = {},
): Promise<void> {
  const documentUrls = await resolveInternshipDocumentUrls(candidateId, data.documents);

  const payload: InternshipData = {
    ...data,
    documents: documentUrls as unknown as InternshipData['documents'],
  };

  if (options.entryId) {
    payload.id = options.entryId;
  }

  const response = await fetch(`${API_BASE_URL}/profile/internship/${candidateId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message || 'Failed to save internship',
    );
  }
}
