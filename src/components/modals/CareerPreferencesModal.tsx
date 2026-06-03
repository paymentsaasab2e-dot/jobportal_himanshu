'use client';

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { API_BASE_URL } from '@/lib/api-base';
import ProfileDatePicker from '@/components/profile/ProfileDatePicker';
import ProfileDrawer from '../ui/ProfileDrawer';
import { profileFieldClass } from '@/lib/profile-modal-ui';
import {
  type CitySuggestion,
  formatCitySuggestionLabel,
  searchCitySuggestions,
} from '@/lib/geo-locations';

interface CareerPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CareerPreferencesData) => void;
  initialData?: CareerPreferencesData;
  currentRole?: string;
}

export interface CareerPreferencesData {
  currentRole?: string;
  preferredJobTitles: string[];
  preferredRoles?: string[];
  preferredIndustries: string[];
  functionalAreas: string[];
  preferredIndustry?: string;
  functionalArea?: string;
  jobTypes: string[];
  workModes: string[];
  preferredWorkMode?: string;
  preferredLocations: string[];
  relocationPreference: string;
  salaryCurrency: string;
  salaryAmount: string;
  salaryFrequency: string;
  preferredCurrency?: string;
  preferredSalary?: string;
  preferredSalaryType?: string;
  preferredBenefits?: string[];
  currentCurrency?: string;
  currentSalaryType?: string;
  currentSalary?: string;
  currentLocation?: string;
  currentBenefits?: string[];
  availabilityToStart: string;
  noticePeriod?: string;
  passportNumbersByLocation?: Record<string, string>;
}

const INDUSTRIES = [
  'IT',
  'Finance',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Retail',
  'Real Estate',
  'Consulting',
  'Media & Entertainment',
  'Telecommunications',
  'Energy',
  'Transportation',
  'Other',
] as const;

const INDUSTRIES_PRESET = INDUSTRIES.filter((i) => i !== 'Other');

const FUNCTIONAL_AREAS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
  'Product Management',
  'Design',
  'Data Science',
  'Customer Support',
  'Business Development',
  'Other',
] as const;

const FUNCTIONAL_AREAS_PRESET = FUNCTIONAL_AREAS.filter((a) => a !== 'Other');

const JOB_TYPES = ['Full-time', 'Contract', 'Part-time', 'Freelance', 'Internship'] as const;
const WORK_MODE_OPTIONS = ['Remote', 'On-site', 'Hybrid'] as const;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY'] as const;
const SALARY_TYPES = ['Annual', 'Monthly', 'Hourly', 'Daily'] as const;
const RELOCATION_OPTIONS = [
  'Open to Relocate',
  'Not Open to Relocate',
  'Open to Remote Only',
] as const;
const NOTICE_PERIOD_OPTIONS = ['15 days', '30 days', '45 days', '60 days', '90 days', 'Negotiable'] as const;
const DEFAULT_BENEFIT_OPTIONS = [
  'Family Accommodation',
  'Bachelor Accommodation',
  'Food Allowance',
  'Car Allowance',
  'Fuel and Driver',
  'Medical',
  'Visa',
  'Travel and Tickets',
  'Additional Benefits',
] as const;
const QUICK_ROLE_CHIPS = [
  'Software Developer',
  'Tech Lead',
  'Product Manager',
  'Data Scientist',
  'DevOps Engineer',
  'Business Analyst',
] as const;

function uniqueStrings(values: Iterable<string>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = String(value || '').trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }
  return result;
}

function normalizeSalaryTypeLabel(value: unknown): string {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!raw) return '';
  if (raw === 'ANNUAL' || raw === 'ANNUALLY') return 'Annual';
  if (raw === 'MONTHLY') return 'Monthly';
  if (raw === 'HOURLY') return 'Hourly';
  if (raw === 'DAILY') return 'Daily';
  return String(value).trim();
}

function normalizeWorkModeLabel(value: unknown): string {
  const raw = String(value ?? '').trim().toUpperCase();
  if (!raw) return '';
  if (raw === 'REMOTE') return 'Remote';
  if (raw === 'ON_SITE' || raw === 'ONSITE') return 'On-site';
  if (raw === 'HYBRID') return 'Hybrid';
  return String(value).trim();
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map((item) => String(item)));
  }
  return parsePreferenceList(value);
}

function parsePassportNumbersByLocation(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([location, passport]) => [String(location).trim(), String(passport ?? '').trim()] as const)
    .filter(([location]) => Boolean(location));
  return Object.fromEntries(entries);
}

/** Load saved `availabilityToStart`: `YYYY-MM-DD — note`, pure ISO date, or free text. */
function parseAvailabilityManual(saved: string | undefined): { date: string; text: string } {
  const s = (saved || '').trim();
  if (!s) return { date: '', text: '' };
  const combined = /^(\d{4}-\d{2}-\d{2})\s*—\s*(.+)$/.exec(s);
  if (combined) return { date: combined[1], text: combined[2].trim() };
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { date: s, text: '' };
  return { date: '', text: s };
}

/** Save: text if present; else calendar date; both -> `YYYY-MM-DD — note`. */
function mergeAvailabilityManual(date: string, text: string): string {
  const t = text.trim();
  const d = date.trim();
  if (t && d) return `${d} — ${t}`;
  if (t) return t;
  if (d) return d;
  return '';
}

function buildBenefitOptions(data?: CareerPreferencesData): string[] {
  return uniqueStrings([
    ...DEFAULT_BENEFIT_OPTIONS,
    ...(data?.currentBenefits || []),
    ...(data?.preferredBenefits || []),
  ]);
}

export function parsePreferenceList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map(String));
  }
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return [];
  return uniqueStrings(s.split(/[,;|]\s*/));
}

export function normalizeCareerPreferencesFromApi(raw: unknown): CareerPreferencesData | undefined {
  if (raw === null || raw === undefined || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const preferredIndustries = parsePreferenceList(r.preferredIndustries ?? r.preferredIndustry);
  const functionalAreas = parsePreferenceList(r.functionalAreas ?? r.functionalArea);
  const preferredJobTitles = parseStringArray(r.preferredJobTitles ?? r.preferredRoles);
  const preferredWorkMode = normalizeWorkModeLabel(r.preferredWorkMode);
  const workModes = uniqueStrings(
    parseStringArray(r.workModes).map((mode) => normalizeWorkModeLabel(mode)).filter(Boolean),
  );
  const normalizedWorkModes = workModes.length > 0 ? workModes : preferredWorkMode ? [preferredWorkMode] : [];
  // Passport numbers are intentionally not handled in this drawer UI.
  // Keep preferredLocations strictly from preferredLocations only.
  const preferredLocations = uniqueStrings([...parseStringArray(r.preferredLocations)]);
  const preferredCurrency = String(r.preferredCurrency ?? r.salaryCurrency ?? 'USD');
  const preferredSalary = String(r.preferredSalary ?? r.salaryAmount ?? '');
  const preferredSalaryType = normalizeSalaryTypeLabel(r.preferredSalaryType ?? r.salaryFrequency);
  const currentRole = String(r.currentRole ?? r.currentTitle ?? r.designation ?? '').trim();
  return {
    currentRole: currentRole || undefined,
    preferredJobTitles,
    preferredRoles: preferredJobTitles,
    preferredIndustries,
    functionalAreas,
    preferredIndustry: preferredIndustries.length ? preferredIndustries.join('; ') : undefined,
    functionalArea: functionalAreas.length ? functionalAreas.join('; ') : undefined,
    jobTypes: parseStringArray(r.jobTypes),
    workModes: normalizedWorkModes,
    preferredWorkMode: preferredWorkMode || normalizedWorkModes[0] || '',
    preferredLocations,
    relocationPreference: String(r.relocationPreference ?? ''),
    salaryCurrency: preferredCurrency,
    salaryAmount: preferredSalary,
    salaryFrequency: preferredSalaryType,
    preferredCurrency,
    preferredSalary,
    preferredSalaryType,
    preferredBenefits: parseStringArray(r.preferredBenefits),
    currentCurrency: String(r.currentCurrency ?? ''),
    currentSalaryType: normalizeSalaryTypeLabel(r.currentSalaryType),
    currentSalary: String(r.currentSalary ?? ''),
    currentLocation: String(r.currentLocation ?? ''),
    currentBenefits: parseStringArray(r.currentBenefits),
    availabilityToStart: String(r.availabilityToStart ?? ''),
    noticePeriod: r.noticePeriod ? String(r.noticePeriod) : undefined,
  };
}

export default function CareerPreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  currentRole,
}: CareerPreferencesModalProps) {
  const [preferredJobTitles, setPreferredJobTitles] = useState<string[]>([]);
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState<string[]>([]);
  const [jobTitleSuggestLoading, setJobTitleSuggestLoading] = useState(false);
  const [jobTitleSuggestError, setJobTitleSuggestError] = useState<string | null>(null);
  const [jobTitleSuggestOpen, setJobTitleSuggestOpen] = useState(false);
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>([]);
  const [functionalAreas, setFunctionalAreas] = useState<string[]>([]);
  const [industryCustomInput, setIndustryCustomInput] = useState('');
  const [functionalAreaCustomInput, setFunctionalAreaCustomInput] = useState('');
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [preferredWorkModes, setPreferredWorkModes] = useState<string[]>([]);
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState('');
  const [relocationPreference, setRelocationPreference] = useState('');

  const [currentCurrency, setCurrentCurrency] = useState('USD');
  const [currentRoleValue, setCurrentRoleValue] = useState('');
  const [currentSalaryType, setCurrentSalaryType] = useState('');
  const [currentSalary, setCurrentSalary] = useState('');
  const [currentLocation, setCurrentLocation] = useState('');
  const [currentBenefits, setCurrentBenefits] = useState<string[]>([]);
  const currentLocationAutocompleteRef = useRef<HTMLDivElement>(null);
  const [currentLocationSuggestions, setCurrentLocationSuggestions] = useState<CitySuggestion[]>([]);
  const [currentLocationSuggestOpen, setCurrentLocationSuggestOpen] = useState(false);
  const [currentLocationHighlight, setCurrentLocationHighlight] = useState(-1);

  const [preferredCurrency, setPreferredCurrency] = useState('USD');
  const [preferredSalaryType, setPreferredSalaryType] = useState('');
  const [preferredSalary, setPreferredSalary] = useState('');
  const [preferredBenefits, setPreferredBenefits] = useState<string[]>([]);

  const [availabilityDate, setAvailabilityDate] = useState('');
  const [availabilityText, setAvailabilityText] = useState('');
  const [noticePeriod, setNoticePeriod] = useState('');

  const [benefitOptions, setBenefitOptions] = useState<string[]>(() => buildBenefitOptions(initialData));
  const [showCurrentBenefitInput, setShowCurrentBenefitInput] = useState(false);
  const [currentBenefitInput, setCurrentBenefitInput] = useState('');
  const [showPreferredBenefitInput, setShowPreferredBenefitInput] = useState(false);
  const [preferredBenefitInput, setPreferredBenefitInput] = useState('');

  const locationAutocompleteRef = useRef<HTMLDivElement>(null);
  const locationSuggestOpenRef = useRef(false);
  const locationSuggestUserInitiatedRef = useRef(false);
  const [locationSuggestions, setLocationSuggestions] = useState<CitySuggestion[]>([]);
  const [locationSuggestLoading, setLocationSuggestLoading] = useState(false);
  const [locationSuggestError, setLocationSuggestError] = useState<string | null>(null);
  const [locationSuggestOpen, setLocationSuggestOpen] = useState(false);
  const [locationHighlight, setLocationHighlight] = useState(-1);

  const resetLocationSuggestState = useCallback(() => {
    setLocationSuggestions([]);
    setLocationSuggestLoading(false);
    setLocationSuggestError(null);
    setLocationSuggestOpen(false);
    setLocationHighlight(-1);
  }, []);

  const addPreferredLocationValue = useCallback((value: string) => {
    const location = value.trim();
    if (!location) return;
    setPreferredLocations((prev) =>
      prev.some((item) => item.toLowerCase() === location.toLowerCase()) ? prev : [...prev, location],
    );
  }, []);

  const applyLocationSuggestion = useCallback(
    (suggestion: CitySuggestion) => {
      locationSuggestUserInitiatedRef.current = false;
      addPreferredLocationValue(formatCitySuggestionLabel(suggestion));
      setLocationInput('');
      resetLocationSuggestState();
    },
    [addPreferredLocationValue, resetLocationSuggestState],
  );

  const resetCurrentLocationSuggestState = useCallback(() => {
    setCurrentLocationSuggestions([]);
    setCurrentLocationSuggestOpen(false);
    setCurrentLocationHighlight(-1);
  }, []);

  const updateCurrentLocationSuggestions = useCallback((value: string) => {
    const query = value.trim();
    if (query.length < 2) {
      resetCurrentLocationSuggestState();
      return;
    }

    const list = searchCitySuggestions(query);
    setCurrentLocationSuggestions(list);
    setCurrentLocationSuggestOpen(list.length > 0);
    setCurrentLocationHighlight(list.length > 0 ? 0 : -1);
  }, [resetCurrentLocationSuggestState]);

  const applyCurrentLocationSuggestion = useCallback((suggestion: CitySuggestion) => {
    setCurrentLocation(formatCitySuggestionLabel(suggestion));
    resetCurrentLocationSuggestState();
  }, [resetCurrentLocationSuggestState]);

  function resetForm() {
    setPreferredJobTitles([]);
    setJobTitleInput('');
    setPreferredIndustries([]);
    setFunctionalAreas([]);
    setIndustryCustomInput('');
    setFunctionalAreaCustomInput('');
    setJobTypes([]);
    setPreferredWorkModes([]);
    setPreferredLocations([]);
    setLocationInput('');
    setRelocationPreference('');
    setCurrentCurrency('USD');
    setCurrentRoleValue('');
    setCurrentSalaryType('');
    setCurrentSalary('');
    setCurrentLocation('');
    setCurrentBenefits([]);
    resetCurrentLocationSuggestState();
    setPreferredCurrency('USD');
    setPreferredSalaryType('');
    setPreferredSalary('');
    setPreferredBenefits([]);
    setAvailabilityDate('');
    setAvailabilityText('');
    setNoticePeriod('');
    setBenefitOptions(buildBenefitOptions());
    setShowCurrentBenefitInput(false);
    setCurrentBenefitInput('');
    setShowPreferredBenefitInput(false);
    setPreferredBenefitInput('');
    locationSuggestUserInitiatedRef.current = false;
    resetLocationSuggestState();
  }

  function applyInitialData(data?: CareerPreferencesData) {
    if (!data) {
      resetForm();
      setCurrentRoleValue((currentRole || '').trim());
      return;
    }
    const preferredRoles = uniqueStrings(data.preferredJobTitles || data.preferredRoles || []);
    const availability = parseAvailabilityManual(data.availabilityToStart);
    setPreferredJobTitles(preferredRoles);
    setJobTitleInput('');
    setPreferredIndustries(parsePreferenceList(data.preferredIndustries ?? data.preferredIndustry));
    setFunctionalAreas(parsePreferenceList(data.functionalAreas ?? data.functionalArea));
    setIndustryCustomInput('');
    setFunctionalAreaCustomInput('');
    setJobTypes(data.jobTypes || []);
    setPreferredWorkModes(
      uniqueStrings(
        [
          ...(Array.isArray(data.workModes) ? data.workModes : []),
          data.preferredWorkMode || '',
        ]
          .map((mode) => normalizeWorkModeLabel(mode))
          .filter(Boolean),
      ),
    );
    setPreferredLocations(data.preferredLocations || []);
    setLocationInput('');
    setRelocationPreference(data.relocationPreference || '');
    setCurrentRoleValue((data.currentRole || currentRole || '').trim());
    setCurrentCurrency(data.currentCurrency || 'USD');
    setCurrentSalaryType(data.currentSalaryType || '');
    setCurrentSalary(data.currentSalary || '');
    setCurrentLocation(data.currentLocation || '');
    setCurrentBenefits(data.currentBenefits || []);
    resetCurrentLocationSuggestState();
    setPreferredCurrency(data.preferredCurrency || data.salaryCurrency || 'USD');
    setPreferredSalaryType(data.preferredSalaryType || data.salaryFrequency || '');
    setPreferredSalary(data.preferredSalary || data.salaryAmount || '');
    setPreferredBenefits(data.preferredBenefits || []);
    setAvailabilityDate(availability.date);
    setAvailabilityText(availability.text);
    setNoticePeriod(data.noticePeriod || '');
    setBenefitOptions(buildBenefitOptions(data));
    setShowCurrentBenefitInput(false);
    setCurrentBenefitInput('');
    setShowPreferredBenefitInput(false);
    setPreferredBenefitInput('');
    locationSuggestUserInitiatedRef.current = false;
    resetLocationSuggestState();
  }

  useEffect(() => {
    if (!isOpen) return;
    applyInitialData(initialData);
  }, [currentRole, initialData, isOpen, resetLocationSuggestState]);

  useEffect(() => {
    if (!isOpen) {
      setJobTitleSuggestions([]);
      setJobTitleSuggestLoading(false);
      setJobTitleSuggestError(null);
      return;
    }

    const query = jobTitleInput.trim();
    if (query.length < 2) {
      setJobTitleSuggestions([]);
      setJobTitleSuggestLoading(false);
      setJobTitleSuggestError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setJobTitleSuggestLoading(true);
        setJobTitleSuggestError(null);

        const response = await fetch(`${API_BASE_URL}/ai/job-title-suggestions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            query,
            selectedTitles: preferredJobTitles,
          }),
        });

        const result = await response.json();
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to load role suggestions');
        }

        setJobTitleSuggestions(
          Array.isArray(result?.data?.suggestions)
            ? result.data.suggestions.filter((title: unknown) => typeof title === 'string')
            : [],
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        setJobTitleSuggestions([]);
        setJobTitleSuggestError('Unable to load suggestions right now.');
      } finally {
        setJobTitleSuggestLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [isOpen, jobTitleInput, preferredJobTitles]);

  useEffect(() => {
    locationSuggestOpenRef.current = locationSuggestOpen;
  }, [locationSuggestOpen]);

  useEffect(() => {
    if (!locationSuggestOpen) return;
    const handleDown = (event: MouseEvent) => {
      if (
        locationAutocompleteRef.current &&
        !locationAutocompleteRef.current.contains(event.target as Node)
      ) {
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
    if (currentLocationHighlight < 0 || !currentLocationAutocompleteRef.current) return;
    const node = currentLocationAutocompleteRef.current.querySelector(
      `[data-current-location-suggest-index="${currentLocationHighlight}"]`,
    );
    node?.scrollIntoView({ block: 'nearest' });
  }, [currentLocationHighlight]);

  useEffect(() => {
    if (!currentLocationSuggestOpen) return;
    const handleDown = (event: MouseEvent) => {
      if (
        currentLocationAutocompleteRef.current &&
        !currentLocationAutocompleteRef.current.contains(event.target as Node)
      ) {
        setCurrentLocationSuggestOpen(false);
        setCurrentLocationHighlight(-1);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [currentLocationSuggestOpen]);

  useEffect(() => {
    if (!isOpen) {
      resetLocationSuggestState();
      return;
    }
    if (!locationSuggestUserInitiatedRef.current) {
      resetLocationSuggestState();
      return;
    }

    const query = locationInput.trim();
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
  }, [locationInput, isOpen, resetLocationSuggestState]);

  const addJobTitleFromInput = (titleOverride?: string) => {
    const title = String(titleOverride ?? jobTitleInput).trim();
    if (!title) return;
    setPreferredJobTitles((prev) => uniqueStrings([...prev, title]));
    setJobTitleInput('');
    setJobTitleSuggestOpen(false);
    setJobTitleSuggestions([]);
    setJobTitleSuggestError(null);
  };

  const handleAddJobTitle = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const topSuggestion = jobTitleSuggestions[0];
      if (topSuggestion && jobTitleInput.trim().length >= 2) {
        addJobTitleFromInput(topSuggestion);
      } else {
        addJobTitleFromInput();
      }
    }
  };

  const handleSelectSuggestedJobTitle = (title: string) => {
    addJobTitleFromInput(title);
  };

  const handleRemoveJobTitle = (title: string) => {
    setPreferredJobTitles((prev) => prev.filter((item) => item !== title));
  };

  const handleAddLocation = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!locationSuggestOpen && locationSuggestions.length > 0) setLocationSuggestOpen(true);
      if (locationSuggestOpen && locationSuggestions.length > 0) {
        e.preventDefault();
        setLocationHighlight((i) => Math.min(i + 1, locationSuggestions.length - 1));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (locationSuggestOpen && locationSuggestions.length > 0) {
        e.preventDefault();
        setLocationHighlight((i) => Math.max(i - 1, 0));
      }
      return;
    }

    if (e.key === 'Escape' && locationSuggestOpen) {
      e.preventDefault();
      setLocationSuggestOpen(false);
      setLocationHighlight(-1);
      return;
    }

    if (e.key === 'Tab' && locationSuggestOpen && locationSuggestions.length > 0) {
      const pick =
        locationHighlight >= 0 && locationSuggestions[locationHighlight]
          ? locationSuggestions[locationHighlight]
          : locationSuggestions[0];
      if (pick) applyLocationSuggestion(pick);
      return;
    }

    if (e.key === 'Enter' && locationInput.trim()) {
      e.preventDefault();
      if (locationSuggestOpen && locationSuggestions.length > 0) {
        const pick =
          locationHighlight >= 0 && locationSuggestions[locationHighlight]
            ? locationSuggestions[locationHighlight]
            : locationSuggestions[0];
        if (pick) {
          applyLocationSuggestion(pick);
        }
        return;
      }
      addPreferredLocationValue(locationInput);
      setLocationInput('');
      resetLocationSuggestState();
      locationSuggestUserInitiatedRef.current = false;
    }
  };

  const handleRemoveLocation = (location: string) => {
    setPreferredLocations((prev) => prev.filter((item) => item !== location));
    setPassportNumbersByLocation((prev) => {
      const next = { ...prev };
      delete next[location];
      return next;
    });
  };

  const handleCurrentLocationKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      if (!currentLocationSuggestOpen && currentLocationSuggestions.length > 0) {
        setCurrentLocationSuggestOpen(true);
      }
      if (currentLocationSuggestions.length > 0) {
        e.preventDefault();
        setCurrentLocationHighlight((index) => Math.min(index + 1, currentLocationSuggestions.length - 1));
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (currentLocationSuggestions.length > 0) {
        e.preventDefault();
        setCurrentLocationHighlight((index) => Math.max(index - 1, 0));
      }
      return;
    }

    if (e.key === 'Escape' && currentLocationSuggestOpen) {
      e.preventDefault();
      setCurrentLocationSuggestOpen(false);
      setCurrentLocationHighlight(-1);
      return;
    }

    if ((e.key === 'Enter' || e.key === 'Tab') && currentLocationSuggestOpen && currentLocationSuggestions.length > 0) {
      const pick =
        currentLocationHighlight >= 0 && currentLocationSuggestions[currentLocationHighlight]
          ? currentLocationSuggestions[currentLocationHighlight]
          : currentLocationSuggestions[0];
      if (pick) {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
        applyCurrentLocationSuggestion(pick);
      }
    }
  };

  const togglePreferredIndustry = (name: string) => {
    setPreferredIndustries((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  };

  const addCustomIndustry = () => {
    const value = industryCustomInput.trim();
    if (!value) return;
    setPreferredIndustries((prev) => uniqueStrings([...prev, value]));
    setIndustryCustomInput('');
  };

  const removePreferredIndustry = (name: string) => {
    setPreferredIndustries((prev) => prev.filter((item) => item !== name));
  };

  const toggleFunctionalArea = (name: string) => {
    setFunctionalAreas((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name],
    );
  };

  const addCustomFunctionalArea = () => {
    const value = functionalAreaCustomInput.trim();
    if (!value) return;
    setFunctionalAreas((prev) => uniqueStrings([...prev, value]));
    setFunctionalAreaCustomInput('');
  };

  const removeFunctionalArea = (name: string) => {
    setFunctionalAreas((prev) => prev.filter((item) => item !== name));
  };

  const toggleJobType = (value: string) => {
    setJobTypes((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const togglePreferredWorkMode = (value: string) => {
    setPreferredWorkModes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value],
    );
  };

  const toggleBenefit = (
    benefit: string,
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setSelected(
      selected.includes(benefit)
        ? selected.filter((item) => item !== benefit)
        : [...selected, benefit],
    );
  };

  const addCustomBenefit = (
    benefit: string,
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    closeInput: () => void,
    clearInput: () => void,
  ) => {
    const value = benefit.trim();
    if (!value) return;
    setBenefitOptions((prev) => uniqueStrings([...prev, value]));
    setSelected((prev) => uniqueStrings([...prev, value]));
    clearInput();
    closeInput();
  };

  const handleSave = () => {
    onSave({
      currentRole: currentRoleValue.trim() || undefined,
      preferredJobTitles,
      preferredRoles: preferredJobTitles,
      preferredIndustries,
      functionalAreas,
      preferredIndustry: preferredIndustries.length ? preferredIndustries.join('; ') : undefined,
      functionalArea: functionalAreas.length ? functionalAreas.join('; ') : undefined,
      jobTypes,
      workModes: preferredWorkModes,
      preferredWorkMode: preferredWorkModes[0] || undefined,
      preferredLocations,
      relocationPreference,
      salaryCurrency: preferredCurrency,
      salaryAmount: preferredSalary,
      salaryFrequency: preferredSalaryType,
      preferredCurrency,
      preferredSalary,
      preferredSalaryType,
      preferredBenefits,
      currentCurrency,
      currentSalaryType,
      currentSalary,
      currentLocation,
      currentBenefits,
      availabilityToStart: mergeAvailabilityManual(availabilityDate, availabilityText),
      noticePeriod: noticePeriod || undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Career Preferences"
      widthClassName="w-full md:w-[60vw] md:max-w-[60vw]"
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
            Save Preferences
          </button>
        </div>
      )}
    >
      <div className="space-y-8">
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current & Preferred Package</h3>
            <p className="mt-1 text-sm text-gray-500">
              Based on your reference salary section, this stores both current package details and preferred package details.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h4 className="mb-4 text-base font-semibold text-gray-900">Current Package</h4>
              <div className="space-y-4">
                <PackageTextField
                  label="Current Role"
                  value={currentRoleValue}
                  onChange={setCurrentRoleValue}
                />
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <PackageSelectField
                    label="Currency"
                    value={currentCurrency}
                    onChange={setCurrentCurrency}
                    options={CURRENCIES}
                  />
                  <PackageSelectField
                    label="Salary Type"
                    value={currentSalaryType}
                    onChange={setCurrentSalaryType}
                    options={SALARY_TYPES}
                  />
                </div>
                <PackageTextField
                  label="Current Salary"
                  value={currentSalary}
                  onChange={setCurrentSalary}
                  type="number"
                />
                <div>
                  <div className="relative" ref={currentLocationAutocompleteRef}>
                    <PackageTextField
                      label="Current Location"
                      value={currentLocation}
                      onChange={(value) => {
                        setCurrentLocation(value);
                        updateCurrentLocationSuggestions(value);
                      }}
                      onFocus={() => updateCurrentLocationSuggestions(currentLocation)}
                      onBlur={() => {
                        window.setTimeout(() => {
                          setCurrentLocationSuggestOpen(false);
                          setCurrentLocationHighlight(-1);
                        }, 150);
                      }}
                      onKeyDown={handleCurrentLocationKeyDown}
                    />
                    {currentLocationSuggestOpen ? (
                      <div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-[min(280px,50vh)] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                        {currentLocationSuggestions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-slate-500">
                            No locations found. You can still type manually.
                          </div>
                        ) : (
                          currentLocationSuggestions.map((suggestion, idx) => (
                            <button
                              key={`${suggestion.countryCode}-${suggestion.stateCode}-${suggestion.value}-${idx}`}
                              type="button"
                              data-current-location-suggest-index={idx}
                              onMouseEnter={() => setCurrentLocationHighlight(idx)}
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => applyCurrentLocationSuggestion(suggestion)}
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                                currentLocationHighlight === idx ? 'bg-gray-50' : ''
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
                    Start typing a city or country and select a suggested location.
                  </p>
                </div>
                <BenefitSelector
                  title="Benefits"
                  options={benefitOptions}
                  selected={currentBenefits}
                  onToggle={(benefit) => toggleBenefit(benefit, currentBenefits, setCurrentBenefits)}
                  showAddInput={showCurrentBenefitInput}
                  onShowAddInput={setShowCurrentBenefitInput}
                  customValue={currentBenefitInput}
                  onCustomValueChange={setCurrentBenefitInput}
                  onAddCustom={() =>
                    addCustomBenefit(
                      currentBenefitInput,
                      setCurrentBenefits,
                      () => setShowCurrentBenefitInput(false),
                      () => setCurrentBenefitInput(''),
                    )
                  }
                  onCancelAdd={() => {
                    setShowCurrentBenefitInput(false);
                    setCurrentBenefitInput('');
                  }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h4 className="mb-4 text-base font-semibold text-gray-900">Preferred Package</h4>
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Preferred Role</label>
                  {preferredJobTitles.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {preferredJobTitles.map((title) => (
                        <span
                          key={title}
                          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-gray-900"
                        >
                          {title}
                          <button
                            type="button"
                            onClick={() => handleRemoveJobTitle(title)}
                            className="text-[#9095A1] hover:text-gray-600"
                            aria-label={`Remove ${title}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <div className="relative min-w-0 flex-1">
                      <input
                        type="text"
                        value={jobTitleInput}
                        onChange={(e) => {
                          setJobTitleInput(e.target.value);
                          setJobTitleSuggestOpen(true);
                        }}
                        onFocus={() => setJobTitleSuggestOpen(true)}
                        onBlur={() => {
                          window.setTimeout(() => setJobTitleSuggestOpen(false), 120);
                        }}
                        onKeyDown={handleAddJobTitle}
                        placeholder="Type preferred role (e.g. Software Engineer)"
                        className={`${profileFieldClass()} w-full`}
                      />
                      {jobTitleSuggestOpen && jobTitleInput.trim().length >= 2 ? (
                        jobTitleSuggestLoading ? (
                          <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
                            Loading AI suggestions...
                          </div>
                        ) : jobTitleSuggestions.length > 0 ? (
                          <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                            {jobTitleSuggestions.map((role) => (
                              <button
                                key={role}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleSelectSuggestedJobTitle(role)}
                                className="block w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-blue-50"
                              >
                                {role}
                              </button>
                            ))}
                          </div>
                        ) : jobTitleSuggestError ? (
                          <div className="absolute z-20 mt-1 w-full rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 shadow-lg">
                            {jobTitleSuggestError}
                          </div>
                        ) : null
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => addJobTitleFromInput()}
                      disabled={!jobTitleInput.trim()}
                      className="h-10 shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    Suggestions are powered by OpenAI based on what you type. Press Enter to add the top match.
                  </p>
                  {jobTitleInput.trim().length < 2 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {QUICK_ROLE_CHIPS.filter((role) => !preferredJobTitles.includes(role)).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleSelectSuggestedJobTitle(role)}
                          className="inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <PackageSelectField
                    label="Currency"
                    value={preferredCurrency}
                    onChange={setPreferredCurrency}
                    options={CURRENCIES}
                  />
                  <PackageSelectField
                    label="Salary Type"
                    value={preferredSalaryType}
                    onChange={setPreferredSalaryType}
                    options={SALARY_TYPES}
                  />
                </div>
                <PackageTextField
                  label="Preferred Salary"
                  value={preferredSalary}
                  onChange={setPreferredSalary}
                  type="number"
                />

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Preferred Locations
                  </label>
                  {preferredLocations.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-2">
                      {preferredLocations.map((location) => (
                        <span
                          key={location}
                          className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-gray-900"
                        >
                          {location}
                          <button
                            type="button"
                            onClick={() => handleRemoveLocation(location)}
                            className="text-[#9095A1] hover:text-gray-600"
                            aria-label={`Remove ${location}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="relative" ref={locationAutocompleteRef}>
                    <input
                      type="text"
                      value={locationInput}
                      autoComplete="off"
                      onChange={(e) => {
                        locationSuggestUserInitiatedRef.current = true;
                        setLocationInput(e.target.value);
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
                      onKeyDown={handleAddLocation}
                      className={`${profileFieldClass()} w-full`}
                    />
                    {locationSuggestOpen ? (
                      <div className="absolute left-0 top-[calc(100%+6px)] z-50 max-h-[min(280px,50vh)] w-full overflow-y-auto rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                        {locationSuggestLoading ? (
                          <div className="px-3 py-2 text-sm text-slate-500">Searching...</div>
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
                              onMouseDown={(event) => event.preventDefault()}
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
                  {/* Passport number per location is removed from this drawer UI. */}
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <h4 className="mb-2 text-sm font-semibold text-gray-900">Preferred Work Mode</h4>
                  <p className="mb-3 text-xs text-gray-500">Select one or more work modes.</p>
                  <div className="space-y-2">
                    {WORK_MODE_OPTIONS.map((mode) => (
                      <label key={mode} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={preferredWorkModes.includes(mode)}
                          onChange={() => togglePreferredWorkMode(mode)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{mode}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <BenefitSelector
                  title="Benefits"
                  options={benefitOptions}
                  selected={preferredBenefits}
                  onToggle={(benefit) => toggleBenefit(benefit, preferredBenefits, setPreferredBenefits)}
                  showAddInput={showPreferredBenefitInput}
                  onShowAddInput={setShowPreferredBenefitInput}
                  customValue={preferredBenefitInput}
                  onCustomValueChange={setPreferredBenefitInput}
                  onAddCustom={() =>
                    addCustomBenefit(
                      preferredBenefitInput,
                      setPreferredBenefits,
                      () => setShowPreferredBenefitInput(false),
                      () => setPreferredBenefitInput(''),
                    )
                  }
                  onCancelAdd={() => {
                    setShowPreferredBenefitInput(false);
                    setPreferredBenefitInput('');
                  }}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Role & Domain</h3>
            <p className="mt-1 text-sm text-gray-500">
              Target roles, industries, and functional areas help tailor matching and recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PreferenceMultiSelectCard
              title="Preferred Industries"
              description="Select all that apply. Add custom industries below."
              selected={preferredIndustries}
              presetOptions={INDUSTRIES_PRESET}
              customValue={industryCustomInput}
              onCustomChange={setIndustryCustomInput}
              onToggle={togglePreferredIndustry}
              onRemove={removePreferredIndustry}
              onAddCustom={addCustomIndustry}
              placeholder="Other industry"
              tone="blue"
            />
            <PreferenceMultiSelectCard
              title="Functional Areas"
              description="Select all that apply. Add custom areas below."
              selected={functionalAreas}
              presetOptions={FUNCTIONAL_AREAS_PRESET}
              customValue={functionalAreaCustomInput}
              onCustomChange={setFunctionalAreaCustomInput}
              onToggle={toggleFunctionalArea}
              onRemove={removeFunctionalArea}
              onAddCustom={addCustomFunctionalArea}
              placeholder="Other functional area"
              tone="purple"
            />
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Job Types</h3>
            <div className="space-y-2">
              {JOB_TYPES.map((jobType) => (
                <label key={jobType} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={jobTypes.includes(jobType)}
                    onChange={() => toggleJobType(jobType)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{jobType}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Relocation</h3>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Relocation Preference
            </label>
            <select
              value={relocationPreference}
              onChange={(e) => setRelocationPreference(e.target.value)}
              className={`${profileFieldClass()} appearance-none bg-white`}
            >
              <option value="">Select Preference</option>
              {RELOCATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Availability</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Earliest Start Date
              </label>
              <ProfileDatePicker
                value={availabilityDate}
                onChange={setAvailabilityDate}
                aria-label="Open calendar to choose earliest start date"
              />
              {availabilityDate ? (
                <button
                  type="button"
                  onClick={() => setAvailabilityDate('')}
                  className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                >
                  Clear date
                </button>
              ) : null}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Notice Period
              </label>
              <select
                value={noticePeriod}
                onChange={(e) => setNoticePeriod(e.target.value)}
                className={`${profileFieldClass()} appearance-none bg-white`}
              >
                <option value="">Select Notice Period</option>
                {NOTICE_PERIOD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Describe Availability
              </label>
              <input
                type="text"
                value={availabilityText}
                onChange={(e) => setAvailabilityText(e.target.value)}
                placeholder="e.g. Immediately, 30 days, from 1 June 2026"
                className={`${profileFieldClass()} w-full`}
              />
            </div>
          </div>
        </section>
      </div>
    </ProfileDrawer>
  );
}

function PreferenceMultiSelectCard({
  title,
  description,
  selected,
  presetOptions,
  customValue,
  onCustomChange,
  onToggle,
  onRemove,
  onAddCustom,
  placeholder,
  tone,
}: {
  title: string;
  description: string;
  selected: string[];
  presetOptions: readonly string[];
  customValue: string;
  onCustomChange: (value: string) => void;
  onToggle: (value: string) => void;
  onRemove: (value: string) => void;
  onAddCustom: () => void;
  placeholder: string;
  tone: 'blue' | 'purple';
}) {
  const chipToneClass =
    tone === 'purple'
      ? 'border-indigo-200 bg-indigo-50'
      : 'border-blue-200 bg-blue-50';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <label className="mb-1 block text-sm font-medium text-gray-700">{title}</label>
      <p className="mb-3 text-xs text-gray-500">{description}</p>

      {selected.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {selected.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm text-gray-900 ${chipToneClass}`}
            >
              {item}
              <button
                type="button"
                onClick={() => onRemove(item)}
                className="text-[#9095A1] hover:text-gray-600"
                aria-label={`Remove ${item}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3">
        {presetOptions.map((option) => (
          <label key={option} className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(option)}
              onChange={() => onToggle(option)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{option}</span>
          </label>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={customValue}
          onChange={(e) => onCustomChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddCustom();
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="button"
          onClick={onAddCustom}
          className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function PackageTextField({
  label,
  value,
  onChange,
  type = 'text',
  onFocus,
  onBlur,
  onKeyDown,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
  placeholder?: string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={`w-full px-4 pb-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 ${
          focused || value ? 'pt-5' : 'pt-3'
        }`}
        style={packageFieldStyle}
      />
      <label
        className={`pointer-events-none absolute text-slate-500 transition-all duration-200 ${
          focused || value
            ? 'left-4 -top-2.5 bg-white px-1 text-xs font-medium'
            : 'left-4 top-1/2 -translate-y-1/2 text-sm'
        }`}
        style={focused || value ? { color: '#239CD2' } : undefined}
      >
        {label}
      </label>
    </div>
  );
}


function PackageSelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={`w-full appearance-none px-4 pb-2 pr-10 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100 ${
          focused || value ? 'pt-5' : 'pt-3'
        }`}
        style={packageFieldStyle}
      >
        <option value="" disabled hidden />
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <label
        className={`pointer-events-none absolute text-slate-500 transition-all duration-200 ${
          focused || value
            ? 'left-4 -top-2.5 bg-white px-1 text-xs font-medium'
            : 'left-4 top-1/2 -translate-y-1/2 text-sm'
        }`}
        style={focused || value ? { color: '#239CD2' } : undefined}
      >
        {label}
      </label>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="#99A1AF"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function BenefitSelector({
  title,
  options,
  selected,
  onToggle,
  showAddInput,
  onShowAddInput,
  customValue,
  onCustomValueChange,
  onAddCustom,
  onCancelAdd,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (benefit: string) => void;
  showAddInput: boolean;
  onShowAddInput: (value: boolean) => void;
  customValue: string;
  onCustomValueChange: (value: string) => void;
  onAddCustom: () => void;
  onCancelAdd: () => void;
}) {
  return (
    <div>
      <label className="mb-3 block text-sm font-medium text-slate-700" style={{ color: '#239CD2' }}>
        {title}
      </label>
      <div className="space-y-2.5">
        {options.map((benefit) => (
          <label key={benefit} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selected.includes(benefit)}
              onChange={() => onToggle(benefit)}
              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-sky-600 focus:ring-2 focus:ring-sky-500"
              style={{ accentColor: '#239CD2' }}
            />
            <span className="text-sm text-slate-700">{benefit}</span>
          </label>
        ))}
      </div>

      {showAddInput ? (
        <div className="mt-3 flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <PackageTextField
              label="Enter new benefit"
              value={customValue}
              onChange={onCustomValueChange}
            />
          </div>
          <button
            type="button"
            onClick={onAddCustom}
            className="h-12 shrink-0 rounded-md bg-sky-600 px-4 text-sm text-white hover:bg-sky-700"
          >
            Add
          </button>
          <button
            type="button"
            onClick={onCancelAdd}
            className="h-12 shrink-0 rounded-md border border-gray-300 px-4 text-sm text-slate-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onShowAddInput(true)}
          className="mt-3 flex items-center gap-2 text-sm font-medium text-sky-600 transition hover:text-sky-700"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Add Other
        </button>
      )}
    </div>
  );
}

const packageFieldStyle: Record<string, string> = {
  width: '100%',
  height: '48.19px',
  borderRadius: '8px',
  border: '1px solid #D1D5DB',
  backgroundColor: '#FFFFFF',
};
