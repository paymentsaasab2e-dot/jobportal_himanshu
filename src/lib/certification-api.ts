import type { Certification, CertificationDocument } from '@/components/modals/CertificationModal';
import { API_BASE_URL } from '@/lib/api-base';
import { getAuthHeaders, getStoredToken } from '@/lib/auth-storage';
import { extractStoredDocumentUrl } from '@/lib/profile-documents';

function authHeadersForFormData(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function serializeCertificateFile(value?: File | string): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value.trim() || undefined;
  return value.name || undefined;
}

export function collectPersistedCertificationDocumentUrls(
  documents?: CertificationDocument[] | string[],
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

function parseUploadedCertificationUrls(payload: {
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

async function uploadCertificationDocumentFiles(
  candidateId: string,
  files: File[],
): Promise<string[]> {
  if (!files.length) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('documents', file));

  const uploadResponse = await fetch(
    `${API_BASE_URL}/profile/certification/documents/${candidateId}`,
    {
      method: 'POST',
      headers: authHeadersForFormData(),
      body: formData,
    },
  );

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json().catch(() => ({}));
    throw new Error(
      (errorData as { message?: string }).message || 'Failed to upload certification documents',
    );
  }

  const uploadResult = await uploadResponse.json();
  return parseUploadedCertificationUrls(uploadResult);
}

export async function resolveCertificationDocumentUrls(
  candidateId: string,
  documents?: CertificationDocument[] | string[],
): Promise<string[]> {
  if (!documents?.length) return [];

  const filesToUpload = documents
    .map((doc) => {
      if (typeof doc === 'object' && doc?.file instanceof File) return doc.file;
      return null;
    })
    .filter((file): file is File => file instanceof File);

  const uploadedUrls = await uploadCertificationDocumentFiles(candidateId, filesToUpload);
  const existingUrls = collectPersistedCertificationDocumentUrls(documents);

  return [...new Set([...uploadedUrls, ...existingUrls])];
}

export function mergeCertificationLists(
  existing: Certification[],
  incoming: Certification,
  options: { entryId?: string | null } = {},
): Certification[] {
  const entryId = options.entryId || incoming.id || null;

  if (entryId) {
    const hasExisting = existing.some((row) => row.id === entryId);
    const nextEntry = { ...incoming, id: entryId };
    if (hasExisting) {
      return existing.map((row) => (row.id === entryId ? nextEntry : row));
    }
    return [...existing, nextEntry];
  }

  if (!existing.some((row) => row.id === incoming.id)) {
    return [...existing, incoming];
  }

  return existing.map((row) => (row.id === incoming.id ? incoming : row));
}

export function normalizeCertificationsFromApi(raw: unknown): Certification[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as Certification[];
  if (typeof raw === 'object' && raw !== null && 'certifications' in raw) {
    const certs = (raw as { certifications?: unknown }).certifications;
    return Array.isArray(certs) ? (certs as Certification[]) : [];
  }
  return [];
}

export async function persistCertificationEntry(
  candidateId: string,
  entry: Certification,
  options: { existingCerts?: Certification[]; entryId?: string | null } = {},
): Promise<Certification[]> {
  const existing = options.existingCerts ?? [];
  const merged = mergeCertificationLists(existing, entry, { entryId: options.entryId });

  const processed = await Promise.all(
    merged.map(async (cert) => ({
      ...cert,
      certificateFile: serializeCertificateFile(cert.certificateFile),
      documents: await resolveCertificationDocumentUrls(candidateId, cert.documents),
    })),
  );

  const response = await fetch(`${API_BASE_URL}/profile/certifications/${candidateId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ certifications: processed }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error((errorData as { message?: string }).message || 'Failed to save certifications');
  }

  const result = await response.json();
  const saved = normalizeCertificationsFromApi(result.data?.certifications);
  return saved.length ? saved : processed;
}
