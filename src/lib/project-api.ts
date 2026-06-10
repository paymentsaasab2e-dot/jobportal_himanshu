import type { ProjectData } from '@/components/modals/ProjectModal';
import { API_BASE_URL } from '@/lib/api-base';
import { getAuthHeaders, getStoredToken } from '@/lib/auth-storage';
import { extractStoredDocumentUrl } from '@/lib/profile-documents';

function authHeadersForFormData(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function collectPersistedProjectDocumentUrls(
  documents: ProjectData['documents'],
): string[] {
  if (!documents?.length) return [];

  const urls: string[] = [];
  for (const doc of documents) {
    if (typeof doc === 'string') {
      const trimmed = doc.trim();
      if (trimmed) urls.push(trimmed);
      continue;
    }
    if (doc?.file instanceof File) continue;
    const stored = extractStoredDocumentUrl(doc);
    if (stored) urls.push(stored);
  }
  return [...new Set(urls)];
}

function parseUploadedProjectUrls(payload: {
  files?: unknown;
  data?: { documents?: unknown };
}): string[] {
  if (Array.isArray(payload.files)) {
    return payload.files.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  }

  if (!Array.isArray(payload.data?.documents)) return [];

  return payload.data.documents
    .map((doc) => {
      if (typeof doc === 'string') return doc.trim();
      if (doc && typeof doc === 'object' && 'url' in doc) {
        return String((doc as { url?: string }).url || '').trim();
      }
      return '';
    })
    .filter(Boolean);
}

async function uploadProjectDocumentFiles(
  candidateId: string,
  files: File[],
): Promise<string[]> {
  if (!files.length) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('documents', file));

  const uploadResponse = await fetch(
    `${API_BASE_URL}/profile/project/documents/${candidateId}`,
    {
      method: 'POST',
      headers: authHeadersForFormData(),
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message || 'Failed to upload project documents',
    );
  }

  const uploadResult = await uploadResponse.json();
  return parseUploadedProjectUrls(uploadResult);
}

export async function resolveProjectDocumentUrls(
  candidateId: string,
  documents: ProjectData['documents'],
): Promise<string[]> {
  if (!documents?.length) return [];

  const filesToUpload = documents
    .map((doc) => {
      if (typeof doc === 'object' && doc?.file instanceof File) return doc.file;
      return null;
    })
    .filter((file): file is File => file instanceof File);

  const uploadedUrls = await uploadProjectDocumentFiles(candidateId, filesToUpload);
  const existingUrls = collectPersistedProjectDocumentUrls(documents);

  return [...new Set([...uploadedUrls, ...existingUrls])];
}

export async function persistProjectEntry(
  candidateId: string,
  data: ProjectData,
  options: { entryId?: string | null } = {},
): Promise<ProjectData[]> {
  const documentUrls = await resolveProjectDocumentUrls(candidateId, data.documents);

  const payload: ProjectData = {
    ...data,
    documents: documentUrls as unknown as ProjectData['documents'],
  };

  if (options.entryId) {
    payload.id = options.entryId;
  }

  const response = await fetch(`${API_BASE_URL}/profile/project/${candidateId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { message?: string }).message || 'Failed to save project');
  }

  const result = await response.json();
  return Array.isArray(result.data?.projects)
    ? (result.data.projects as ProjectData[])
    : [];
}
