'use client';

import { useState, useEffect, useRef } from 'react';
import GapExplanationModal, { GapExplanationData } from './GapExplanationModal';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';
import ProfileDatePicker from '@/components/profile/ProfileDatePicker';
import { profileFieldClass, profileSectionTitleClass, profileTextareaClass } from '@/lib/profile-modal-ui';
import {
  isPersistedWorkExperienceId,
  normalizeEmploymentTypeFromApi,
  normalizeWorkModeFromApi,
} from '@/lib/work-experience-utils';
import {
  getProfileDocumentDisplayName,
  isStoredProfileDocument,
  openProfileDocumentInNewTab,
  openProfileDocumentItemInNewTab,
} from '@/lib/profile-documents';

interface WorkExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WorkExperienceData) => void | Promise<void>;
  initialData?: WorkExperienceData;
  editingEntryId?: string | null;
}

export interface WorkExperienceDocument {
  id: string;
  file?: File | string;
  name: string;
  url?: string;
  size?: number;
}

export interface WorkExperienceEntry {
  id: string;
  jobTitle: string;
  companyName: string;
  employmentType: string;
  industryDomain: string;
  numberOfReportees: string;
  startDate: string;
  endDate: string;
  currentlyWorkHere: boolean;
  workLocation: string;
  workMode: string;
  companyProfile: string;
  companyTurnover: string;
  keyResponsibilities: string;
  achievements: string;
  workSkills: string[];
  documents?: WorkExperienceDocument[];
}

export interface WorkExperienceData {
  workExperiences: WorkExperienceEntry[];
}

const TURNOVER_CURRENCIES = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'SGD',
  'AUD',
  'CAD',
  'JPY',
  'CNY',
  'CHF',
  'HKD',
  'NZD',
  'ZAR',
  'SAR',
  'MYR',
  'THB',
  'TRY',
  'BRL',
  'MXN',
  'KRW',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'IDR',
  'PHP',
  'PKR',
  'BDT',
  'QAR',
  'OMR',
  'KWD',
  'BHD',
  'ILS',
  'NGN',
] as const;

function formatStoredTurnover(currency: string, amount: string): string {
  const a = amount.trim();
  if (!a) return '';
  return `${currency.trim().toUpperCase()} ${a}`.trim();
}

function parseStoredTurnover(stored: string): { currency: string; amount: string } {
  const raw = (stored || '').trim();
  if (!raw) return { currency: 'INR', amount: '' };

  const legacyLabels: Record<string, string> = {
    '0-10': '0-10 Crores',
    '10-50': '10-50 Crores',
    '50-100': '50-100 Crores',
    '100+': '100+ Crores',
  };
  if (legacyLabels[raw]) {
    return { currency: 'INR', amount: legacyLabels[raw] };
  }

  const codes = new Set<string>(TURNOVER_CURRENCIES as unknown as string[]);
  const parts = raw.split(/\s+/);
  const head = parts[0]?.toUpperCase() ?? '';
  if (codes.has(head)) {
    const rest = parts.slice(1).join(' ').trim();
    return { currency: head, amount: rest };
  }

  return { currency: 'INR', amount: raw };
}

export default function WorkExperienceModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  editingEntryId = null,
}: WorkExperienceModalProps) {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [industryDomain, setIndustryDomain] = useState('');
  const [numberOfReportees, setNumberOfReportees] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentlyWorkHere, setCurrentlyWorkHere] = useState(false);
  const [workLocation, setWorkLocation] = useState('');
  const [workMode, setWorkMode] = useState('');
  const [companyProfile, setCompanyProfile] = useState('');
  const [companyTurnoverCurrency, setCompanyTurnoverCurrency] = useState('INR');
  const [companyTurnoverAmount, setCompanyTurnoverAmount] = useState('');
  const [keyResponsibilities, setKeyResponsibilities] = useState('');
  const [achievements, setAchievements] = useState('');
  const [workSkillsInput, setWorkSkillsInput] = useState('');
  const [workSkills, setWorkSkills] = useState<string[]>([]);
  const [documents, setDocuments] = useState<WorkExperienceDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceEntry[]>(initialData?.workExperiences || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isGapModalOpen, setIsGapModalOpen] = useState(false);
  const [gapInfo, setGapInfo] = useState<{
    gapYears: number;
    gapMonths: number;
    gapDays?: number;
    fromDate: string;
    toDate: string;
  } | null>(null);
  const [gapExplanationData, setGapExplanationData] = useState<GapExplanationData | undefined>();

  // Function to populate form fields from an entry
  const populateFormFromEntry = (entry: WorkExperienceEntry) => {
    setJobTitle(entry.jobTitle || '');
    setCompanyName(entry.companyName || '');
    setEmploymentType(normalizeEmploymentTypeFromApi(entry.employmentType));
    setIndustryDomain(entry.industryDomain || '');
    setNumberOfReportees(entry.numberOfReportees || '');
    setStartDate(entry.startDate || '');
    setEndDate(entry.endDate || '');
    setCurrentlyWorkHere(entry.currentlyWorkHere || false);
    setWorkLocation(entry.workLocation || '');
    setWorkMode(normalizeWorkModeFromApi(entry.workMode));
    setCompanyProfile(entry.companyProfile || '');
    const parsed = parseStoredTurnover(entry.companyTurnover || '');
    setCompanyTurnoverCurrency(parsed.currency);
    setCompanyTurnoverAmount(parsed.amount);
    setKeyResponsibilities(entry.keyResponsibilities || '');
    setAchievements(entry.achievements || '');
    setWorkSkills(entry.workSkills || []);
    
    // Handle documents - convert URLs to document objects
    if (entry.documents && entry.documents.length > 0) {
      const normalizedDocs: WorkExperienceDocument[] = entry.documents.map((doc: any, index: number) => {
        if (typeof doc === 'string') {
          return {
            id: `doc-${Date.now()}-${index}`,
            url: doc,
            name: getProfileDocumentDisplayName(doc),
          };
        } else if (doc && typeof doc === 'object') {
          return {
            id: doc.id || `doc-${Date.now()}-${index}`,
            url: doc.url,
            name: doc.name || 'Document',
            size: doc.size,
          };
        } else {
          return {
            id: `doc-${Date.now()}-${index}`,
            name: 'Document',
          };
        }
      });
      setDocuments(normalizedDocs);
    } else {
      setDocuments([]);
    }
  };

  // Initialize form only when the drawer opens or the edited entry changes — not on
  // every parent re-render (e.g. after picking a file), which used to wipe in-progress fields.
  const sessionInitKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      sessionInitKeyRef.current = null;
      return;
    }

    const initKey = editingEntryId ? `edit:${editingEntryId}` : 'add';

    if (sessionInitKeyRef.current === initKey) {
      return;
    }
    sessionInitKeyRef.current = initKey;

    if (!editingEntryId) {
      setWorkExperiences([]);
      clearFormFields();
      return;
    }

    const experiences = initialData?.workExperiences;
    const entryToEdit =
      experiences?.find((e) => e.id === editingEntryId) ?? experiences?.[0];

    if (entryToEdit) {
      setWorkExperiences([entryToEdit]);
      populateFormFromEntry(entryToEdit);
    } else {
      resetForm();
    }
  }, [isOpen, editingEntryId, initialData?.workExperiences?.[0]?.id]);

  const clearFormFields = () => {
    setJobTitle('');
    setCompanyName('');
    setEmploymentType('');
    setIndustryDomain('');
    setNumberOfReportees('');
    setStartDate('');
    setEndDate('');
    setCurrentlyWorkHere(false);
    setWorkLocation('');
    setWorkMode('');
    setCompanyProfile('');
    setCompanyTurnoverCurrency('INR');
    setCompanyTurnoverAmount('');
    setKeyResponsibilities('');
    setAchievements('');
    setWorkSkillsInput('');
    setWorkSkills([]);
    setDocuments([]);
  };

  const resetForm = () => {
    clearFormFields();
    setWorkExperiences([]);
  };

  const handleAddWorkExperience = () => {
    if (missingRequiredFields.length > 0) {
      alert(`Please complete these required fields: ${missingRequiredFields.join(', ')}`);
      return;
    }

    // Check for gap before adding (only if there are existing experiences and gap modal is not already open)
    if (!isGapModalOpen) {
      const hasGap = checkForGapAndShowModal(startDate);
      
      if (hasGap) {
        // Don't add yet, wait for user to acknowledge the gap in the modal
        return;
      }
    } else {
      // If gap modal is already open, don't check again - user needs to close or save it first
      return;
    }

    // If no gap or first experience, proceed with adding
    addWorkExperienceEntry();
  };

  const addWorkExperienceEntry = async () => {
    const newEntry: WorkExperienceEntry = {
      id: Date.now().toString(),
      jobTitle: jobTitle.trim(),
      companyName: companyName.trim(),
      employmentType,
      industryDomain,
      numberOfReportees,
      startDate,
      endDate,
      currentlyWorkHere,
      workLocation,
      workMode,
      companyProfile,
      companyTurnover: formatStoredTurnover(companyTurnoverCurrency, companyTurnoverAmount),
      keyResponsibilities,
      achievements,
      workSkills,
      documents: documents.length > 0 ? documents : undefined,
    };

    setWorkExperiences([...workExperiences, newEntry]);
    
    // Clear only the form fields for the next entry
    clearFormFields();
    
    // Close gap modal if open
    setIsGapModalOpen(false);
    setGapInfo(null);
  };

  const handleEditStagedEntry = (entry: WorkExperienceEntry) => {
    populateFormFromEntry(entry);
    setWorkExperiences((prev) => prev.filter((e) => e.id !== entry.id));
  };

  const handleRemoveStagedEntry = (entryId: string) => {
    setWorkExperiences((prev) => prev.filter((e) => e.id !== entryId));
  };

  const handleGapExplanationSave = (data: GapExplanationData) => {
    setGapExplanationData(data);
    // Close the gap modal
    setIsGapModalOpen(false);
    // After saving gap explanation, proceed to add the work experience
    addWorkExperienceEntry();
  };

  const getGapDurationText = () => {
    if (!gapInfo) return '6 months - 1 year';
    const { gapYears, gapMonths } = gapInfo;
    
    if (gapYears === 0 && gapMonths < 3) {
      return 'Less than 3 months';
    } else if (gapYears === 0 && gapMonths < 6) {
      return '3-6 months';
    } else if (gapYears === 0) {
      return '6 months - 1 year';
    } else if (gapYears === 1) {
      return '1-2 years';
    } else {
      return 'More than 2 years';
    }
  };

  const calculateGap = (previousEndDate: string, newStartDate: string) => {
    if (!previousEndDate || !newStartDate) {
      return null;
    }
    
    // Normalize dates - ensure they're in YYYY-MM-DD format
    let prevEnd: Date;
    let newStart: Date;
    
    try {
      // Handle different date formats
      if (previousEndDate.includes('/')) {
        // Handle MM/DD/YYYY or DD/MM/YYYY format
        const parts = previousEndDate.split('/');
        if (parts.length === 3) {
          // Assume MM/DD/YYYY format
          prevEnd = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}T00:00:00`);
        } else {
          prevEnd = new Date(previousEndDate + 'T00:00:00');
        }
      } else {
        prevEnd = new Date(previousEndDate + 'T00:00:00');
      }
      
      if (newStartDate.includes('/')) {
        // Handle MM/DD/YYYY or DD/MM/YYYY format
        const parts = newStartDate.split('/');
        if (parts.length === 3) {
          // Assume MM/DD/YYYY format
          newStart = new Date(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}T00:00:00`);
        } else {
          newStart = new Date(newStartDate + 'T00:00:00');
        }
      } else {
        newStart = new Date(newStartDate + 'T00:00:00');
      }
      
      // Check if dates are valid
      if (isNaN(prevEnd.getTime()) || isNaN(newStart.getTime())) {
        return null;
      }
      
      // Check if new start date is actually after previous end date
      // Add 1 day buffer to account for same-day transitions
      const prevEndPlusOne = new Date(prevEnd);
      prevEndPlusOne.setDate(prevEndPlusOne.getDate() + 1);
      
      if (newStart <= prevEndPlusOne) {
        return null; // No gap, dates overlap or are continuous (within 1 day)
      }
      
      // Calculate the difference in milliseconds
      const diffTime = newStart.getTime() - prevEnd.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // Calculate years, months, and days
      let gapYears = 0;
      let gapMonths = 0;
      let gapDays = diffDays;
      
      // Calculate years
      if (diffDays >= 365) {
        gapYears = Math.floor(diffDays / 365);
        gapDays = diffDays % 365;
      }
      
      // Calculate months from remaining days
      if (gapDays >= 30) {
        gapMonths = Math.floor(gapDays / 30);
        gapDays = gapDays % 30;
      }
      
      // Return gap info for ANY gap (even if just days)
      return {
        gapYears,
        gapMonths,
        gapDays,
        fromDate: previousEndDate,
        toDate: newStartDate,
      };
    } catch (error) {
      console.error('Error calculating gap:', error);
      return null;
    }
  };

  const checkForGapAndShowModal = (newStartDate: string) => {
    if (!newStartDate || workExperiences.length === 0) {
      return false;
    }
    
    const lastExperience = workExperiences[workExperiences.length - 1];
    let previousEndDate = lastExperience.endDate;
    
    // If currently working or no end date, use today's date
    if (lastExperience.currentlyWorkHere || !previousEndDate) {
      const today = new Date();
      previousEndDate = today.toISOString().split('T')[0];
    }
    
    // Calculate gap - returns gap info for ANY gap (days, months, or years)
    const gap = calculateGap(previousEndDate, newStartDate);
    
    if (gap) {
      // Show modal for ANY gap detected (days, months, or years)
      setGapInfo(gap);
      setIsGapModalOpen(true);
      return true; // Gap detected
    }
    
    return false; // No gap detected
  };

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate);
    
    // Check for gap when start date is selected
    checkForGapAndShowModal(newStartDate);
  };

  // File upload handlers
  const handleReporteesChange = (value: string) => {
    setNumberOfReportees(value.replace(/\D/g, ''));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const newDocuments: WorkExperienceDocument[] = [];
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

    setDocuments((prev) => [...prev, ...newDocuments]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  const handlePreviewDocument = (doc: WorkExperienceDocument) => {
    if (doc.url) {
      openProfileDocumentItemInNewTab({ url: doc.url });
      return;
    }
    if (doc.file) {
      if (typeof doc.file === 'string') {
        openProfileDocumentInNewTab(resolveDocumentUrl(doc.file));
      } else {
        openProfileDocumentItemInNewTab({ file: doc.file });
      }
    }
  };

  const handleDownloadFile = async (doc: WorkExperienceDocument) => {
    let url = '';
    if (doc.url) {
      url = resolveDocumentUrl(doc.url);
    } else if (doc.file) {
      url = typeof doc.file === 'string' ? resolveDocumentUrl(doc.file) : URL.createObjectURL(doc.file);
    }

    if (!url) return;

    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      link.target = "_blank";
      link.click();
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
  };

  const getMissingRequiredFields = () => {
    const missingFields: string[] = [];

    if (!String(jobTitle || '').trim()) missingFields.push('Job Title');
    if (!String(companyName || '').trim()) missingFields.push('Company Name');
    if (!employmentType) missingFields.push('Employment Type');
    if (!industryDomain) missingFields.push('Industry / Domain');
    if (!String(numberOfReportees || '').trim()) missingFields.push('Number of Reportees');

    if (!workSkills.length) missingFields.push('Skills Used');

    if (!startDate) missingFields.push('Start Date');
    if (!currentlyWorkHere && !endDate) missingFields.push('End Year');

    if (!String(workLocation || '').trim()) missingFields.push('Work Location');
    if (!workMode) missingFields.push('Work Mode');

    if (!String(companyProfile || '').trim()) missingFields.push('Company Profile');
    if (!formatStoredTurnover(companyTurnoverCurrency, companyTurnoverAmount).trim()) {
      missingFields.push('Company Turnover');
    }

    if (!String(keyResponsibilities || '').trim()) missingFields.push('Key Responsibilities');
    if (!String(achievements || '').trim()) missingFields.push('Achievements');

    return missingFields;
  };

  const missingRequiredFields = getMissingRequiredFields();
  const isFormComplete = missingRequiredFields.length === 0;
  const hasAnyFormData = Boolean(
    jobTitle.trim() ||
      companyName.trim() ||
      employmentType ||
      industryDomain ||
      numberOfReportees.trim() ||
      startDate ||
      endDate ||
      currentlyWorkHere ||
      workLocation.trim() ||
      workMode ||
      companyProfile.trim() ||
      formatStoredTurnover(companyTurnoverCurrency, companyTurnoverAmount).trim() ||
      keyResponsibilities.trim() ||
      achievements.trim() ||
      workSkillsInput.trim() ||
      workSkills.length > 0 ||
      documents.length > 0
  );
  // Only show save button when all compulsory fields are filled
  const canSaveWorkExperience = isFormComplete;

  // Helper function to check if an ID is a persisted MongoDB ObjectId
  const handleSave = async () => {
    // Check if there's unsaved form data (user filled form but didn't click "Add Work Experience")
    const hasFormData = hasAnyFormData;

    if (hasFormData && !isFormComplete) {
      alert(`Please complete these required fields before saving: ${missingRequiredFields.join(', ')}`);
      return;
    }
    
    let finalWorkExperiences = [...workExperiences];
    
    if (hasFormData) {
      const formEntry: WorkExperienceEntry = {
        id: editingEntryId || `temp-${Date.now()}`,
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        employmentType,
        industryDomain,
        numberOfReportees,
        startDate,
        endDate,
        currentlyWorkHere,
        workLocation,
        workMode,
        companyProfile,
        companyTurnover: formatStoredTurnover(companyTurnoverCurrency, companyTurnoverAmount),
        keyResponsibilities,
        achievements,
        workSkills,
        documents: documents.length > 0 ? documents : undefined,
      };

      if (editingEntryId) {
        const existingIndex = finalWorkExperiences.findIndex((e) => e.id === editingEntryId);
        const existing = existingIndex >= 0 ? finalWorkExperiences[existingIndex] : null;
        const updatedEntry: WorkExperienceEntry = {
          ...existing,
          ...formEntry,
          id: editingEntryId,
          documents: documents.length > 0 ? documents : existing?.documents,
        };
        if (existingIndex >= 0) {
          finalWorkExperiences[existingIndex] = updatedEntry;
        } else {
          finalWorkExperiences.push(updatedEntry);
        }
      } else {
        finalWorkExperiences.push(formEntry);
      }
    }

    const entriesToPersist = editingEntryId
      ? finalWorkExperiences.filter((e) => e.id === editingEntryId)
      : finalWorkExperiences.filter((e) => !isPersistedWorkExperienceId(e.id));

    if (entriesToPersist.length === 0) {
      alert('Please fill all required work experience details before saving.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ workExperiences: entriesToPersist });
      onClose();
    } catch (error) {
      console.error('Error saving work experience:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save work experience. Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const inputClassName = profileFieldClass();
  const selectClassName = `${profileFieldClass()} appearance-none bg-white`;
  const textareaClassName = `${profileTextareaClass} min-h-[100px]`;
  const sectionTitleClassName = profileSectionTitleClass;

  return (
    <>
      {/* Gap Explanation Modal */}
      <GapExplanationModal
        isOpen={isGapModalOpen}
        onClose={() => {
          // When closing without saving, allow user to add experience anyway
          setIsGapModalOpen(false);
          // Keep gapInfo in case user wants to add experience
        }}
        onSave={handleGapExplanationSave}
        initialData={gapInfo ? {
          gapCategory: 'Professional',
          reasonForGap: '',
          gapDuration: getGapDurationText(),
          selectedSkills: [],
          coursesText: '',
          preferredSupport: {
            flexibleRole: false,
            hybridRemote: false,
            midLevelReEntry: false,
            skillRefresher: false,
          },
        } : undefined}
        gapInfo={gapInfo || undefined}
      />

      <ProfileDrawer
        isOpen={isOpen}
        onClose={onClose}
        title="Work Experience"
        widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
        footer={(
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            {canSaveWorkExperience && (
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? 'Saving…' : 'Save Work Experience'}
              </button>
            )}
          </div>
        )}
      >
            {!editingEntryId && workExperiences.length > 0 ? (
              <section className="mb-6 space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Entries ready to save ({workExperiences.length})
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Use the edit icon to change an entry, or add another role below.
                  </p>
                </div>
                <ul className="space-y-2">
                  {workExperiences.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">
                          {entry.jobTitle || 'Role'}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {entry.companyName || 'Company'}
                          {entry.startDate
                            ? ` · ${entry.startDate}${entry.currentlyWorkHere ? ' – Present' : entry.endDate ? ` – ${entry.endDate}` : ''}`
                            : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditStagedEntry(entry)}
                          className="rounded-lg border border-gray-200 p-2 text-blue-600 hover:bg-blue-50"
                          aria-label={`Edit ${entry.jobTitle || 'work experience'}`}
                          title="Edit entry"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedEntry(entry.id)}
                          className="rounded-lg border border-gray-200 p-2 text-red-600 hover:bg-red-50"
                          aria-label={`Remove ${entry.jobTitle || 'work experience'}`}
                          title="Remove entry"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {/* SECTION 1: ROLE DETAILS */}
            <section className="space-y-4">
              <h3 className={sectionTitleClassName}>Role Details</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Job Title <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Software Developer"
                    className={`${inputClassName} ${!jobTitle.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!jobTitle.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Job title is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Company Name <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., TCS, Deloitte, Amazon"
                    className={`${inputClassName} ${!companyName.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!companyName.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Company name is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Employment Type <span className="text-amber-600">*</span></label>
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className={`${selectClassName} ${!employmentType && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  >
                    <option value="">Select employment type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Freelance</option>
                  </select>
                  {!employmentType && (
                    <p className="mt-1 text-xs text-amber-600">Employment type is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Industry / Domain <span className="text-amber-600">*</span></label>
                  <select
                    value={industryDomain}
                    onChange={(e) => setIndustryDomain(e.target.value)}
                    className={`${selectClassName} ${!industryDomain && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  >
                    <option value="">Select Industry / Domain</option>
                    <option value="technology">Technology</option>
                    <option value="finance">Finance</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="consulting">Consulting</option>
                  </select>
                  {!industryDomain && (
                    <p className="mt-1 text-xs text-amber-600">Industry/Domain is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Number of Reportees <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={numberOfReportees}
                    onChange={(e) => handleReporteesChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-', '.'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pasted = e.clipboardData.getData('text');
                      handleReporteesChange(pasted);
                    }}
                    placeholder="e.g., 5"
                    className={`${inputClassName} ${!numberOfReportees.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!numberOfReportees.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Number of reportees is required</p>
                  )}
                  <p className="text-xs text-gray-400">How many people directly reported to you in this role?</p>
                </div>
              </div>
            </section>

            {/* SECTION 2: DURATION */}
            <section className="space-y-4 border-t pt-6">
              <h3 className={sectionTitleClassName}>Duration</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Start Date <span className="text-amber-600">*</span></label>
                  <ProfileDatePicker
                    value={startDate}
                    max={endDate || undefined}
                    onChange={handleStartDateChange}
                    invalid={!startDate}
                  />
                  {!startDate && (
                    <p className="mt-1 text-xs text-amber-600">Start date is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">End Date {!currentlyWorkHere && <span className="text-amber-600">*</span>}</label>
                  <ProfileDatePicker
                    value={endDate}
                    min={startDate || undefined}
                    onChange={setEndDate}
                    disabled={currentlyWorkHere}
                    invalid={!currentlyWorkHere && !endDate}
                    displayValue={currentlyWorkHere ? 'Present' : undefined}
                  />
                  {!currentlyWorkHere && !endDate && (
                    <p className="mt-1 text-xs text-amber-600">End date is required</p>
                  )}
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={currentlyWorkHere}
                      onChange={(e) => {
                        setCurrentlyWorkHere(e.target.checked);
                        if (e.target.checked) {
                          setEndDate('');
                        }
                      }}
                      className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    I currently work here
                  </label>
                </div>
              </div>
            </section>

            {/* SECTION 3: LOCATION & WORK MODE */}
            <section className="space-y-4 border-t pt-6">
              <h3 className={sectionTitleClassName}>Location & Work Mode</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Work Location <span className="text-amber-600">*</span></label>
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    placeholder="e.g., Bangalore, India"
                    className={`${inputClassName} ${!workLocation.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!workLocation.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Work location is required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Work Mode <span className="text-amber-600">*</span></label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value)}
                    className={`${selectClassName} ${!workMode && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  >
                    <option value="">Select work mode</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                  {!workMode && (
                    <p className="mt-1 text-xs text-amber-600">Work mode is required</p>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION 4: COMPANY DETAILS */}
            <section className="space-y-4 border-t pt-6">
              <h3 className={sectionTitleClassName}>Company Details</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Company Profile <span className="text-amber-600">*</span></label>
                  <textarea
                    value={companyProfile}
                    onChange={(e) => setCompanyProfile(e.target.value)}
                    placeholder="Brief description of the company..."
                    className={`${textareaClassName} ${!companyProfile.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!companyProfile.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Company profile is required</p>
                  )}
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Company Turnover <span className="text-amber-600">*</span></label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(7rem,8.75rem)_1fr]">
                    <select
                      value={companyTurnoverCurrency}
                      onChange={(e) => setCompanyTurnoverCurrency(e.target.value)}
                      className={selectClassName}
                      aria-label="Turnover currency"
                    >
                      {TURNOVER_CURRENCIES.map((code) => (
                        <option key={code} value={code}>
                          {code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={companyTurnoverAmount}
                      onChange={(e) => setCompanyTurnoverAmount(e.target.value)}
                      placeholder="e.g. 50 Cr, 1.2M, 25000000"
                      className={`${inputClassName} ${!companyTurnoverAmount.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                      aria-label="Company turnover amount"
                    />
                  </div>
                  {!companyTurnoverAmount.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Enter company turnover amount</p>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION 5: ROLE CONTRIBUTION */}
            <section className="space-y-4 border-t pt-6">
              <h3 className={sectionTitleClassName}>Role Contribution</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Key Responsibilities <span className="text-amber-600">*</span></label>
                  <textarea
                    value={keyResponsibilities}
                    onChange={(e) => setKeyResponsibilities(e.target.value)}
                    placeholder="Describe your primary duties and responsibilities..."
                    className={`${textareaClassName} ${!keyResponsibilities.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!keyResponsibilities.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Key responsibilities are required</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Achievements <span className="text-amber-600">*</span></label>
                  <textarea
                    value={achievements}
                    onChange={(e) => setAchievements(e.target.value)}
                    placeholder="List your key accomplishments in this role..."
                    className={`${textareaClassName} ${!achievements.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!achievements.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Achievements are required</p>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION 6: SKILLS & DOCUMENTS */}
            <section className="space-y-4 border-t pt-6">
              <h3 className={sectionTitleClassName}>Skills & Documents</h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2 space-y-3">
                  <label className="block text-sm font-medium text-gray-700">Skills Used <span className="text-amber-600">*</span></label>
                  <div className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={workSkillsInput}
                      onChange={(e) => setWorkSkillsInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && workSkillsInput.trim()) {
                          setWorkSkills([...workSkills, workSkillsInput.trim()]);
                          setWorkSkillsInput('');
                        }
                      }}
                      placeholder="Add skills you applied in this role..."
                      className={`col-span-10 ${inputClassName}`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (workSkillsInput.trim()) {
                          setWorkSkills([...workSkills, workSkillsInput.trim()]);
                          setWorkSkillsInput('');
                        }
                      }}
                      className="col-span-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                  {workSkills.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2">
                      {workSkills.map((skill, index) => (
                        <span key={index} className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                          {skill}
                          <button
                            onClick={() => {
                              setWorkSkills(workSkills.filter((_, i) => i !== index));
                            }}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="col-span-2 space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Your Work Experience Certificates/Documents{' '}
                    <span className="text-gray-500 text-xs font-normal">(Optional)</span>
                  </label>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileInputChange}
                className="hidden"
              />

              {/* Drag and Drop Area */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                }`}
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                  </p>
                  <p className="mt-1 text-xs text-gray-400">PDF, PNG, JPG (MAX. 5MB per file)</p>
                </div>
              </div>

              {/* Uploaded Files List */}
              {documents.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Uploaded Documents ({documents.length})
                  </p>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className="w-5 h-5 text-[#9095A1]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                          />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                          {doc.size && (
                            <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-2">
                          {isStoredProfileDocument(doc) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePreviewDocument(doc)}
                                className="text-blue-600 hover:text-blue-700 transition-colors"
                                title="View Document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDownloadFile(doc)}
                                className="text-orange-600 hover:text-orange-700 transition-colors"
                                title="Download Document"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(doc.id);
                        }}
                        className="text-amber-700 hover:text-amber-800"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
                </div>
              </div>
            </section>

            {hasAnyFormData && missingRequiredFields.length > 0 && (
              <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                <p className="text-xs font-medium text-amber-700">
                  Missing required fields: {missingRequiredFields.join(', ')}
                </p>
              </div>
            )}


      </ProfileDrawer>
    </>
  );
}
