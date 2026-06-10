import type { AcademicAchievementData } from '@/components/modals/AcademicAchievementModal';
import { API_BASE_URL } from '@/lib/api-base';
import { getAuthHeaders, getStoredToken } from '@/lib/auth-storage';
import { extractStoredDocumentUrl } from '@/lib/profile-documents';

function authHeadersForFormData(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function collectPersistedAcademicAchievementDocumentUrls(
  documents: AcademicAchievementData['documents'],
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

async function uploadAcademicAchievementDocumentFiles(
  candidateId: string,
  files: File[],
): Promise<string[]> {
  if (!files.length) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('documents', file));

  const uploadResponse = await fetch(
    `${API_BASE_URL}/profile/academic-achievement/documents/${candidateId}`,
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
        'Failed to upload academic achievement documents',
    );
  }

  const uploadResult = await uploadResponse.json();
  const uploaded =
    uploadResult.data?.documents?.map((doc: { url?: string }) => doc.url).filter(Boolean) || [];
  return uploaded;
}

export async function resolveAcademicAchievementDocumentUrls(
  candidateId: string,
  documents: AcademicAchievementData['documents'],
): Promise<string[]> {
  if (!documents?.length) return [];

  const filesToUpload = documents
    .map((doc) => {
      if (typeof doc === 'object' && doc?.file instanceof File) return doc.file;
      return null;
    })
    .filter((file): file is File => file instanceof File);

  const uploadedUrls = await uploadAcademicAchievementDocumentFiles(candidateId, filesToUpload);
  const existingUrls = collectPersistedAcademicAchievementDocumentUrls(documents);

  return [...new Set([...uploadedUrls, ...existingUrls])];
}

export async function persistAcademicAchievementEntry(
  candidateId: string,
  data: AcademicAchievementData,
  options: { entryId?: string | null } = {},
): Promise<AcademicAchievementData[]> {
  const documentUrls = await resolveAcademicAchievementDocumentUrls(candidateId, data.documents);

  const payload: AcademicAchievementData = {
    ...data,
    documents: documentUrls as unknown as AcademicAchievementData['documents'],
  };

  if (options.entryId) {
    payload.id = options.entryId;
  }

  const response = await fetch(`${API_BASE_URL}/profile/academic-achievement/${candidateId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message || 'Failed to save academic achievement',
    );
  }

  const result = await response.json();
  return Array.isArray(result.data?.academicAchievements)
    ? (result.data.academicAchievements as AcademicAchievementData[])
    : [];
}
