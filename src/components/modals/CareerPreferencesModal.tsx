'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import type { RefObject } from 'react';
import Image from 'next/image';
import { CalendarDays } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-base';
import ProfileDrawer from '../ui/ProfileDrawer';

interface CareerPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CareerPreferencesData) => void;
  initialData?: CareerPreferencesData;
}

export interface CareerPreferencesData {
  preferredJobTitles: string[];
  /** Multiple industries (also mirrored into `preferredIndustry` for legacy APIs). */
  preferredIndustries: string[];
  /** Multiple functional areas (also mirrored into `functionalArea`). */
  functionalAreas: string[];
  /** Semicolon-separated mirror of `preferredIndustries` for legacy DB/API. */
  preferredIndustry?: string;
  /** Semicolon-separated mirror of `functionalAreas`. */
  functionalArea?: string;
  jobTypes: string[];
  workModes: string[];
  preferredLocations: string[];
  relocationPreference: string;
  salaryCurrency: string;
  salaryAmount: string;
  salaryFrequency: string;
  availabilityToStart: string;
  noticePeriod?: string;
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

/** Display `YYYY-MM-DD` as DD-MM-YYYY without timezone shift. */
function formatIsoDateForDisplay(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec((ymd || '').trim());
  if (!m) return ymd;
  return `${m[3]}-${m[2]}-${m[1]}`;
}

const JOB_TYPES = ['Full-time', 'Contract', 'Part-time', 'Freelance', 'Internship'];

const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];

const RELOCATION_OPTIONS = [
  'Open to Relocate',
  'Not Open to Relocate',
  'Open to Remote Only'
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY'];

const SALARY_FREQUENCIES = ['Annually', 'Monthly', 'Hourly'];

/** Load saved `availabilityToStart`: `YYYY-MM-DD — note`, pure ISO date, or free text. */
function parseAvailabilityManual(saved: string | undefined): { date: string; text: string } {
  const s = (saved || '').trim();
  if (!s) return { date: '', text: '' };
  const combined = /^(\d{4}-\d{2}-\d{2})\s*—\s*(.+)$/.exec(s);
  if (combined) return { date: combined[1], text: combined[2].trim() };
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return { date: s, text: '' };
  return { date: '', text: s };
}

/** Save: text if present; else calendar date; both → `YYYY-MM-DD — note`. */
function mergeAvailabilityManual(date: string, text: string): string {
  const t = text.trim();
  const d = date.trim();
  if (t && d) return `${d} — ${t}`;
  if (t) return t;
  if (d) return d;
  return '';
}

const NOTICE_PERIOD_OPTIONS = [
  '15 days',
  '30 days',
  '45 days',
  '60 days',
  '90 days',
  'Negotiable',
];

export function parsePreferenceList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [...new Set(value.map(String).map((s) => s.trim()).filter(Boolean))];
  }
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) return [];
  return [...new Set(s.split(/[,;|]\s*/).map((x) => x.trim()).filter(Boolean))];
}

export function normalizeCareerPreferencesFromApi(raw: unknown): CareerPreferencesData | undefined {
  if (raw === null || raw === undefined || typeof raw !== 'object') return undefined;
  const r = raw as Record<string, unknown>;
  const preferredIndustries = parsePreferenceList(r.preferredIndustries ?? r.preferredIndustry);
  const functionalAreas = parsePreferenceList(r.functionalAreas ?? r.functionalArea);
  return {
    preferredJobTitles: Array.isArray(r.preferredJobTitles) ? r.preferredJobTitles.map(String) : [],
    preferredIndustries,
    functionalAreas,
    preferredIndustry: preferredIndustries.length ? preferredIndustries.join('; ') : undefined,
    functionalArea: functionalAreas.length ? functionalAreas.join('; ') : undefined,
    jobTypes: Array.isArray(r.jobTypes) ? r.jobTypes.map(String) : [],
    workModes: Array.isArray(r.workModes) ? r.workModes.map(String) : [],
    preferredLocations: Array.isArray(r.preferredLocations) ? r.preferredLocations.map(String) : [],
    relocationPreference: String(r.relocationPreference ?? ''),
    salaryCurrency: String(r.salaryCurrency ?? 'USD'),
    salaryAmount: String(r.salaryAmount ?? ''),
    salaryFrequency: String(r.salaryFrequency ?? 'Annually'),
    availabilityToStart: String(r.availabilityToStart ?? ''),
    noticePeriod: r.noticePeriod ? String(r.noticePeriod) : undefined,
  };
}

export default function CareerPreferencesModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: CareerPreferencesModalProps) {
  const [preferredJobTitles, setPreferredJobTitles] = useState<string[]>(
    initialData?.preferredJobTitles || []
  );
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [preferredIndustries, setPreferredIndustries] = useState<string[]>(
    () => parsePreferenceList(initialData?.preferredIndustries ?? initialData?.preferredIndustry),
  );
  const [functionalAreas, setFunctionalAreas] = useState<string[]>(
    () => parsePreferenceList(initialData?.functionalAreas ?? initialData?.functionalArea),
  );
  const [industryCustomInput, setIndustryCustomInput] = useState('');
  const [functionalAreaCustomInput, setFunctionalAreaCustomInput] = useState('');
  const [jobTypes, setJobTypes] = useState<string[]>(initialData?.jobTypes || []);
  const [workModes, setWorkModes] = useState<string[]>(initialData?.workModes || []);
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    initialData?.preferredLocations || []
  );
  const [locationInput, setLocationInput] = useState('');
  const [relocationPreference, setRelocationPreference] = useState(
    initialData?.relocationPreference || ''
  );
  const [salaryCurrency, setSalaryCurrency] = useState(initialData?.salaryCurrency || 'USD');
  const [salaryAmount, setSalaryAmount] = useState(initialData?.salaryAmount || '');
  const [salaryFrequency, setSalaryFrequency] = useState(initialData?.salaryFrequency || 'Annually');
  const [availabilityDate, setAvailabilityDate] = useState(() =>
    parseAvailabilityManual(initialData?.availabilityToStart).date,
  );
  const [availabilityText, setAvailabilityText] = useState(() =>
    parseAvailabilityManual(initialData?.availabilityToStart).text,
  );
  const [noticePeriod, setNoticePeriod] = useState(initialData?.noticePeriod || '');
  const availabilityDateInputRef = useRef<HTMLInputElement>(null);
  const [aiSuggestedJobTitles, setAiSuggestedJobTitles] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  useEffect(() => {
    if (initialData) {
      setPreferredJobTitles(initialData.preferredJobTitles || []);
      setPreferredIndustries(
        parsePreferenceList(initialData.preferredIndustries ?? initialData.preferredIndustry),
      );
      setFunctionalAreas(parsePreferenceList(initialData.functionalAreas ?? initialData.functionalArea));
      setIndustryCustomInput('');
      setFunctionalAreaCustomInput('');
      setJobTypes(initialData.jobTypes || []);
      setWorkModes(initialData.workModes || []);
      setPreferredLocations(initialData.preferredLocations || []);
      setRelocationPreference(initialData.relocationPreference || '');
      setSalaryCurrency(initialData.salaryCurrency || 'USD');
      setSalaryAmount(initialData.salaryAmount || '');
      setSalaryFrequency(initialData.salaryFrequency || 'Annually');
      const av = parseAvailabilityManual(initialData.availabilityToStart);
      setAvailabilityDate(av.date);
      setAvailabilityText(av.text);
      setNoticePeriod(initialData.noticePeriod || '');
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setPreferredJobTitles([]);
    setJobTitleInput('');
    setPreferredIndustries([]);
    setFunctionalAreas([]);
    setIndustryCustomInput('');
    setFunctionalAreaCustomInput('');
    setJobTypes([]);
    setWorkModes([]);
    setPreferredLocations([]);
    setLocationInput('');
    setRelocationPreference('');
    setSalaryCurrency('USD');
    setSalaryAmount('');
    setSalaryFrequency('Annually');
    setAvailabilityDate('');
    setAvailabilityText('');
    setNoticePeriod('');
    setAiSuggestedJobTitles([]);
    setSuggestionError('');
  };

  const openAvailabilityDatePicker = (inputRef: RefObject<HTMLInputElement | null>) => {
    const input = inputRef.current;
    if (!input || input.disabled) return;
    input.focus();
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    }
  };

  useEffect(() => {
    const query = jobTitleInput.trim();

    if (!query) {
      setAiSuggestedJobTitles([]);
      setSuggestionError('');
      setIsLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        setSuggestionError('');

        const response = await fetch(`${API_BASE_URL}/ai/job-title-suggestions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            query,
            selectedTitles: preferredJobTitles,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to load suggestions');
        }

        setAiSuggestedJobTitles(
          Array.isArray(result?.data?.suggestions) ? result.data.suggestions : []
        );
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        setAiSuggestedJobTitles([]);
        setSuggestionError(
          error instanceof Error ? error.message : 'Unable to load AI suggestions right now'
        );
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [jobTitleInput, preferredJobTitles]);

  const handleAddJobTitle = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && jobTitleInput.trim()) {
      e.preventDefault();
      const title = jobTitleInput.trim();
      if (!preferredJobTitles.includes(title)) {
        setPreferredJobTitles([...preferredJobTitles, title]);
      }
      setJobTitleInput('');
    }
  };

  const handleRemoveJobTitle = (title: string) => {
    setPreferredJobTitles(preferredJobTitles.filter(t => t !== title));
  };

  const handleSelectSuggestedJobTitle = (title: string) => {
    if (!preferredJobTitles.includes(title)) {
      setPreferredJobTitles([...preferredJobTitles, title]);
    }
    setJobTitleInput('');
    setAiSuggestedJobTitles([]);
    setSuggestionError('');
  };

  const handleToggleJobType = (jobType: string) => {
    if (jobTypes.includes(jobType)) {
      setJobTypes(jobTypes.filter(t => t !== jobType));
    } else {
      setJobTypes([...jobTypes, jobType]);
    }
  };

  const handleToggleWorkMode = (mode: string) => {
    if (workModes.includes(mode)) {
      setWorkModes(workModes.filter(m => m !== mode));
    } else {
      setWorkModes([...workModes, mode]);
    }
  };

  const handleAddLocation = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && locationInput.trim()) {
      e.preventDefault();
      const location = locationInput.trim();
      if (!preferredLocations.includes(location)) {
        setPreferredLocations([...preferredLocations, location]);
      }
      setLocationInput('');
    }
  };

  const handleRemoveLocation = (location: string) => {
    setPreferredLocations(preferredLocations.filter(l => l !== location));
  };

  const togglePreferredIndustry = (name: string) => {
    setPreferredIndustries((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const addCustomIndustry = () => {
    const v = industryCustomInput.trim();
    if (!v) return;
    const lower = v.toLowerCase();
    if (preferredIndustries.some((x) => x.toLowerCase() === lower)) return;
    setPreferredIndustries([...preferredIndustries, v]);
    setIndustryCustomInput('');
  };

  const removePreferredIndustry = (name: string) => {
    setPreferredIndustries((prev) => prev.filter((x) => x !== name));
  };

  const toggleFunctionalArea = (name: string) => {
    setFunctionalAreas((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const addCustomFunctionalArea = () => {
    const v = functionalAreaCustomInput.trim();
    if (!v) return;
    const lower = v.toLowerCase();
    if (functionalAreas.some((x) => x.toLowerCase() === lower)) return;
    setFunctionalAreas([...functionalAreas, v]);
    setFunctionalAreaCustomInput('');
  };

  const removeFunctionalArea = (name: string) => {
    setFunctionalAreas((prev) => prev.filter((x) => x !== name));
  };

  const missingRequiredFields: string[] = [];
  if (preferredJobTitles.length === 0) missingRequiredFields.push('Preferred Job Titles');
  if (preferredIndustries.length === 0) missingRequiredFields.push('Preferred Industry');
  if (functionalAreas.length === 0) missingRequiredFields.push('Functional Area');
  if (jobTypes.length === 0) missingRequiredFields.push('Job Types');
  if (workModes.length === 0) missingRequiredFields.push('Work Modes');

  const isFormComplete = missingRequiredFields.length === 0;

  const handleSave = () => {
    onSave({
      preferredJobTitles,
      preferredIndustries,
      functionalAreas,
      preferredIndustry: preferredIndustries.length ? preferredIndustries.join('; ') : undefined,
      functionalArea: functionalAreas.length ? functionalAreas.join('; ') : undefined,
      jobTypes,
      workModes,
      preferredLocations,
      relocationPreference,
      salaryCurrency,
      salaryAmount,
      salaryFrequency,
      availabilityToStart: mergeAvailabilityManual(availabilityDate, availabilityText),
      noticePeriod,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Career Preferences"
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
            disabled={!isFormComplete}
            className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Preferences
          </button>
        </div>
      )}
    >
            <div className="space-y-8">
              {/* SECTION 1 - ROLE & DOMAIN */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SECTION 1 — ROLE & DOMAIN</h3>
                <div className="space-y-4">
                  {/* Preferred Job Titles */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Job Titles
                    </label>
                    {preferredJobTitles.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {preferredJobTitles.map((title, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm text-gray-900"
                          >
                            {title}
                            <button
                              onClick={() => handleRemoveJobTitle(title)}
                              className="text-[#9095A1] hover:text-gray-600"
                            >
                              <svg
                                width="14"
                                height="14"
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
                          </span>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      value={jobTitleInput}
                      onChange={(e) => setJobTitleInput(e.target.value)}
                      onKeyPress={handleAddJobTitle}
                      placeholder="e.g., Software Engineer, Marketing Executive…"
                      className={`w-full px-4 py-2 border rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${preferredJobTitles.length === 0 ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500' : 'border-gray-300'}`}
                    />
                    {preferredJobTitles.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">At least one job title is required</p>
                    )}

                    <div className="mt-3 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-sky-50 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Image
                          src="/auto_ai.png"
                          alt="AI suggestions"
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain"
                        />
                        <div>
                          <p className="text-sm font-semibold text-gray-900">AI Job Title Suggestions</p>
                          <p className="text-xs text-gray-600">
                            Start typing a role and we'll suggest relevant job titles you can pick from.
                          </p>
                        </div>
                      </div>

                      {jobTitleInput.trim() ? (
                        isLoadingSuggestions ? (
                          <p className="text-sm text-gray-600">Finding relevant AI job title suggestions...</p>
                        ) : suggestionError ? (
                          <p className="text-sm text-red-600">{suggestionError}</p>
                        ) : aiSuggestedJobTitles.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {aiSuggestedJobTitles.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => handleSelectSuggestedJobTitle(suggestion)}
                                className="inline-flex items-center rounded-full border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 transition hover:border-blue-400 hover:bg-blue-50"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">
                            No close AI suggestions yet. Press Enter to add your custom job title.
                          </p>
                        )
                      ) : (
                        <p className="text-sm text-gray-600">
                          Type any role, keyword, or career direction and AI will suggest matching job titles below.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Preferred Industries and Functional Areas (multi-select) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Industry
                      </label>
                      <p className="mb-2 text-xs text-gray-500">Select all that apply. Add other industries below.</p>
                      {preferredIndustries.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {preferredIndustries.map((ind) => (
                            <span
                              key={ind}
                              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-gray-900"
                            >
                              {ind}
                              <button
                                type="button"
                                onClick={() => removePreferredIndustry(ind)}
                                className="text-[#9095A1] hover:text-gray-600"
                                aria-label={`Remove ${ind}`}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div
                        className={`max-h-44 space-y-2 overflow-y-auto rounded-lg border p-3 ${
                          preferredIndustries.length === 0
                            ? 'border-amber-200 bg-amber-50/50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {INDUSTRIES_PRESET.map((industry) => (
                          <label key={industry} className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={preferredIndustries.includes(industry)}
                              onChange={() => togglePreferredIndustry(industry)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{industry}</span>
                          </label>
                        ))}
                      </div>
                      {preferredIndustries.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">Select at least one industry</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={industryCustomInput}
                          onChange={(e) => setIndustryCustomInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomIndustry();
                            }
                          }}
                          placeholder="Other industry — type and press Enter or Add"
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addCustomIndustry}
                          className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Functional Area / Department
                      </label>
                      <p className="mb-2 text-xs text-gray-500">Select all that apply. Add other areas below.</p>
                      {functionalAreas.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {functionalAreas.map((area) => (
                            <span
                              key={area}
                              className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm text-gray-900"
                            >
                              {area}
                              <button
                                type="button"
                                onClick={() => removeFunctionalArea(area)}
                                className="text-[#9095A1] hover:text-gray-600"
                                aria-label={`Remove ${area}`}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div
                        className={`max-h-44 space-y-2 overflow-y-auto rounded-lg border p-3 ${
                          functionalAreas.length === 0
                            ? 'border-amber-200 bg-amber-50/50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        {FUNCTIONAL_AREAS_PRESET.map((area) => (
                          <label key={area} className="flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              checked={functionalAreas.includes(area)}
                              onChange={() => toggleFunctionalArea(area)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{area}</span>
                          </label>
                        ))}
                      </div>
                      {functionalAreas.length === 0 && (
                        <p className="mt-1 text-xs text-amber-600">Select at least one functional area</p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={functionalAreaCustomInput}
                          onChange={(e) => setFunctionalAreaCustomInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomFunctionalArea();
                            }
                          }}
                          placeholder="Other area — type and press Enter or Add"
                          className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={addCustomFunctionalArea}
                          className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2 - JOB TYPE & WORK MODE */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SECTION 2 — JOB TYPE & WORK MODE</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Job Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Job Type
                    </label>
                    <div className={`space-y-2 p-3 rounded-lg ${jobTypes.length === 0 ? 'bg-red-50 border border-red-200' : ''}`}>
                      {JOB_TYPES.map((jobType) => (
                        <label key={jobType} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={jobTypes.includes(jobType)}
                            onChange={() => handleToggleJobType(jobType)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{jobType}</span>
                        </label>
                      ))}
                    </div>
                    {jobTypes.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">Select at least one job type</p>
                    )}
                  </div>

                  {/* Work Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Work Mode
                    </label>
                    <div className={`space-y-2 p-3 rounded-lg ${workModes.length === 0 ? 'bg-red-50 border border-red-200' : ''}`}>
                      {WORK_MODES.map((mode) => (
                        <label key={mode} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={workModes.includes(mode)}
                            onChange={() => handleToggleWorkMode(mode)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{mode}</span>
                        </label>
                      ))}
                    </div>
                    {workModes.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600">Select at least one work mode</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3 - LOCATION PREFERENCES */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SECTION 3 — LOCATION PREFERENCES</h3>
                <div className="space-y-4">
                  {/* Preferred Work Locations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Work Locations
                    </label>
                    {preferredLocations.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {preferredLocations.map((location, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-sm text-gray-900"
                          >
                            {location}
                            <button
                              onClick={() => handleRemoveLocation(location)}
                              className="text-[#9095A1] hover:text-gray-600"
                            >
                              <svg
                                width="14"
                                height="14"
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
                          </span>
                        ))}
                      </div>
                    )}
                    <input
                      type="text"
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                      onKeyPress={handleAddLocation}
                      placeholder="City or Country… e.g., Mumbai, Dubai, Toronto"
                      className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Relocation Preference */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relocation Preference
                    </label>
                    <select
                      value={relocationPreference}
                      onChange={(e) => setRelocationPreference(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Preference</option>
                      {RELOCATION_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 4 - SALARY EXPECTATION */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SECTION 4 — SALARY EXPECTATION</h3>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <select
                      value={salaryCurrency}
                      onChange={(e) => setSalaryCurrency(e.target.value)}
                      className="px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {CURRENCIES.map((currency) => (
                        <option key={currency} value={currency}>{currency}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      placeholder="Enter expected salary…"
                      className="flex-1 px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={salaryFrequency}
                      onChange={(e) => setSalaryFrequency(e.target.value)}
                      className="px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {SALARY_FREQUENCIES.map((freq) => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-sm text-gray-500">
                    Your expected salary helps us match you with suitable roles.
                  </p>
                </div>
              </div>

              {/* SECTION 5 - AVAILABILITY */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">SECTION 5 — AVAILABILITY</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability to Start
                    </label>
                    <p className="mb-3 text-xs text-gray-500">
                      Choose a calendar date and/or type when you can start (e.g. Immediately, 30 days, after notice
                      period). No preset list — your text and date are saved as entered.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Earliest start date <span className="text-gray-400">(optional)</span>
                        </label>
                        <div className="relative max-w-xs">
                          <button
                            type="button"
                            onClick={() => openAvailabilityDatePicker(availabilityDateInputRef)}
                            aria-label="Open calendar to choose earliest start date"
                            className="flex w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-900 shadow-sm transition hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <span className={availabilityDate ? 'text-gray-900' : 'text-gray-500'}>
                              {availabilityDate
                                ? formatIsoDateForDisplay(availabilityDate)
                                : 'Select date from calendar'}
                            </span>
                            <CalendarDays
                              className="h-5 w-5 shrink-0 text-[#28A8E1]"
                              strokeWidth={2}
                              aria-hidden
                            />
                          </button>
                          <input
                            ref={availabilityDateInputRef}
                            type="date"
                            value={availabilityDate}
                            onChange={(e) => {
                              setAvailabilityDate(e.target.value);
                              e.currentTarget.blur();
                            }}
                            tabIndex={-1}
                            className="pointer-events-none absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            aria-hidden="true"
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          Tap the field or calendar icon to open the date picker.
                        </p>
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
                        <label className="mb-1 block text-xs font-medium text-gray-600">
                          Describe availability <span className="text-gray-400">(optional)</span>
                        </label>
                        <input
                          type="text"
                          value={availabilityText}
                          onChange={(e) => setAvailabilityText(e.target.value)}
                          placeholder="e.g. Immediately, 15 / 30 / 90 days, from 1 June 2026, negotiable…"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Notice Period <span className="text-gray-500 text-xs">(Optional)</span>
                    </label>
                    <select
                      value={noticePeriod}
                      onChange={(e) => setNoticePeriod(e.target.value)}
                      className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Notice Period</option>
                      {NOTICE_PERIOD_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            {missingRequiredFields.length > 0 && (
              <div className="mt-6 rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                <p className="text-xs font-medium text-amber-700">
                  Required: {missingRequiredFields.join(', ')}
                </p>
              </div>
            )}
          


    </ProfileDrawer>
  );
}
