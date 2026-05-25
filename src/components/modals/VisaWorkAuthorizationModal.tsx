'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';
import ProfileDatePicker from '@/components/profile/ProfileDatePicker';
import { ALL_COUNTRY_CODES } from '@/lib/country-codes';
import {
  extractStoredDocumentUrl,
  getProfileDocumentDisplayName,
  isStoredProfileDocument,
  normalizeVisaWorkAuthorizationFromApi,
} from '@/lib/profile-documents';

interface VisaWorkAuthorizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: VisaWorkAuthorizationData) => void;
  initialData?: VisaWorkAuthorizationData;
  mode?: 'add' | 'edit';
  editingEntryId?: string | null;
}

export interface VisaDocument {
  id: string;
  file: File | string;
  name: string;
  url?: string;
  size?: number;
}

export interface VisaDetailsSection {
  id: string;
  visaType: string;
  visaStatus: string;
  itemFamilyNumber?: string;
  visaExpiryDate?: string;
  documents: VisaDocument[];
}

export interface VisaEntry {
  id: string;
  country: string;
  countryName: string;
  visaDetails: VisaDetailsSection;
  additionalRemarks?: string;
}

export interface VisaWorkAuthorizationData {
  selectedDestination: string;
  visaDetailsInitial?: VisaDetailsSection;
  visaDetailsExpected?: VisaDetailsSection;
  visaWorkpermitRequired: string;
  openForAll: boolean;
  additionalRemarks?: string;
  visaEntries?: VisaEntry[];
}

function getCountryMeta(codeOrName: string) {
  const t = codeOrName.trim();
  if (!t) return undefined;
  const byCode = ALL_COUNTRY_CODES.find((c) => c.code === t);
  if (byCode) return byCode;
  return ALL_COUNTRY_CODES.find((c) => c.name.toLowerCase() === t.toLowerCase());
}

/** Prefer ISO2 code for storage; accept legacy full country name. */
function normalizeCountryCode(codeOrName: string): string {
  return getCountryMeta(codeOrName)?.code ?? codeOrName.trim();
}

function countryDisplayName(codeOrName: string): string {
  return getCountryMeta(codeOrName)?.name ?? codeOrName.trim();
}

const VISA_TYPES = [
  'Citizen / Permanent Resident',
  'Work Visa',
  'Student Visa',
  'Tourist Visa',
  'Business Visa',
  'Dependent Visa',
  'Other'
];

const VISA_STATUSES = [
  'Active',
  'Expired',
  'Pending',
  'Renewal Required'
];

const VISA_WORKPERMIT_OPTIONS = [
  'Yes, I require sponsorship',
  'No, I don\'t require sponsorship',
  'Open to either'
];

const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = date.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${months[date.getMonth()]} ${day}${suffix}, ${date.getFullYear()}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB';
  return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
};

export default function VisaWorkAuthorizationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'edit',
  editingEntryId = null,
}: VisaWorkAuthorizationModalProps) {
  const [selectedDestination, setSelectedDestination] = useState(() =>
    normalizeCountryCode(initialData?.selectedDestination || ''),
  );
  const [requiresVisa, setRequiresVisa] = useState<'Yes' | 'No' | ''>('');
  const [visaDetailsExpected, setVisaDetailsExpected] = useState<VisaDetailsSection | undefined>(
    initialData?.visaDetailsExpected || { id: 'expected', visaType: '', visaStatus: 'Active', documents: [] }
  );
  const [visaWorkpermitRequired, setVisaWorkpermitRequired] = useState(initialData?.visaWorkpermitRequired || '');
  const [openForAll, setOpenForAll] = useState(initialData?.openForAll || false);
  const [additionalRemarks, setAdditionalRemarks] = useState(initialData?.additionalRemarks || '');
  const [visaEntries, setVisaEntries] = useState<VisaEntry[]>(initialData?.visaEntries || []);
  const [expandedEntries, setExpandedEntries] = useState<{ [key: string]: boolean }>({});
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    expected: true
  });

  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const dragCounter = useRef<{ [key: string]: number }>({ expected: 0 });
  /** Avoid re-init while the drawer is open (parent re-renders used to wipe uploads). */
  const sessionInitKeyRef = useRef<string | null>(null);
  const countryComboboxRef = useRef<HTMLDivElement>(null);
  const countrySearchInputRef = useRef<HTMLInputElement>(null);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const filteredCountries = useMemo(() => {
    const raw = countrySearchQuery.trim();
    const q = raw.toLowerCase().replace(/\s+/g, ' ');
    if (!q) return ALL_COUNTRY_CODES;
    const qDial = raw.replace(/\s/g, '').toLowerCase();
    return ALL_COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.replace(/\s/g, '').toLowerCase().includes(qDial)
    );
  }, [countrySearchQuery]);

  useEffect(() => {
    if (!isOpen) {
      setCountrySearchQuery('');
      setIsCountryDropdownOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isCountryDropdownOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (countryComboboxRef.current && !countryComboboxRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [isCountryDropdownOpen]);

  useEffect(() => {
    if (isCountryDropdownOpen) {
      requestAnimationFrame(() => countrySearchInputRef.current?.focus());
    }
  }, [isCountryDropdownOpen]);

  useEffect(() => {
    if (!isOpen) {
      sessionInitKeyRef.current = null;
      return;
    }

    const initKey =
      mode === 'add' && !editingEntryId
        ? 'add-new'
        : editingEntryId
          ? `edit-entry:${editingEntryId}`
          : `edit-main:${normalizeCountryCode(initialData?.selectedDestination || '')}`;

    if (sessionInitKeyRef.current === initKey) {
      return;
    }
    sessionInitKeyRef.current = initKey;

    if (initialData) {
      const data = normalizeVisaWorkAuthorizationFromApi(initialData) ?? initialData;
      if (mode === 'add' && data.selectedDestination) {
        // Move current form into visaEntries
        const destCode = normalizeCountryCode(data.selectedDestination);
        const countryName = countryDisplayName(data.selectedDestination);
        const newEntry: VisaEntry = {
          id: Date.now().toString(),
          country: destCode,
          countryName,
          visaDetails: data.visaDetailsExpected || { id: 'expected', visaType: '', visaStatus: 'Active', documents: [] },
          additionalRemarks: data.additionalRemarks,
        };
        setVisaEntries([...(data.visaEntries || []), newEntry]);
        
        // Clear current form
        setSelectedDestination('');
        setRequiresVisa('');
        setVisaDetailsExpected({ id: 'expected', visaType: '', visaStatus: 'Active', documents: [] });
        setVisaWorkpermitRequired(data.visaWorkpermitRequired || '');
        setOpenForAll(data.openForAll || false);
        setAdditionalRemarks(data.additionalRemarks || '');
      } else if (mode === 'edit' && editingEntryId) {
        const entryToEdit = data.visaEntries?.find(e => e.id === editingEntryId);
        if (entryToEdit) {
          setSelectedDestination(normalizeCountryCode(entryToEdit.country || ''));
          setVisaDetailsExpected(entryToEdit.visaDetails || { id: 'expected', visaType: '', visaStatus: 'Active', documents: [] });
          setVisaWorkpermitRequired('');
          setOpenForAll(false);
          setAdditionalRemarks(entryToEdit.additionalRemarks || '');
          // Keep all other entries intact
          setVisaEntries(data.visaEntries || []);
          if (entryToEdit.visaDetails?.visaType) {
            setRequiresVisa('Yes');
          }
        }
      } else {
        setSelectedDestination(normalizeCountryCode(data.selectedDestination || ''));
        setVisaDetailsExpected(data.visaDetailsExpected || { id: 'expected', visaType: '', visaStatus: 'Active', documents: [] });
        setVisaWorkpermitRequired(data.visaWorkpermitRequired || '');
        setOpenForAll(data.openForAll || false);
        setAdditionalRemarks(data.additionalRemarks || '');
        setVisaEntries(data.visaEntries || []);
        if (data.visaDetailsExpected?.visaType) {
          setRequiresVisa('Yes');
        } else if (data.visaWorkpermitRequired) {
          setRequiresVisa('No');
        }
      }
    } else {
      resetForm();
    }
  }, [isOpen, mode, editingEntryId, initialData?.selectedDestination]);

  function resetForm() {
    setSelectedDestination('');
    setRequiresVisa('');
    setVisaDetailsExpected({ id: 'expected', visaType: '', visaStatus: 'Active', documents: [] });
    setVisaWorkpermitRequired('');
    setOpenForAll(false);
    setAdditionalRemarks('');
    setVisaEntries([]);
    setExpandedEntries({});
    setExpandedSections({ expected: true });
    setCountrySearchQuery('');
    setIsCountryDropdownOpen(false);
  }

  const handleAddVisaEntry = () => {
    if (!selectedDestination) {
      alert('Please select a country.');
      return;
    }
    if (!visaDetailsExpected?.visaType) {
      alert('Please select Visa Type.');
      return;
    }

    const code = normalizeCountryCode(selectedDestination);
    const countryName = countryDisplayName(selectedDestination);
    const newEntry: VisaEntry = {
      id: Date.now().toString(),
      country: code,
      countryName,
      visaDetails: { ...visaDetailsExpected }
    };

    setVisaEntries([...visaEntries, newEntry]);

    // Reset form for next entry
    setSelectedDestination('');
    setRequiresVisa('');
    setVisaDetailsExpected({ id: 'expected', visaType: '', visaStatus: 'Active', documents: [] });
    if (fileInputRefs.current['expected']) {
      fileInputRefs.current['expected']!.value = '';
    }
  };

  const handleRemoveVisaEntry = (id: string) => {
    setVisaEntries(visaEntries.filter(entry => entry.id !== id));
  };

  const toggleExpandEntry = (id: string) => {
    setExpandedEntries({
      ...expandedEntries,
      [id]: !expandedEntries[id]
    });
  };

  const formatDateRange = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections({
      ...expandedSections,
      [sectionId]: !expandedSections[sectionId]
    });
  };

  const handleVisaDetailChange = (section: 'expected', field: keyof VisaDetailsSection, value: string) => {
    setVisaDetailsExpected((prev) => ({
      ...(prev || { id: 'expected', visaType: '', visaStatus: 'Active', documents: [] }),
      [field]: value,
    }));
  };

  const handleFileSelect = (section: 'expected', files: FileList | null) => {
    if (!files) return;

    const newDocuments: VisaDocument[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // Check file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name}: File size must be less than 5MB`);
        continue;
      }
      // Check file type
      const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert(`${file.name}: Please upload a PDF, PNG, or JPG file`);
        continue;
      }
      newDocuments.push({
        id: Date.now().toString() + i,
        file,
        name: file.name,
        size: file.size
      });
    }

    setVisaDetailsExpected((prev) => {
      const base = prev || { id: 'expected', visaType: '', visaStatus: 'Active', documents: [] };
      return {
        ...base,
        documents: [...(base.documents || []), ...newDocuments],
      };
    });
  };

  const handleFileInputChange = (section: 'expected', e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(section, e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRefs.current[section]) {
      fileInputRefs.current[section]!.value = '';
    }
  };

  const handleRemoveFile = (sectionId: string, documentId: string) => {
    if (sectionId === 'expected') {
      setVisaDetailsExpected(prev => prev ? {
        ...prev,
        documents: prev.documents.filter((doc: any) => {
          const id = typeof doc === 'string' ? doc : doc.id;
          return id !== documentId;
        })
      } : prev);
    }
  };

  const handleDragEnter = (section: 'expected', e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current[section] = (dragCounter.current[section] || 0) + 1;
  };

  const handleDragLeave = (section: 'expected', e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current[section] = (dragCounter.current[section] || 0) - 1;
    if (dragCounter.current[section] === 0) {
      // Reset drag state
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (section: 'expected', e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current[section] = 0;
    handleFileSelect(section, e.dataTransfer.files);
  };

  const handleSave = () => {
    if (editingEntryId) {
      // Update specific entry in visaEntries
      const code = normalizeCountryCode(selectedDestination);
      const countryName = countryDisplayName(selectedDestination);
      const updatedEntries = visaEntries.map(entry => {
        if (entry.id === editingEntryId) {
          return {
            ...entry,
            country: code,
            countryName,
            visaDetails: visaDetailsExpected!,
            additionalRemarks: additionalRemarks,
          };
        }
        return entry;
      });
      
      onSave({
        selectedDestination: initialData?.selectedDestination || '',
        visaDetailsInitial: initialData?.visaDetailsInitial,
        visaDetailsExpected: initialData?.visaDetailsExpected,
        visaWorkpermitRequired: initialData?.visaWorkpermitRequired || '',
        openForAll: initialData?.openForAll ?? false,
        additionalRemarks,
        visaEntries: updatedEntries,
      });
    } else {
      onSave({
        selectedDestination: normalizeCountryCode(selectedDestination),
        visaDetailsInitial: undefined,
        visaDetailsExpected,
        visaWorkpermitRequired,
        openForAll,
        additionalRemarks,
        visaEntries,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  const selectedCountryMeta = getCountryMeta(selectedDestination);

  const renderStoredDocumentActions = (doc: unknown, docName: string) => {
    const docUrl = extractStoredDocumentUrl(doc);
    if (!docUrl) return null;
    const href = resolveDocumentUrl(docUrl);
    return (
      <>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg p-1.5 text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
          title="View document"
          aria-label={`View ${docName}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </a>
        <a
          href={href}
          download={docName}
          className="rounded-lg p-1.5 text-orange-600 transition-colors hover:bg-orange-50 hover:text-orange-700"
          title="Download document"
          aria-label={`Download ${docName}`}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      </>
    );
  };

  const renderVisaDetailsSection = (section: VisaDetailsSection | undefined, sectionId: 'expected', title: string) => {
    const isExpanded = expandedSections[sectionId] !== false;
    const sectionData = section || { id: sectionId, visaType: '', visaStatus: 'Active', documents: [] };

    return (
      <div className="border border-gray-200 rounded-lg">
        {/* Section Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
          <button
            onClick={() => toggleSection(sectionId)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-900"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            {title}
          </button>
        </div>

        {/* Section Content */}
        {isExpanded && (
          <div className="p-4 space-y-4">
            {/* Visa Type and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visa Type</label>
                <select
                  value={sectionData.visaType}
                  onChange={(e) => handleVisaDetailChange(sectionId, 'visaType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Visa Type</option>
                  {VISA_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visa Status
                </label>
                <select
                  value={sectionData.visaStatus}
                  onChange={(e) => handleVisaDetailChange(sectionId, 'visaStatus', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {VISA_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visa Expiry Date (only for Expected section) */}
            {sectionId === 'expected' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visa Expiry Date
                </label>
                <ProfileDatePicker
                  value={sectionData.visaExpiryDate || ''}
                  onChange={(value) => handleVisaDetailChange(sectionId, 'visaExpiryDate', value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Visa must always be valid for your assignment
                </p>
              </div>
            )}

            {/* Work Permit Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Work Permit Number</label>
              <input
                type="text"
                value={sectionData.itemFamilyNumber || ''}
                onChange={(e) => handleVisaDetailChange(sectionId, 'itemFamilyNumber', e.target.value)}
                placeholder="Enter work permit number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Visa/Work Permit Document
              </label>

              {/* Drag and Drop Area */}
              <div
                onDragEnter={(e) => handleDragEnter(sectionId, e)}
                onDragLeave={(e) => handleDragLeave(sectionId, e)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(sectionId, e)}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-gray-50"
              >
                <input
                  ref={(el) => { fileInputRefs.current[sectionId] = el; }}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileInputChange(sectionId, e)}
                  multiple
                  className="hidden"
                />
                <svg
                  className="mx-auto h-12 w-12 text-[#9095A1] mb-2"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="text-sm text-gray-600 mb-1">
                  Drag and drop files here or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[sectionId]?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Browse files
                  </button>
                </p>
              </div>

              {/* Uploaded Files List */}
              {sectionData.documents && sectionData.documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Existing Work Permit/Visa ({sectionData.documents.length} {sectionData.documents.length === 1 ? 'file' : 'files'})
                  </p>
                  {sectionData.documents.map((doc: any, index: number) => {
                    const docId = typeof doc === 'string' ? doc : doc.id || index.toString();
                    const docName = getProfileDocumentDisplayName(doc);
                    return (
                      <div key={docId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-[#9095A1]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 truncate" title={docName}>{docName}</p>
                            {typeof doc !== 'string' && doc.size && (
                              <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 ml-2">
                          {renderStoredDocumentActions(doc, docName)}
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(sectionId, docId)}
                            className="p-1 text-amber-600 hover:text-amber-700 hover:bg-red-50 rounded transition-colors"
                            aria-label="Remove file"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Visa & Work Authorization"
      subtitle="Tell us where you are going to work. Supporting documents are optional."
      widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
      footer={(
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600"
          >
            Save Visa & Work Authorization
          </button>
        </div>
      )}
    >
      <div className="space-y-6">
        {/* Select Countries — full list with search */}
        <div ref={countryComboboxRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2" id="visa-country-label">
            Select Countries
          </label>
          <div className="relative">
            <button
              type="button"
              aria-expanded={isCountryDropdownOpen}
              aria-haspopup="listbox"
              aria-labelledby="visa-country-label"
              aria-label={
                selectedCountryMeta
                  ? `Selected country: ${selectedCountryMeta.name}`
                  : selectedDestination
                    ? `Selected: ${countryDisplayName(selectedDestination)}`
                    : 'Choose country'
              }
              onClick={() => setIsCountryDropdownOpen((prev) => !prev)}
              className="flex h-11 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 text-left text-gray-900 shadow-sm transition hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="flex min-w-0 flex-1 items-center">
                {selectedCountryMeta ? (
                  <span className="truncate text-sm font-medium">{selectedCountryMeta.name}</span>
                ) : selectedDestination ? (
                  <span className="truncate text-sm text-gray-800">
                    {countryDisplayName(selectedDestination)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">Search or choose a country…</span>
                )}
              </span>
              <span className="shrink-0 text-xs text-gray-400" aria-hidden>
                {isCountryDropdownOpen ? '▲' : '▼'}
              </span>
            </button>

            {isCountryDropdownOpen && (
              <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[60] flex max-h-[min(360px,55vh)] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                <div className="shrink-0 border-b border-gray-100 bg-white p-2">
                  <input
                    ref={countrySearchInputRef}
                    type="search"
                    autoComplete="off"
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    placeholder="Search by country name, ISO code, or dial code…"
                    className="h-10 w-full rounded-md border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1.5 px-0.5 text-[11px] text-gray-500">
                    {filteredCountries.length === ALL_COUNTRY_CODES.length
                      ? `Showing all ${ALL_COUNTRY_CODES.length} countries`
                      : `${filteredCountries.length} match${filteredCountries.length === 1 ? '' : 'es'}`}
                  </p>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto py-1" role="listbox" aria-label="Countries">
                  {filteredCountries.length === 0 ? (
                    <div className="px-3 py-6 text-center text-sm text-gray-500">
                      No country found. Try another search.
                    </div>
                  ) : (
                    filteredCountries.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        role="option"
                        aria-selected={selectedDestination === country.code}
                        onClick={() => {
                          setSelectedDestination(country.code);
                          setRequiresVisa('');
                          setIsCountryDropdownOpen(false);
                          setCountrySearchQuery('');
                        }}
                        className={`w-full truncate px-3 py-2 text-left text-sm font-medium hover:bg-gray-50 ${
                          selectedDestination === country.code ? 'bg-blue-50 text-blue-900' : 'text-gray-800'
                        }`}
                      >
                        {country.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Full world list — use search to filter quickly. Pick where you are legally authorized to work.
          </p>
        </div>

        {/* Yes/No Options - Show when country is selected */}
        {selectedDestination && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Do you require a visa for this country?
            </label>
            <div className="flex gap-6 rounded-lg p-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="requiresVisa"
                  value="Yes"
                  checked={requiresVisa === 'Yes'}
                  onChange={(e) => setRequiresVisa(e.target.value as 'Yes')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="requiresVisa"
                  value="No"
                  checked={requiresVisa === 'No'}
                  onChange={(e) => setRequiresVisa(e.target.value as 'No')}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">No</span>
              </label>
            </div>
          </div>
        )}

        {/* Visa Details Form - Show when Yes is selected */}
        {requiresVisa === 'Yes' && (
          <div className="space-y-4">
            {/* Row 1: Visa Type and Visa Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visa Type</label>
                <select
                  value={visaDetailsExpected?.visaType || ''}
                  onChange={(e) => handleVisaDetailChange('expected', 'visaType', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Visa Type</option>
                  {VISA_TYPES.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visa Status</label>
                <select
                  value={visaDetailsExpected?.visaStatus || 'Active'}
                  onChange={(e) => handleVisaDetailChange('expected', 'visaStatus', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {VISA_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Visa Expiry Date and Work Permit Number */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visa Expiry Date
                </label>
                <ProfileDatePicker
                  value={visaDetailsExpected?.visaExpiryDate || ''}
                  onChange={(value) => handleVisaDetailChange('expected', 'visaExpiryDate', value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  This helps employers understand your visa timeline.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Permit Number</label>
                <input
                  type="text"
                  value={visaDetailsExpected?.itemFamilyNumber || ''}
                  onChange={(e) => handleVisaDetailChange('expected', 'itemFamilyNumber', e.target.value)}
                  placeholder="Enter work permit number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Row 3: Upload Visa / Work Permit Document */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Visa / Work Permit Document{' '}
                
              </label>
              <input
                ref={(el) => { fileInputRefs.current['expected'] = el; }}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                multiple
                onChange={(e) => handleFileInputChange('expected', e)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRefs.current['expected']?.click()}
                className="w-full px-4 py-3 border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg flex items-center justify-center gap-2 hover:border-blue-400 hover:bg-blue-50 text-gray-600"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {visaDetailsExpected?.documents?.length
                  ? 'Add more documents'
                  : 'Choose files'}
              </button>
              {visaDetailsExpected?.documents && visaDetailsExpected.documents.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {visaDetailsExpected.documents.map((doc: any, index: number) => {
                    const docId = typeof doc === 'string' ? doc : doc.id || index.toString();
                    const docName = getProfileDocumentDisplayName(doc);
                    return (
                      <div key={docId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <svg
                            className="w-5 h-5 text-[#9095A1]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-900 truncate" title={docName}>{docName}</p>
                            {typeof doc !== 'string' && doc.size && (
                              <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {renderStoredDocumentActions(doc, docName)}
                          <button
                            type="button"
                            onClick={() => handleRemoveFile('expected', typeof doc === 'string' ? doc : doc.id)}
                            className="rounded-lg p-1 text-[#9095A1] transition-colors hover:bg-red-50 hover:text-amber-700"
                            title="Remove"
                            aria-label={`Remove ${docName}`}
                          >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <p className="mt-1 text-xs text-gray-500">
                Accepted: PDF, JPG, PNG. Max 5MB.
              </p>
            </div>

          </div>
        )}

        {/* Added Visa Entries List Hidden as per user request */}

        {/* Visa/Workpermit Required - Show only when No is selected */}
        {requiresVisa === 'No' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Visa/Workpermit Required?
            </label>
            <div className="space-y-2">
              {VISA_WORKPERMIT_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visaWorkpermit"
                    value={option}
                    checked={visaWorkpermitRequired === option}
                    onChange={(e) => setVisaWorkpermitRequired(e.target.value)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 flex items-start gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-0.5 shrink-0">
                <g clipPath="url(#clip0_3_14286)">
                  <path d="M14.0289 8.00086C14.0289 4.67058 11.3292 1.97086 7.99891 1.97086C4.66863 1.97086 1.96891 4.67058 1.96891 8.00086C1.96891 11.3312 4.66863 14.0309 7.99891 14.0309C11.3292 14.0309 14.0289 11.3312 14.0289 8.00086ZM15.3689 8.00086C15.3689 12.0712 12.0692 15.3709 7.99891 15.3709C3.92857 15.3709 0.628906 12.0712 0.628906 8.00086C0.628906 3.93052 3.92857 0.630859 7.99891 0.630859C12.0692 0.630859 15.3689 3.93052 15.3689 8.00086Z" fill="#4B5563" />
                  <path d="M7.32812 10.6703L7.32812 7.99031C7.32812 7.62027 7.62808 7.32031 7.99813 7.32031C8.36817 7.32031 8.66813 7.62027 8.66813 7.99031V10.6703C8.66813 11.0404 8.36817 11.3403 7.99813 11.3403C7.62808 11.3403 7.32812 11.0404 7.32812 10.6703Z" fill="#4B5563" />
                  <path d="M8.00469 4.66016L8.07337 4.66343C8.41118 4.69775 8.67469 4.98326 8.67469 5.33016C8.67469 5.67706 8.41118 5.96256 8.07337 5.99689L8.00469 6.00016H7.99813C7.62808 6.00016 7.32812 5.70018 7.32812 5.33016C7.32812 4.96013 7.62808 4.66016 7.99813 4.66016H8.00469Z" fill="#4B5563" />
                </g>
                <defs>
                  <clipPath id="clip0_3_14286">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <p className="text-xs text-gray-500">
                Some selected locations may require company-sponsored visas depending on role and country.
              </p>
            </div>
          </div>
        )}

        {/* Additional Notes (Optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={additionalRemarks}
            onChange={(e) => setAdditionalRemarks(e.target.value)}
            placeholder="Add any further information about your visa or work authorization."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          />
        </div>
      </div>

    </ProfileDrawer>
  );
}