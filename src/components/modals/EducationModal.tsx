'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';
import { profileFieldClass, profileTextareaClass } from '@/lib/profile-modal-ui';
import {
  getProfileDocumentDisplayName,
  isStoredProfileDocument,
  openProfileDocumentItemInNewTab,
} from '@/lib/profile-documents';
import {
  type CitySuggestion,
  formatCitySuggestionLabel,
  searchCitySuggestions,
} from '@/lib/geo-locations';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EducationData) => void;
  initialData?: EducationData;
  editingEducationId?: string | null;
}

export interface EducationDocument {
  id: string;
  file?: File;
  name: string;
  url?: string;
  size?: number;
}

export interface EducationData {
  id?: string;
  educationLevel: string;
  degreeProgram: string;
  institutionName: string;
  /** City or area shown after institution, e.g. "Khopoli" in "VISHWANIKETAN, Khopoli". */
  institutionLocation?: string;
  fieldOfStudy: string;
  startYear: string;
  startMonth: string;
  endYear: string;
  endMonth: string;
  currentlyStudying: boolean;
  /** Encoded as `percentage|85`, `gpa|3.5`, or `grade|A+` (legacy plain numbers treated as percentage). */
  grade: string;
  modeOfStudy: string;
  courseDuration: string;
  documents?: EducationDocument[];
}

export type EducationGradeMetricType = 'percentage' | 'gpa' | 'grade';

export function decodeStoredGrade(stored: string): { type: EducationGradeMetricType; value: string } {
  const s = (stored || '').trim();
  if (!s) return { type: 'percentage', value: '' };
  const m = /^(percentage|gpa|grade)\|(.*)$/i.exec(s);
  if (m) {
    const t = m[1].toLowerCase() as EducationGradeMetricType;
    return { type: t, value: m[2] };
  }
  if (/^\d+(\.\d+)?$/.test(s)) return { type: 'percentage', value: s };
  return { type: 'grade', value: s };
}

export function formatStoredGradeForDisplay(stored: string): string {
  const { type, value } = decodeStoredGrade(stored);
  const v = value.trim();
  if (!v) return '';
  if (type === 'percentage') return `${v}%`;
  if (type === 'gpa') return `GPA ${v}`;
  return v;
}

function encodeStoredGrade(type: EducationGradeMetricType, value: string): string {
  const v = value.trim();
  if (!v) return '';
  return `${type}|${v}`;
}

export const EDUCATION_MONTH_OPTIONS = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
] as const;

const MONTH_SHORT = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

/** SSC / HSC and similar school-level entries (relaxed academic fields). */
export function isSchoolCertificateEntry(educationLevel: string, degreeProgram = ''): boolean {
  const text = `${educationLevel} ${degreeProgram}`.toLowerCase();
  return (
    /\b(ssc|hsc)\b/.test(text) ||
    educationLevel === 'High School' ||
    educationLevel === 'Secondary School' ||
    educationLevel === 'Higher Secondary'
  );
}

export function formatEducationTitle(educationLevel: string, degreeProgram: string): string {
  const degree = String(degreeProgram || '').trim();
  if (degree) return degree;
  return String(educationLevel || '').trim() || '—';
}

export function formatInstitutionLine(institutionName: string, institutionLocation?: string): string {
  const name = String(institutionName || '').trim();
  const location = String(institutionLocation || '').trim();
  if (name && location) return `${name}, ${location}`;
  return name || location || '—';
}

function formatMonthYearFull(year: string, month: string): string {
  const y = String(year || '').trim();
  const m = parseInt(String(month || '').trim(), 10);
  if (!y) return '';
  if (m >= 1 && m <= 12) return `${MONTH_FULL[m]} ${y}`;
  return y;
}

/** CV-style date line: start month–year through end month–year (e.g. July 2021 - July 2025). */
export function formatEducationDateLine(
  _educationLevel: string,
  _degreeProgram: string,
  startYear: string,
  startMonth: string,
  endYear: string,
  endMonth: string,
  currentlyStudying: boolean,
): string {
  const startPart = formatMonthYearFull(startYear, startMonth);
  if (currentlyStudying) {
    return startPart ? `${startPart} - Present` : 'Present';
  }
  const endPart = formatMonthYearFull(endYear, endMonth);
  if (startPart && endPart) return `${startPart} - ${endPart}`;
  return startPart || endPart || '—';
}

function toMonthIndex(year: string, month: string): number | null {
  const y = parseInt(String(year || '').trim(), 10);
  const m = parseInt(String(month || '').trim(), 10);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) return null;
  return y * 12 + m;
}

/** Duration in years from start/end month+year (stored as decimal years, e.g. 3.75). */
export function computeCourseDurationFromDates(
  startYear: string,
  startMonth: string,
  endYear: string,
  endMonth: string,
  currentlyStudying: boolean,
): string {
  const startIndex = toMonthIndex(startYear, startMonth);
  if (startIndex === null) return '';

  let endIndex: number | null;
  if (currentlyStudying) {
    const now = new Date();
    endIndex = now.getFullYear() * 12 + (now.getMonth() + 1);
  } else {
    endIndex = toMonthIndex(endYear, endMonth);
  }
  if (endIndex === null || endIndex < startIndex) return '';

  const totalMonths = Math.max(1, endIndex - startIndex);
  const years = totalMonths / 12;
  return String(parseFloat(years.toFixed(2)));
}

/** @deprecated Use computeCourseDurationFromDates */
export function computeCourseDurationFromYears(
  startYear: string,
  endYear: string,
  currentlyStudying: boolean,
): string {
  return computeCourseDurationFromDates(startYear, '1', endYear, '12', currentlyStudying);
}

export function formatEducationPeriod(
  startYear: string,
  startMonth: string,
  endYear: string,
  endMonth: string,
  currentlyStudying: boolean,
  educationLevel = '',
  degreeProgram = '',
): string {
  if (educationLevel || degreeProgram) {
    return formatEducationDateLine(
      educationLevel,
      degreeProgram,
      startYear,
      startMonth,
      endYear,
      endMonth,
      currentlyStudying,
    );
  }
  const sm = parseInt(String(startMonth || '').trim(), 10);
  const startPart = startYear
    ? sm >= 1 && sm <= 12
      ? `${MONTH_SHORT[sm]} ${startYear}`
      : startYear
    : '—';
  if (currentlyStudying) return `${startPart} – Present`;
  const em = parseInt(String(endMonth || '').trim(), 10);
  const endPart = endYear
    ? em >= 1 && em <= 12
      ? `${MONTH_SHORT[em]} ${endYear}`
      : endYear
    : '—';
  return `${startPart} – ${endPart}`;
}

export function formatCourseDurationDisplay(stored: string): string {
  const raw = String(stored || '').trim();
  if (!raw) return '';
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return raw;
  if (n < 1) {
    const months = Math.max(1, Math.round(n * 12));
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  }
  const rounded = parseFloat(n.toFixed(2));
  return `${rounded} ${rounded === 1 ? 'year' : 'years'}`;
}

function getGradeValidationError(type: EducationGradeMetricType, value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  if (type === 'percentage') {
    if (!/^\d{1,3}(\.\d{1,2})?$/.test(v)) return 'Enter a valid percentage (e.g. 72 or 85.5).';
    const n = Number(v);
    if (Number.isNaN(n) || n < 0 || n > 100) return 'Percentage must be between 0 and 100.';
    return null;
  }
  if (type === 'gpa') {
    if (!/^\d+(\.\d{1,2})?$/.test(v)) return 'Enter a valid GPA (e.g. 3.5 or 8.25).';
    const n = Number(v);
    if (Number.isNaN(n) || n <= 0 || n > 10) return 'GPA must be greater than 0 and at most 10.';
    return null;
  }
  if (v.length > 50) return 'Grade must be at most 50 characters.';
  if (!/^[\sA-Za-z0-9+\-./(),'"]+$/.test(v)) {
    return 'Use letters, numbers, and common grade symbols only.';
  }
  return null;
}

function normalizeEducationDocuments(
  docs?: Array<string | EducationDocument>,
): EducationDocument[] {
  if (!docs?.length) return [];
  return docs.map((doc, index) => {
    if (typeof doc === 'string') {
      return {
        id: `doc-${index}-${doc.slice(-8)}`,
        url: doc,
        name: getProfileDocumentDisplayName(doc),
      };
    }
    if (doc && typeof doc === 'object') {
      return {
        id: doc.id || `doc-${index}-${Date.now()}`,
        file: doc.file,
        name: doc.name || getProfileDocumentDisplayName(doc.url || doc.name || ''),
        url: doc.url,
        size: doc.size,
      };
    }
    return { id: `doc-${index}`, name: 'Document' };
  });
}

export default function EducationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  editingEducationId,
}: EducationModalProps) {
  const [educationLevel, setEducationLevel] = useState(initialData?.educationLevel || '');
  const [degreeProgram, setDegreeProgram] = useState(initialData?.degreeProgram || '');
  const [institutionName, setInstitutionName] = useState(initialData?.institutionName || '');
  const [institutionLocation, setInstitutionLocation] = useState(initialData?.institutionLocation || '');
  const [fieldOfStudy, setFieldOfStudy] = useState(initialData?.fieldOfStudy || '');
  const [startYear, setStartYear] = useState(initialData?.startYear || '');
  const [startMonth, setStartMonth] = useState(initialData?.startMonth || '');
  const [endYear, setEndYear] = useState(initialData?.endYear || '');
  const [endMonth, setEndMonth] = useState(initialData?.endMonth || '');
  const [currentlyStudying, setCurrentlyStudying] = useState(initialData?.currentlyStudying || false);
  const [gradeMetricType, setGradeMetricType] = useState<EducationGradeMetricType>('percentage');
  const [gradeInput, setGradeInput] = useState('');
  const [modeOfStudy, setModeOfStudy] = useState(initialData?.modeOfStudy || '');
  const [courseDuration, setCourseDuration] = useState(initialData?.courseDuration || '');
  const [durationManuallyEdited, setDurationManuallyEdited] = useState(false);
  const [documents, setDocuments] = useState<EducationDocument[]>(initialData?.documents || []);
  const [dragActive, setDragActive] = useState(false);
  const [dateError, setDateError] = useState<string>('');
  const locationAutocompleteRef = useRef<HTMLDivElement>(null);
  const locationSuggestOpenRef = useRef(false);
  const locationSuggestUserInitiatedRef = useRef(false);
  const [locationSuggestions, setLocationSuggestions] = useState<CitySuggestion[]>([]);
  const [locationSuggestLoading, setLocationSuggestLoading] = useState(false);
  const [locationSuggestError, setLocationSuggestError] = useState<string | null>(null);
  const [locationSuggestOpen, setLocationSuggestOpen] = useState(false);
  const [locationHighlight, setLocationHighlight] = useState(-1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionInitKeyRef = useRef<string | null>(null);

  const resetLocationSuggestState = useCallback(() => {
    setLocationSuggestions([]);
    setLocationSuggestLoading(false);
    setLocationSuggestError(null);
    setLocationSuggestOpen(false);
    setLocationHighlight(-1);
  }, []);

  const applyLocationSuggestion = useCallback(
    (suggestion: CitySuggestion) => {
      locationSuggestUserInitiatedRef.current = false;
      setInstitutionLocation(formatCitySuggestionLabel(suggestion));
      resetLocationSuggestState();
    },
    [resetLocationSuggestState],
  );

  const resetForm = () => {
    setEducationLevel('');
    setDegreeProgram('');
    setInstitutionName('');
    setInstitutionLocation('');
    resetLocationSuggestState();
    locationSuggestUserInitiatedRef.current = false;
    setFieldOfStudy('');
    setStartYear('');
    setStartMonth('');
    setEndYear('');
    setEndMonth('');
    setCurrentlyStudying(false);
    setGradeMetricType('percentage');
    setGradeInput('');
    setModeOfStudy('');
    setCourseDuration('');
    setDurationManuallyEdited(false);
    setDocuments([]);
    setDateError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const populateFormFromEducation = (data: EducationData) => {
    setEducationLevel(data.educationLevel || '');
    setDegreeProgram(data.degreeProgram || '');
    setInstitutionName(data.institutionName || '');
    setInstitutionLocation(data.institutionLocation || '');
    resetLocationSuggestState();
    locationSuggestUserInitiatedRef.current = false;
    setFieldOfStudy(data.fieldOfStudy || '');
    setStartYear(data.startYear || '');
    setStartMonth(data.startMonth || '');
    setEndYear(data.endYear || '');
    setEndMonth(data.endMonth || '');
    setCurrentlyStudying(data.currentlyStudying || false);
    const g = decodeStoredGrade(data.grade || '');
    setGradeMetricType(g.type);
    setGradeInput(g.value);
    setModeOfStudy(data.modeOfStudy || '');
    const computedDuration = computeCourseDurationFromDates(
      data.startYear || '',
      data.startMonth || '',
      data.endYear || '',
      data.endMonth || '',
      data.currentlyStudying || false,
    );
    const savedDuration = String(data.courseDuration || '').trim();
    setCourseDuration(savedDuration || computedDuration || '');
    setDurationManuallyEdited(Boolean(savedDuration && savedDuration !== computedDuration));
    setDocuments(normalizeEducationDocuments(data.documents));
    setDateError('');
  };

  // Initialize only when the drawer opens or the edited entry changes —
  // not on every parent re-render (which used to wipe fields after file upload).
  useEffect(() => {
    if (!isOpen) {
      sessionInitKeyRef.current = null;
      return;
    }

    const initKey = editingEducationId ? `edit:${editingEducationId}` : 'add';
    if (sessionInitKeyRef.current === initKey) {
      return;
    }
    sessionInitKeyRef.current = initKey;

    if (!editingEducationId || !initialData) {
      resetForm();
      return;
    }

    populateFormFromEducation(initialData);
  }, [isOpen, editingEducationId, initialData?.id, resetLocationSuggestState]);

  useEffect(() => {
    locationSuggestOpenRef.current = locationSuggestOpen;
  }, [locationSuggestOpen]);

  useEffect(() => {
    if (!isOpen) {
      locationSuggestUserInitiatedRef.current = false;
      resetLocationSuggestState();
      return;
    }
    locationSuggestUserInitiatedRef.current = false;
    resetLocationSuggestState();
  }, [isOpen, resetLocationSuggestState]);

  useEffect(() => {
    if (!locationSuggestOpen) return;
    const handleDown = (event: MouseEvent) => {
      if (locationAutocompleteRef.current && !locationAutocompleteRef.current.contains(event.target as Node)) {
        setLocationSuggestOpen(false);
        setLocationHighlight(-1);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [locationSuggestOpen]);

  useEffect(() => {
    if (locationHighlight < 0 || !locationAutocompleteRef.current) return;
    const node = locationAutocompleteRef.current.querySelector(
      `[data-location-suggest-index="${locationHighlight}"]`,
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [locationHighlight]);

  useEffect(() => {
    if (!isOpen) {
      resetLocationSuggestState();
      return;
    }

    if (!locationSuggestUserInitiatedRef.current) {
      resetLocationSuggestState();
      return;
    }

    const query = institutionLocation.trim();
    if (query.length < 2) {
      resetLocationSuggestState();
      return;
    }

    const timer = window.setTimeout(() => {
      setLocationSuggestError(null);
      setLocationSuggestLoading(true);

      const list = searchCitySuggestions(query);
      setLocationSuggestions(list);
      setLocationSuggestOpen(list.length > 0);
      setLocationHighlight(list.length > 0 ? 0 : -1);
      setLocationSuggestLoading(false);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [institutionLocation, isOpen, resetLocationSuggestState]);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    Array.from(files).forEach((file) => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only PDF, PNG, and JPG files are allowed.`);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 5MB.`);
        return;
      }

      const newDoc: EducationDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
      };
      setDocuments((prev) => [...prev, newDoc]);
    });
  };

  const handleRemoveFile = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handlePreviewDocument = (doc: EducationDocument) => {
    openProfileDocumentItemInNewTab(doc);
  };

  const handleDownloadFile = async (doc: EducationDocument) => {
    let url = '';
    if (doc.url) {
      url = resolveDocumentUrl(doc.url);
    } else if (doc.file) {
      url = URL.createObjectURL(doc.file);
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
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };


  const currentYear = new Date().getFullYear();
  const startYearOptions = [];
  for (let i = currentYear - 50; i <= currentYear + 10; i++) {
    startYearOptions.push(i);
  }

  // End year options must be >= start year
  const endYearOptions = startYear
    ? startYearOptions.filter((year) => year >= Number(startYear))
    : startYearOptions;

  const validateDateOrder = (
    startY: string,
    startM: string,
    endY: string,
    endM: string,
  ): string => {
    const startIndex = toMonthIndex(startY, startM);
    const endIndex = toMonthIndex(endY, endM);
    if (startIndex === null || endIndex === null) return '';
    if (endIndex < startIndex) {
      return 'End date must be on or after the start date';
    }
    return '';
  };

  const syncCourseDurationFromDates = (
    startY: string,
    startM: string,
    endY: string,
    endM: string,
    studying: boolean,
    force = false,
  ) => {
    if (durationManuallyEdited && !force) return;
    const computed = computeCourseDurationFromDates(startY, startM, endY, endM, studying);
    if (computed) setCourseDuration(computed);
  };

  const handleCourseDurationChange = (value: string) => {
    setDurationManuallyEdited(true);
    setCourseDuration(value);
  };

  const handleRecalculateDuration = () => {
    setDurationManuallyEdited(false);
    syncCourseDurationFromDates(
      startYear,
      startMonth,
      endYear,
      endMonth,
      currentlyStudying,
      true,
    );
  };

  const clearEndDateIfInvalid = (
    startY: string,
    startM: string,
    endY: string,
    endM: string,
  ) => {
    const error = validateDateOrder(startY, startM, endY, endM);
    if (error) {
      setEndYear('');
      setEndMonth('');
      setDateError(error);
      return { endY: '', endM: '', error };
    }
    setDateError('');
    return { endY, endM, error: '' };
  };

  const handleStartYearChange = (value: string) => {
    setStartYear(value);
    const { endY, endM } = clearEndDateIfInvalid(value, startMonth, endYear, endMonth);
    syncCourseDurationFromDates(value, startMonth, endY, endM, currentlyStudying);
  };

  const handleStartMonthChange = (value: string) => {
    setStartMonth(value);
    const { endY, endM } = clearEndDateIfInvalid(startYear, value, endYear, endMonth);
    syncCourseDurationFromDates(startYear, value, endY, endM, currentlyStudying);
  };

  const handleEndYearChange = (value: string) => {
    const error = validateDateOrder(startYear, startMonth, value, endMonth);
    setDateError(error);
    if (!error) {
      setEndYear(value);
      syncCourseDurationFromDates(startYear, startMonth, value, endMonth, currentlyStudying);
    }
  };

  const handleEndMonthChange = (value: string) => {
    const error = validateDateOrder(startYear, startMonth, endYear, value);
    setDateError(error);
    if (!error) {
      setEndMonth(value);
      syncCourseDurationFromDates(startYear, startMonth, endYear, value, currentlyStudying);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    syncCourseDurationFromDates(startYear, startMonth, endYear, endMonth, currentlyStudying);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recalc when date fields change
  }, [isOpen, startYear, startMonth, endYear, endMonth, currentlyStudying, durationManuallyEdited]);

  const isSchoolCert = isSchoolCertificateEntry(educationLevel, degreeProgram);

  const missingRequiredFields: string[] = [];
  if (!String(educationLevel || '').trim()) missingRequiredFields.push('Education Level');
  if (!String(degreeProgram || '').trim() && !isSchoolCert) {
    missingRequiredFields.push('Qualification / Program');
  }
  if (!String(institutionName || '').trim()) missingRequiredFields.push('School / College / University');
  if (!isSchoolCert && !String(fieldOfStudy || '').trim()) {
    missingRequiredFields.push('Field of Study / Major');
  }

  if (!isSchoolCert) {
    if (!startYear) missingRequiredFields.push('Start Year');
    if (!startMonth) missingRequiredFields.push('Start Month');
    if (!currentlyStudying && !endYear) missingRequiredFields.push('End Year');
    if (!currentlyStudying && !endMonth) missingRequiredFields.push('End Month');
  }

  if (!isSchoolCert && !String(gradeInput || '').trim()) {
    missingRequiredFields.push('Grade / Percentage / GPA');
  }
  if (!isSchoolCert && !String(modeOfStudy || '').trim()) {
    missingRequiredFields.push('Mode of Study');
  }

  const computedDurationPreview = computeCourseDurationFromDates(
    startYear,
    startMonth,
    endYear,
    endMonth,
    currentlyStudying,
  );
  const effectiveCourseDuration =
    String(courseDuration || '').trim() || computedDurationPreview;

  if (!isSchoolCert && !effectiveCourseDuration) missingRequiredFields.push('Course Duration');

  const gradeFormatError =
    String(gradeInput || '').trim().length > 0
      ? getGradeValidationError(gradeMetricType, gradeInput)
      : null;
  const isCourseDurationNumeric = /^\d+(\.\d{1,2})?$/.test(effectiveCourseDuration);

  const hasPartialSchoolDates =
    isSchoolCert &&
    Boolean(
      startYear ||
        startMonth ||
        endYear ||
        endMonth,
    );
  const hasDateOrderError =
    !currentlyStudying &&
    Boolean(validateDateOrder(startYear, startMonth, endYear, endMonth)) &&
    (!isSchoolCert || hasPartialSchoolDates);

  const hasNumericError =
    Boolean(gradeFormatError) ||
    (effectiveCourseDuration.length > 0 && !isCourseDurationNumeric);

  missingRequiredFields.length = 0;

  const validationErrors: string[] = [];
  if (hasDateOrderError) {
    validationErrors.push('End date cannot be earlier than start date');
  }
  if (hasNumericError) {
    const parts: string[] = [];
    if (gradeFormatError) parts.push(gradeFormatError);
        if (effectiveCourseDuration.length > 0 && !isCourseDurationNumeric) {
          parts.push('Enter a valid course duration in years (up to 2 decimals).');
        }
    validationErrors.push(parts.join(' '));
  }

  const isFormValid = !hasDateOrderError && !hasNumericError;

  const handleSave = () => {
    const hasAnyFormData = Boolean(
      educationLevel.trim() ||
        degreeProgram.trim() ||
        institutionName.trim() ||
        institutionLocation.trim() ||
        fieldOfStudy.trim() ||
        startYear ||
        startMonth ||
        endYear ||
        endMonth ||
        currentlyStudying ||
        gradeInput.trim() ||
        modeOfStudy.trim() ||
        String(courseDuration || '').trim() ||
        documents.length > 0,
    );

    if (!hasAnyFormData) {
      onClose();
      return;
    }

    if (!isFormValid) {
      alert(validationErrors.join('\n'));
      return;
    }

    const resolvedDegree =
      String(degreeProgram || '').trim() ||
      (isSchoolCert ? educationLevel : '');

    onSave({
      id: initialData?.id ?? editingEducationId ?? undefined,
      educationLevel,
      degreeProgram: resolvedDegree,
      institutionName,
      institutionLocation: institutionLocation.trim() || undefined,
      fieldOfStudy: isSchoolCert ? fieldOfStudy.trim() : fieldOfStudy,
      startYear,
      startMonth,
      endYear,
      endMonth,
      currentlyStudying,
      grade: encodeStoredGrade(gradeMetricType, gradeInput),
      modeOfStudy,
      courseDuration: effectiveCourseDuration,
      documents: documents.length > 0 ? documents : undefined,
    });
    onClose();
  };

  const inputClassName = profileFieldClass();
  const selectClassName = `${profileFieldClass()} appearance-none bg-white`;
  const textareaClassName = `${profileTextareaClass} min-h-[100px]`;

  useEffect(() => {
    if (!isSchoolCert) return;
    if (!degreeProgram.trim() && educationLevel.trim()) {
      setDegreeProgram(educationLevel);
    }
  }, [educationLevel, isSchoolCert, degreeProgram]);

  const previewTitle = formatEducationTitle(educationLevel, degreeProgram);
  const previewInstitution = formatInstitutionLine(institutionName, institutionLocation);
  const previewDates = formatEducationDateLine(
    educationLevel,
    degreeProgram,
    startYear,
    startMonth,
    endYear,
    endMonth,
    currentlyStudying,
  );

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={editingEducationId ? 'Edit Education' : 'Add Education'}
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
            Save Education
          </button>
        </div>
      )}
    >
            <div className="space-y-6">
              {editingEducationId ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Preview (how it appears on your profile)
                  </p>
                  <div className="space-y-1 text-gray-900">
                    <p className="text-sm font-bold uppercase tracking-wide">{previewTitle}</p>
                    <p className="text-sm text-gray-700">{previewInstitution}</p>
                    <p className="text-sm text-gray-600">{previewDates}</p>
                  </div>
                </div>
              ) : null}

              {/* Education Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Level
                </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Select Education Level</option>
                    <option value="SSC">SSC (10th)</option>
                    <option value="HSC">HSC (12th)</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Associate Degree">Associate Degree</option>
                    <option value="Bachelor's Degree">Bachelor&apos;s Degree</option>
                    <option value="Master's Degree">Master&apos;s Degree</option>
                    <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                    <option value="Certification">Certification</option>
                    <option value="High School">High School</option>
                  </select>
              </div>

              {/* Qualification / Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Qualification / Program
                </label>
                  <input
                    type="text"
                    value={degreeProgram}
                    onChange={(e) => setDegreeProgram(e.target.value)}
                    placeholder={
                      isSchoolCert
                        ? 'e.g. HSC or SSC (optional — uses level if blank)'
                        : 'e.g. B.E IN COMPUTER SCIENCE'
                    }
                    className={inputClassName}
                  />
              </div>

              {/* Institution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School / College / University
                </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g. VISHWANIKETAN [VIMEET] or M.P.A.S.C College"
                    className={inputClassName}
                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location (City / Area)
                </label>
                <div className="relative" ref={locationAutocompleteRef}>
                  <input
                    type="text"
                    value={institutionLocation}
                    autoComplete="off"
                    onChange={(e) => {
                      locationSuggestUserInitiatedRef.current = true;
                      setInstitutionLocation(e.target.value);
                    }}
                    onFocus={() => {
                      if (
                        locationSuggestUserInitiatedRef.current &&
                        (locationSuggestions.length > 0 || locationSuggestLoading || locationSuggestError)
                      ) {
                        setLocationSuggestOpen(true);
                      }
                    }}
                    onBlur={() => {
                      window.setTimeout(() => {
                        if (!locationSuggestOpenRef.current) return;
                        setLocationSuggestOpen(false);
                        setLocationHighlight(-1);
                      }, 150);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'ArrowDown') {
                        if (!locationSuggestOpen && locationSuggestions.length > 0) {
                          setLocationSuggestOpen(true);
                        }
                        if (locationSuggestOpen && locationSuggestions.length > 0) {
                          e.preventDefault();
                          setLocationHighlight((i) => Math.min(i + 1, locationSuggestions.length - 1));
                        }
                      } else if (e.key === 'ArrowUp') {
                        if (locationSuggestOpen && locationSuggestions.length > 0) {
                          e.preventDefault();
                          setLocationHighlight((i) => Math.max(i - 1, 0));
                        }
                      } else if (e.key === 'Enter') {
                        if (locationSuggestOpen && locationSuggestions.length > 0) {
                          e.preventDefault();
                          const pick =
                            locationHighlight >= 0 && locationSuggestions[locationHighlight]
                              ? locationSuggestions[locationHighlight]
                              : locationSuggestions[0];
                          if (pick) applyLocationSuggestion(pick);
                        }
                      } else if (e.key === 'Tab' && locationSuggestOpen && locationSuggestions.length > 0) {
                        const pick =
                          locationHighlight >= 0 && locationSuggestions[locationHighlight]
                            ? locationSuggestions[locationHighlight]
                            : locationSuggestions[0];
                        if (pick) applyLocationSuggestion(pick);
                      } else if (e.key === 'Escape' && locationSuggestOpen) {
                        e.preventDefault();
                        e.stopPropagation();
                        setLocationSuggestOpen(false);
                        setLocationHighlight(-1);
                      }
                    }}
                    placeholder="Type city or country, then pick from the list"
                    className={inputClassName}
                  />
                  {locationSuggestOpen ? (
                    <div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-[min(280px,50vh)] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                      {locationSuggestLoading ? (
                        <div className="px-3 py-2 text-sm text-slate-500">Searching…</div>
                      ) : locationSuggestError ? (
                        <div className="px-3 py-2 text-sm text-red-600">{locationSuggestError}</div>
                      ) : locationSuggestions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-slate-500">
                          No locations found. You can still type manually.
                        </div>
                      ) : (
                        locationSuggestions.map((suggestion, idx) => (
                          <button
                            key={`${suggestion.countryCode}-${suggestion.stateCode}-${suggestion.value}-${idx}`}
                            type="button"
                            data-location-suggest-index={idx}
                            onMouseEnter={() => setLocationHighlight(idx)}
                            onMouseDown={(ev) => ev.preventDefault()}
                            onClick={() => applyLocationSuggestion(suggestion)}
                            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                              locationHighlight === idx ? 'bg-gray-50' : ''
                            }`}
                          >
                            {formatCitySuggestionLabel(suggestion)}
                          </button>
                        ))
                      )}
                    </div>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Shown after the institution name, e.g. &quot;College Name, Panvel&quot;
                </p>
              </div>

              {/* Field of Study / Major */}
              {!isSchoolCert ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field of Study / Major
                </label>
                <input
                  type="text"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="e.g., Computer Science"
                  className={inputClassName}
                />
              </div>
              ) : null}

              {/* Dates: start month–year and end month–year */}
              <div className="space-y-4">
                {isSchoolCert ? (
                  <p className="text-sm font-medium text-gray-700">
                    Dates{' '}
                    <span className="font-normal text-gray-500">(optional — start and completion month–year)</span>
                  </p>
                ) : null}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Start date
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                      <select
                        value={startMonth}
                        onChange={(e) => handleStartMonthChange(e.target.value)}
                        className={selectClassName}
                      >
                        <option value="">Select month</option>
                        {EDUCATION_MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                      <select
                        value={startYear}
                        onChange={(e) => handleStartYearChange(e.target.value)}
                        className={selectClassName}
                      >
                        <option value="">Select year</option>
                        {startYearOptions.map((year) => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    {isSchoolCert ? 'End date (completion)' : 'End date'}{' '}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Month</label>
                      <select
                        value={endMonth}
                        onChange={(e) => handleEndMonthChange(e.target.value)}
                        disabled={currentlyStudying}
                        className={`${selectClassName} disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          hasDateOrderError ? 'border-red-500 focus:ring-red-500 bg-red-50' : ''
                        }`}
                      >
                        <option value="">Select month</option>
                        {EDUCATION_MONTH_OPTIONS.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                      <select
                        value={endYear}
                        onChange={(e) => handleEndYearChange(e.target.value)}
                        disabled={currentlyStudying}
                        className={`${selectClassName} disabled:bg-gray-100 disabled:cursor-not-allowed ${
                          hasDateOrderError ? 'border-red-500 focus:ring-red-500 bg-red-50' : ''
                        }`}
                      >
                        <option value="">Select year</option>
                        {endYearOptions.map((year) => (
                          <option key={year} value={year.toString()}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {!isSchoolCert ? (
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentlyStudying}
                    onChange={(e) => {
                      const studying = e.target.checked;
                      setCurrentlyStudying(studying);
                      if (studying) {
                        setEndYear('');
                        setEndMonth('');
                        setDateError('');
                      }
                      syncCourseDurationFromDates(
                        startYear,
                        startMonth,
                        studying ? '' : endYear,
                        studying ? '' : endMonth,
                        studying,
                      );
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">I am currently studying here</span>
                </label>
                {dateError && (
                  <p className="mt-2 text-xs text-red-600">{dateError}</p>
                )}
              </div>
              ) : null}

              {/* Academic Details Section */}
              {!isSchoolCert ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Academic Details</h3>
                
                {/* Grade / Percentage / GPA */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade / Percentage / GPA
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(10.5rem,12rem)_1fr]">
                    <select
                      value={gradeMetricType}
                      onChange={(e) => setGradeMetricType(e.target.value as EducationGradeMetricType)}
                      className={selectClassName}
                      aria-label="Result type: grade, percentage, or GPA"
                    >
                      <option value="percentage">Percentage</option>
                      <option value="gpa">GPA</option>
                      <option value="grade">Grade</option>
                    </select>
                    <input
                      type="text"
                      inputMode={gradeMetricType === 'grade' ? 'text' : 'decimal'}
                      value={gradeInput}
                      onChange={(e) => setGradeInput(e.target.value)}
                      placeholder={
                        gradeMetricType === 'percentage'
                          ? 'e.g. 72 or 85.5'
                          : gradeMetricType === 'gpa'
                            ? 'e.g. 3.5 or 8.25'
                            : 'e.g. A+, First Class'
                      }
                      className={`${inputClassName} ${gradeFormatError ? 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500' : ''}`}
                    />
                  </div>
                  {gradeInput.trim().length > 0 && gradeFormatError ? (
                    <p className="mt-1 text-xs text-red-600">{gradeFormatError}</p>
                  ) : null}
                </div>

                {/* Mode of Study */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode of Study
                  </label>
                  <select
                    value={modeOfStudy}
                    onChange={(e) => setModeOfStudy(e.target.value)}
                    className={selectClassName}
                  >
                    <option value="">Select Mode of Study</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Online">Online</option>
                    <option value="Distance Learning">Distance Learning</option>
                  </select>
                </div>

                {/* Course Duration — auto-filled from dates; editable */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Duration (years)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      value={courseDuration}
                      onChange={(e) => handleCourseDurationChange(e.target.value)}
                      placeholder="e.g. 3.75"
                      className={`${inputClassName} ${
                        (effectiveCourseDuration.length > 0 && !isCourseDurationNumeric)
                          ? 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'
                          : ''
                      }`}
                    />
                    {computedDurationPreview &&
                      durationManuallyEdited &&
                      courseDuration.trim() !== computedDurationPreview && (
                      <button
                        type="button"
                        onClick={handleRecalculateDuration}
                        className="shrink-0 rounded-lg border border-blue-200 bg-blue-50 px-3 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        title="Reset to value calculated from your dates"
                      >
                        Use calculated
                      </button>
                    )}
                  </div>
                  {effectiveCourseDuration && isCourseDurationNumeric ? (
                    <p className="mt-1 text-xs text-slate-600">
                      {formatCourseDurationDisplay(effectiveCourseDuration)}
                      {durationManuallyEdited ? ' (edited)' : ' (from dates)'}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-slate-500">
                    {currentlyStudying && startYear && startMonth
                      ? `Auto-filled from ${formatEducationPeriod(startYear, startMonth, '', '', true).split(' – ')[0]} to today. You can edit if needed.`
                      : startYear && startMonth && endYear && endMonth
                        ? `Auto-filled from ${formatEducationPeriod(startYear, startMonth, endYear, endMonth, false)}. You can edit if needed.`
                        : 'Select start and end dates to auto-fill, or enter duration in years manually.'}
                  </p>
                  {effectiveCourseDuration.length > 0 && !isCourseDurationNumeric && (
                    <p className="mt-1 text-xs text-red-600">
                      Enter a valid number of years (up to 2 decimals).
                    </p>
                  )}
                </div>
              </div>
              ) : null}

              {/* Upload Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Education Certificates/Documents{' '}
                </label>
                
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  className="hidden"
                />

                {/* Drag and drop area */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full px-4 py-6 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className="text-sm text-center text-gray-600">
                      <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF, PNG, JPG (Max 5MB per file)</p>
                  </div>
                </div>

                {/* Display uploaded files */}
                {documents.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Uploaded Documents ({documents.length})
                    </p>
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <svg
                            className="w-5 h-5 text-gray-400 shrink-0"
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
                          <span className="text-sm text-gray-700 truncate">{doc.name}</span>
                          {doc.size && (
                            <span className="text-xs text-gray-500">
                              ({(doc.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
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
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(doc.id)}
                          className="ml-2 p-1 text-red-600 hover:text-amber-700 hover:bg-red-50 rounded transition-colors"
                          aria-label="Remove file"
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

              {(hasDateOrderError || hasNumericError) && (
                <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                  <p className="text-xs font-medium text-amber-700">
                    Please fix validation errors before saving.
                  </p>
                  {hasDateOrderError && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      End date cannot be before start date.
                    </p>
                  )}
                  {hasNumericError && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      {[
                        gradeFormatError,
                        effectiveCourseDuration.length > 0 && !isCourseDurationNumeric
                          ? 'Course duration could not be calculated from the selected years.'
                          : null,
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                  )}
                </div>
              )}
            </div>

    </ProfileDrawer>
  );
}
