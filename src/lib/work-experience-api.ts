import type { WorkExperienceEntry } from '@/components/modals/WorkExperienceModal';
import { API_BASE_URL } from '@/lib/api-base';
import { getAuthHeaders, getStoredToken } from '@/lib/auth-storage';
import { getProfileDocumentDisplayName } from '@/lib/profile-documents';

function authHeadersForJson(): Record<string, string> {
  return getAuthHeaders();
}

function authHeadersForFormData(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
import { isPersistedWorkExperienceId } from '@/lib/work-experience-utils';

async function uploadWorkExperienceDocuments(
  candidateId: string,
  entry: WorkExperienceEntry,
): Promise<string[]> {
  let documentUrls: string[] = [];

  if (!entry.documents?.length) {
    return documentUrls;
  }

  const filesToUpload = entry.documents.filter((doc) => doc.file instanceof File);
  if (filesToUpload.length > 0) {
    const formData = new FormData();
    filesToUpload.forEach((doc) => {
      if (doc.file instanceof File) {
        formData.append('documents', doc.file);
      }
    });

    const uploadResponse = await fetch(
      `${API_BASE_URL}/profile/work-experience/documents/${candidateId}`,
      {
        method: 'POST',
        headers: authHeadersForFormData(),
        body: formData,
      },
    );

    if (uploadResponse.ok) {
      const uploadResult = await uploadResponse.json();
      documentUrls = uploadResult.data?.documents?.map((d: { url: string }) => d.url) || [];
    }
  }

  const existingUrls = entry.documents
    .filter(
      (doc) =>
        typeof doc === 'string' ||
        (typeof doc === 'object' && doc.url && !(doc.file instanceof File)),
    )
    .map((doc) => (typeof doc === 'string' ? doc : doc.url!));

  return [...documentUrls, ...existingUrls];
}

/** Create or update one work experience row in the database. */
export async function persistWorkExperienceEntry(
  candidateId: string,
  entry: WorkExperienceEntry,
): Promise<WorkExperienceEntry> {
  const documentUrls = await uploadWorkExperienceDocuments(candidateId, entry);
  const expToSave = {
    ...entry,
    documents: documentUrls,
  };

  if (isPersistedWorkExperienceId(entry.id)) {
    const response = await fetch(`${API_BASE_URL}/profile/work-experience/${entry.id}`, {
      method: 'PUT',
      headers: authHeadersForJson(),
      body: JSON.stringify(expToSave),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update work experience');
    }

    return {
      ...entry,
      documents: documentUrls.map((url) => ({
        id: url,
        url,
        name: getProfileDocumentDisplayName(url),
      })),
    };
  }

  const response = await fetch(`${API_BASE_URL}/profile/work-experience/${candidateId}`, {
    method: 'POST',
    headers: authHeadersForJson(),
    body: JSON.stringify(expToSave),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to save work experience');
  }

  const result = await response.json();
  const savedId = result.data?.id as string | undefined;

  return {
    ...entry,
    id: savedId || entry.id,
    documents: documentUrls.map((url) => ({
      id: url,
      url,
      name: getProfileDocumentDisplayName(url),
    })),
  };
}

export function resolveWorkExperiencesToPersist(
  data: { workExperiences: WorkExperienceEntry[] },
  editingEntryId: string | null,
): WorkExperienceEntry[] {
  const entries = data.workExperiences ?? [];
  if (editingEntryId) {
    const edited = entries.find((exp) => exp.id === editingEntryId);
    return edited ? [edited] : entries;
  }

  return entries.filter((exp) => !isPersistedWorkExperienceId(exp.id));
}
