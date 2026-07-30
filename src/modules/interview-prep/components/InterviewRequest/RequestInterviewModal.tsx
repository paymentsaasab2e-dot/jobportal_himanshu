'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

import { getApiBaseUrl } from '@/lib/api-base';
import { getAuthHeaders } from '@/lib/auth-storage';
import {
  createInterviewRequest,
  fetchInterviewSuggestions,
  INTERVIEW_CATEGORIES,
  INTERVIEW_DIFFICULTIES,
  INTERVIEW_DURATION_OPTIONS,
  INTERVIEW_EXPERIENCE_OPTIONS,
  INTERVIEW_LANGUAGES,
  INTERVIEW_TYPES,
  TECH_STACK_BY_CATEGORY,
  type InterviewRequestInput,
} from '@/lib/interview-request-api';
import { WritingAssistField } from '@/components/common/WritingSuggestions';

type Props = {
  open: boolean;
  candidateId: string | null;
  onOpenChange: (open: boolean) => void;
  onSubmitted?: () => void;
  initialNotes?: string;
  initialTargetRole?: string;
  initialCompanyDomain?: string;
  initialWeakAreas?: string;
  initialMustCoverTopics?: string;
  initialCategory?: string;
  initialExperience?: string;
  initialLanguage?: string;
  initialInterviewType?: string;
  renderMode?: 'modal' | 'page';
  showCloseButton?: boolean;
};

type FormState = InterviewRequestInput;

const TOTAL_STEPS = 11;
const QUICK_TIME_SLOTS = [
  { value: '08:00-10:00', label: '8:00 AM - 10:00 AM' },
  { value: '10:00-12:00', label: '10:00 AM - 12:00 PM' },
  { value: '12:00-14:00', label: '12:00 PM - 2:00 PM' },
  { value: '14:00-16:00', label: '2:00 PM - 4:00 PM' },
  { value: '16:00-18:00', label: '4:00 PM - 6:00 PM' },
  { value: '18:00-20:00', label: '6:00 PM - 8:00 PM' },
  { value: '20:00-22:00', label: '8:00 PM - 10:00 PM' },
] as const;
const EXTRA_INTERVIEW_CATEGORIES = [
  'Accounting Interview',
  'Finance Interview',
  'Sales Interview',
  'Customer Support Interview',
  'Operations Interview',
  'Business Analyst Interview',
] as const;
const COMMON_TECH_STACK_FALLBACK = [
  'Communication',
  'Problem Solving',
  'Domain Knowledge',
  'Interview Strategy',
  'Case Study',
  'Behavioral Skills',
] as const;
const ACCOUNTING_TECH_STACK = [
  'Accounting Principles',
  'Financial Analysis',
  'Taxation',
  'Tally ERP',
  'SAP FICO',
  'MS Excel',
] as const;

function getTechStackByCategory(category: string) {
  const direct = TECH_STACK_BY_CATEGORY[category];
  if (direct?.length) return direct;
  const normalized = String(category || '').toLowerCase();
  if (normalized.includes('account') || normalized.includes('finance')) {
    return [...ACCOUNTING_TECH_STACK];
  }
  return [...COMMON_TECH_STACK_FALLBACK];
}

function todayAsInputValue() {
  const now = new Date();
  return formatDateToInput(now);
}

function formatDateToInput(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function normalizeDateForCompare(value: string) {
  const raw = String(value || '').trim();
  if (!raw) return '';

  // HTML date input format: YYYY-MM-DD
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  // Locale-like format: MM/DD/YYYY
  const slashMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw);
  if (slashMatch) {
    const mm = slashMatch[1].padStart(2, '0');
    const dd = slashMatch[2].padStart(2, '0');
    const yyyy = slashMatch[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  return formatDateToInput(parsed);
}

function formatTimeLabel(value: string) {
  const rangeMatch = /^(\d{1,2}:\d{2})-(\d{1,2}:\d{2})$/.exec(String(value || '').trim());
  if (rangeMatch) {
    return `${formatTimeLabel(rangeMatch[1])} - ${formatTimeLabel(rangeMatch[2])}`;
  }
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || '').trim());
  if (!match) return value;
  const hour24 = Number(match[1]);
  const minutes = match[2];
  if (!Number.isFinite(hour24)) return value;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return `${hour12}:${minutes} ${period}`;
}

function getWeekdayShortLabel(value: string) {
  const normalized = normalizeDateForCompare(value);
  if (!normalized) return 'Day';
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'Day';
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
  return labels[parsed.getDay()];
}

function getWeekdayDateOptions() {
  const labels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const today = new Date();
  return Array.from({ length: 7 }, (_, idx) => {
    const date = new Date(today);
    date.setDate(today.getDate() + idx);
    return {
      value: formatDateToInput(date),
      label: labels[date.getDay()],
    };
  });
}

function getExperienceFromYears(years: number | null | undefined) {
  if (!years || years < 1) return '0-1 Year';
  if (years < 3) return '1-3 Years';
  if (years < 5) return '3-5 Years';
  if (years < 8) return '5-8 Years';
  return '8+ Years';
}

const INITIAL_FORM: FormState = {
  targetRole: '',
  companyDomain: '',
  category: '',
  techStack: [],
  difficulty: 'Intermediate',
  experience: '0-1 Year',
  language: 'English',
  interviewType: '',
  weakAreas: '',
  mustCoverTopics: '',
  preferredDate: '',
  preferredTime: [],
  duration: 45,
  notes: '',
};

export function RequestInterviewModal({
  open,
  candidateId,
  onOpenChange,
  onSubmitted,
  initialNotes,
  initialTargetRole,
  initialCompanyDomain,
  initialWeakAreas,
  initialMustCoverTopics,
  initialCategory,
  initialExperience,
  initialLanguage,
  initialInterviewType,
  renderMode = 'modal',
  showCloseButton = true,
}: Props) {
  const contentScrollRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(1);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successRequestId, setSuccessRequestId] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [isCategoryPanelOpen, setIsCategoryPanelOpen] = useState(true);
  const [techSearch, setTechSearch] = useState('');
  const [difficultySearch, setDifficultySearch] = useState('');
  const [experienceSearch, setExperienceSearch] = useState('');
  const [languageSearch, setLanguageSearch] = useState('');
  const [interviewTypeSearch, setInterviewTypeSearch] = useState('');
  const [durationSearch, setDurationSearch] = useState('');
  const [categoryAiSuggestions, setCategoryAiSuggestions] = useState<string[]>([]);
  const [categoryAiLoading, setCategoryAiLoading] = useState(false);
  const [targetRoleSuggestions, setTargetRoleSuggestions] = useState<string[]>([]);
  const [targetRoleLoading, setTargetRoleLoading] = useState(false);
  const [targetRoleSuggestOpen, setTargetRoleSuggestOpen] = useState(false);
  const [companyDomainSuggestions, setCompanyDomainSuggestions] = useState<string[]>([]);
  const [companyDomainLoading, setCompanyDomainLoading] = useState(false);
  const [companyDomainSuggestOpen, setCompanyDomainSuggestOpen] = useState(false);
  const [mustCoverTopicSuggestions, setMustCoverTopicSuggestions] = useState<string[]>([]);
  const [mustCoverTopicLoading, setMustCoverTopicLoading] = useState(false);
  const [mustCoverTopicSuggestOpen, setMustCoverTopicSuggestOpen] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const allInterviewCategories = useMemo(
    () => Array.from(new Set([...INTERVIEW_CATEGORIES, ...EXTRA_INTERVIEW_CATEGORIES])),
    []
  );
  const availableTechStack = useMemo(() => getTechStackByCategory(form.category), [form.category]);
  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return allInterviewCategories;
    const starts = allInterviewCategories.filter((item) => item.toLowerCase().startsWith(query));
    const contains = allInterviewCategories.filter(
      (item) => item.toLowerCase().includes(query) && !item.toLowerCase().startsWith(query)
    );
    const directMatches = [...starts, ...contains];
    if (directMatches.length > 0) return directMatches;

    // Typo-tolerant fallback for partial words like "Accountat" -> "Accounting Interview"
    const relaxedQuery = query.length > 4 ? query.slice(0, Math.max(4, Math.floor(query.length * 0.7))) : query;
    if (!relaxedQuery) return [];
    const fuzzyStarts = allInterviewCategories.filter((item) =>
      item.toLowerCase().startsWith(relaxedQuery)
    );
    const fuzzyContains = allInterviewCategories.filter(
      (item) =>
        item.toLowerCase().includes(relaxedQuery) && !item.toLowerCase().startsWith(relaxedQuery)
    );
    return [...fuzzyStarts, ...fuzzyContains];
  }, [allInterviewCategories, categorySearch]);
  const displayCategories = categoryAiSuggestions.length > 0 ? categoryAiSuggestions : filteredCategories;
  const filteredTechStack = useMemo(() => {
    const query = techSearch.trim().toLowerCase();
    if (!query) return availableTechStack;
    const starts = availableTechStack.filter((item) => item.toLowerCase().startsWith(query));
    const contains = availableTechStack.filter(
      (item) => item.toLowerCase().includes(query) && !item.toLowerCase().startsWith(query)
    );
    return [...starts, ...contains];
  }, [availableTechStack, techSearch]);
  const filteredDifficulties = useMemo(() => {
    const query = difficultySearch.trim().toLowerCase();
    if (!query) return INTERVIEW_DIFFICULTIES;
    return INTERVIEW_DIFFICULTIES.filter((item) => item.toLowerCase().includes(query));
  }, [difficultySearch]);
  const filteredExperiences = useMemo(() => {
    const query = experienceSearch.trim().toLowerCase();
    if (!query) return INTERVIEW_EXPERIENCE_OPTIONS;
    return INTERVIEW_EXPERIENCE_OPTIONS.filter((item) => item.toLowerCase().includes(query));
  }, [experienceSearch]);
  const filteredLanguages = useMemo(() => {
    const query = languageSearch.trim().toLowerCase();
    if (!query) return INTERVIEW_LANGUAGES;
    return INTERVIEW_LANGUAGES.filter((item) => item.toLowerCase().includes(query));
  }, [languageSearch]);
  const filteredInterviewTypes = useMemo(() => {
    const query = interviewTypeSearch.trim().toLowerCase();
    if (!query) return INTERVIEW_TYPES;
    return INTERVIEW_TYPES.filter((item) => item.toLowerCase().includes(query));
  }, [interviewTypeSearch]);
  const filteredDurations = useMemo(() => {
    const query = durationSearch.trim().toLowerCase();
    if (!query) return INTERVIEW_DURATION_OPTIONS;
    return INTERVIEW_DURATION_OPTIONS.filter((item) => String(item).includes(query));
  }, [durationSearch]);
  const weekdayDateOptions = useMemo(() => getWeekdayDateOptions(), []);
  const progress = Math.round((Math.min(step, TOTAL_STEPS) / TOTAL_STEPS) * 100);

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError('');
    setSuccessRequestId('');
    setNewTimeSlot('');
    setCategorySearch('');
    setIsCategoryPanelOpen(true);
    setCategoryAiSuggestions([]);
    setCategoryAiLoading(false);
    setTechSearch('');
    setDifficultySearch('');
    setExperienceSearch('');
    setLanguageSearch('');
    setInterviewTypeSearch('');
    setDurationSearch('');
    setTargetRoleSuggestions([]);
    setTargetRoleLoading(false);
    setTargetRoleSuggestOpen(false);
    setCompanyDomainSuggestions([]);
    setCompanyDomainLoading(false);
    setCompanyDomainSuggestOpen(false);
    setMustCoverTopicSuggestions([]);
    setMustCoverTopicLoading(false);
    setMustCoverTopicSuggestOpen(false);
    setForm((prev) => ({
      ...INITIAL_FORM,
      preferredDate: todayAsInputValue(),
      experience: String(initialExperience || prev.experience || '0-1 Year'),
      category: String(initialCategory || ''),
      language: String(initialLanguage || 'English'),
      interviewType: String(initialInterviewType || ''),
      targetRole: String(initialTargetRole || '').slice(0, 120),
      companyDomain: String(initialCompanyDomain || '').slice(0, 160),
      weakAreas: String(initialWeakAreas || '').slice(0, 500),
      mustCoverTopics: String(initialMustCoverTopics || '').slice(0, 500),
      notes: String(initialNotes || '').slice(0, 1000),
    }));
  }, [
    initialCategory,
    initialCompanyDomain,
    initialExperience,
    initialInterviewType,
    initialLanguage,
    initialNotes,
    initialMustCoverTopics,
    initialTargetRole,
    initialWeakAreas,
    open,
  ]);

  useEffect(() => {
    if (!open || renderMode === 'page') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open, renderMode]);

  useEffect(() => {
    if (!open) return;
    const node = contentScrollRef.current;
    if (!node) return;
    node.scrollTop = 0;
  }, [open, step]);

  useEffect(() => {
    if (!open || !candidateId) return;
    let cancelled = false;
    const loadExperience = async () => {
      setLoadingProfile(true);
      try {
        const response = await fetch(`${getApiBaseUrl()}/profile/${candidateId}`, {
          method: 'GET',
          headers: getAuthHeaders(),
        });
        const payload = await response.json().catch(() => ({}));
        if (cancelled || !response.ok || !payload?.success || !payload?.data) return;
        const profile = payload.data;
        const years =
          typeof profile?.experienceYears === 'number'
            ? profile.experienceYears
            : typeof profile?.candidate?.experienceYears === 'number'
              ? profile.candidate.experienceYears
              : null;
        if (years == null) return;
        setForm((prev) => ({ ...prev, experience: getExperienceFromYears(years) }));
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    };
    void loadExperience();
    return () => {
      cancelled = true;
    };
  }, [candidateId, open]);

  useEffect(() => {
    if (!open) return;
    const query = categorySearch.trim();
    if (query.length < 2) {
      setCategoryAiSuggestions([]);
      setCategoryAiLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setCategoryAiLoading(true);
        const suggestions = await fetchInterviewSuggestions({
          field: 'category',
          query,
        });
        setCategoryAiSuggestions(suggestions.slice(0, 8));
      } catch {
        setCategoryAiSuggestions([]);
      } finally {
        setCategoryAiLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [categorySearch, form.category, open]);

  useEffect(() => {
    if (!open || step !== 10) return;
    const query = form.targetRole.trim();
    if (query.length < 2 || !targetRoleSuggestOpen) {
      setTargetRoleSuggestions([]);
      setTargetRoleLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setTargetRoleLoading(true);
        const suggestions = await fetchInterviewSuggestions({
          field: 'targetRole',
          query,
        });
        setTargetRoleSuggestions(suggestions.slice(0, 8));
      } catch {
        setTargetRoleSuggestions([]);
      } finally {
        setTargetRoleLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [form.targetRole, open, step, targetRoleSuggestOpen]);

  useEffect(() => {
    if (!open || step !== 10) return;
    const query = form.companyDomain.trim();
    if (query.length < 2 || !companyDomainSuggestOpen) {
      setCompanyDomainSuggestions([]);
      setCompanyDomainLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setCompanyDomainLoading(true);
        const suggestions = await fetchInterviewSuggestions({
          field: 'companyDomain',
          query,
        });
        setCompanyDomainSuggestions(suggestions.slice(0, 8));
      } catch {
        setCompanyDomainSuggestions([]);
      } finally {
        setCompanyDomainLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [companyDomainSuggestOpen, form.companyDomain, open, step]);

  useEffect(() => {
    if (!open || step !== 10) return;
    const query = form.mustCoverTopics?.trim() || '';
    if (query.length < 2 || !mustCoverTopicSuggestOpen) {
      setMustCoverTopicSuggestions([]);
      setMustCoverTopicLoading(false);
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        setMustCoverTopicLoading(true);
        const suggestions = await fetchInterviewSuggestions({
          field: 'mustCoverTopics',
          query,
          context: { category: form.category },
        });
        setMustCoverTopicSuggestions(suggestions.slice(0, 8));
      } catch {
        setMustCoverTopicSuggestions([]);
      } finally {
        setMustCoverTopicLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [form.category, form.mustCoverTopics, mustCoverTopicSuggestOpen, open, step]);

  const toggleTech = (tech: string) => {
    setForm((prev) => ({
      ...prev,
      techStack: prev.techStack.includes(tech) ? prev.techStack.filter((x) => x !== tech) : [...prev.techStack, tech],
    }));
  };

  const applyTargetRoleSuggestion = (value: string) => {
    setForm((prev) => ({ ...prev, targetRole: value.slice(0, 120) }));
    setTargetRoleSuggestOpen(false);
  };

  const applyCompanyDomainSuggestion = (value: string) => {
    setForm((prev) => ({ ...prev, companyDomain: value.slice(0, 160) }));
    setCompanyDomainSuggestOpen(false);
  };

  const applyMustCoverTopicSuggestion = (value: string) => {
    const current = String(form.mustCoverTopics || '').trim();
    const existing = current
      .split(',')
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
    if (existing.includes(value.toLowerCase())) {
      setMustCoverTopicSuggestOpen(false);
      return;
    }
    const nextValue = current ? `${current}, ${value}` : value;
    setForm((prev) => ({ ...prev, mustCoverTopics: nextValue.slice(0, 500) }));
    setMustCoverTopicSuggestOpen(false);
  };

  const addTimeSlot = () => {
    const value = newTimeSlot.trim();
    if (!value) return;
    if (form.preferredTime.includes(value)) return;
    setForm((prev) => ({ ...prev, preferredTime: [...prev.preferredTime, value] }));
    setNewTimeSlot('');
  };

  const removeTimeSlot = (slot: string) => {
    setForm((prev) => ({ ...prev, preferredTime: prev.preferredTime.filter((x) => x !== slot) }));
  };

  const validateStep = () => {
    if (step === 1 && !form.category) return 'Please select an interview category.';
    if (step === 2 && form.techStack.length === 0) return 'Please select at least one technology.';
    if (step === 3 && !form.difficulty) return 'Please select interview difficulty.';
    if (step === 4 && !form.experience) return 'Please select candidate experience.';
    if (step === 5 && !form.language) return 'Please select preferred language.';
    if (step === 6 && !form.interviewType) return 'Please select interview type.';
    if (step === 7) {
      if (!form.preferredDate) return 'Please select preferred date.';
      const selectedDate = normalizeDateForCompare(form.preferredDate);
      const todayDate = todayAsInputValue();
      if (!selectedDate) return 'Please select a valid date.';
      if (selectedDate < todayDate) return 'Preferred date must be today or future.';
    }
    if (step === 8 && form.preferredTime.length === 0) return 'Please add at least one preferred time slot.';
    if (step === 9 && !form.duration) return 'Please select interview duration.';
    if (step === 10 && !form.targetRole.trim()) return 'Please add target role.';
    if (step === 10 && !form.companyDomain.trim()) return 'Please add company or domain.';
    if (step === 10 && !form.weakAreas.trim()) return 'Please add weak areas you want to cover.';
    if (step === 10 && (form.notes || '').length > 1000) return 'Notes must be 1000 characters or less.';
    return '';
  };

  const goNext = () => {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const goBack = () => {
    setError('');
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const submit = async () => {
    const msg = validateStep();
    if (msg) {
      setError(msg);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const composedNotes = [
        (form.notes || '').trim(),
        form.mustCoverTopics?.trim()
          ? `Must-cover topics: ${form.mustCoverTopics.trim()}`
          : '',
      ]
        .filter(Boolean)
        .join('\n');

      const result = await createInterviewRequest({
        ...form,
        notes: composedNotes,
      });
      setSuccessRequestId(result.requestId);
      setStep(TOTAL_STEPS + 1);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;
  const isPageMode = renderMode === 'page';

  return (
    <div
      className={
        isPageMode
          ? 'mx-auto w-full max-w-5xl px-3 pb-4 pt-2 sm:px-4'
          : 'fixed inset-0 z-1200 flex items-center justify-center bg-black/35 p-4'
      }
    >
      <div
        className={
          isPageMode
            ? 'w-full rounded-2xl border border-slate-200 bg-white shadow-sm'
            : 'flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.18)]'
        }
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#28A8E1]">Request Interview</p>
            <h2 className="text-lg font-bold text-slate-900">Candidate Interview Request</h2>
          </div>
          {showCloseButton ? (
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {step <= TOTAL_STEPS ? (
          <>
            <div className="px-5 pt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-linear-to-r from-[#28A8E1] to-[#1F8FC2] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">Step {step} of {TOTAL_STEPS}</p>
            </div>

            <div
              ref={contentScrollRef}
              className={`${isPageMode ? 'px-5 py-4' : 'flex-1 overflow-y-auto px-5 py-4'}`}
            >
              {step === 1 ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setIsCategoryPanelOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Select Interview Category</h3>
                        <p className="text-xs text-slate-500">
                          {form.category ? `Selected: ${form.category}` : 'Tap to open category options'}
                        </p>
                      </div>
                      {isCategoryPanelOpen ? (
                        <ChevronUp className="h-4 w-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      )}
                    </button>

                    {isCategoryPanelOpen ? (
                      <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3">
                        <input
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value.slice(0, 80))}
                          placeholder="Type to search categories (AI suggestions enabled)"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                        />
                        {categoryAiLoading ? (
                          <p className="text-xs text-slate-500">Loading AI suggestions...</p>
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                          {displayCategories.map((category) => {
                            const active = form.category === category;
                            return (
                              <button
                                key={category}
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({ ...prev, category, techStack: [] }));
                                  setCategorySearch(category);
                                  setIsCategoryPanelOpen(false);
                                }}
                                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                                  active
                                    ? 'border-[#28A8E1] bg-[#EAF7FD] text-[#1F8FC2]'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                {category}
                              </button>
                            );
                          })}
                        </div>
                        {displayCategories.length === 0 ? (
                          <div className="space-y-2">
                            <p className="text-sm text-slate-500">
                              No categories match your search. You can still continue with a custom category.
                            </p>
                            {categorySearch.trim() ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    category: categorySearch.trim(),
                                    techStack: [],
                                  }));
                                  setIsCategoryPanelOpen(false);
                                }}
                                className="rounded-xl border border-[#28A8E1]/40 bg-[#EAF7FD] px-3 py-2 text-sm font-semibold text-[#1F8FC2] transition hover:border-[#28A8E1]"
                              >
                                Use custom category: {categorySearch.trim()}
                              </button>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Select Tech Stack</h3>
                  <p className="text-sm text-slate-500">Multiple selection allowed.</p>
                  <input
                    value={techSearch}
                    onChange={(e) => setTechSearch(e.target.value.slice(0, 80))}
                    placeholder="Type to search technologies"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                  />
                  <div className="flex flex-wrap gap-2">
                    {filteredTechStack.length ? (
                      filteredTechStack.map((tech) => {
                        const active = form.techStack.includes(tech);
                        return (
                          <button
                            key={tech}
                            type="button"
                            onClick={() => toggleTech(tech)}
                            className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                              active
                                ? 'border-[#28A8E1] bg-[#EAF7FD] text-[#1F8FC2]'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {tech}
                          </button>
                        );
                      })
                    ) : availableTechStack.length === 0 ? (
                      <p className="text-sm text-slate-500">Select category first to view technologies.</p>
                    ) : (
                      <p className="text-sm text-slate-500">No technology matches your search.</p>
                    )}
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Interview Difficulty</h3>
                  <input
                    value={difficultySearch}
                    onChange={(e) => setDifficultySearch(e.target.value.slice(0, 50))}
                    placeholder="Type to filter difficulty"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                  />
                  <div className="space-y-2">
                    {filteredDifficulties.map((difficulty) => (
                      <label key={difficulty} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                        <input
                          type="radio"
                          name="difficulty"
                          value={difficulty}
                          checked={form.difficulty === difficulty}
                          onChange={() => setForm((prev) => ({ ...prev, difficulty }))}
                        />
                        <span className="text-sm font-medium text-slate-700">{difficulty}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Candidate Experience</h3>
                  <p className="text-sm text-slate-500">
                    Auto-fetched from profile {loadingProfile ? '(updating...)' : ''}. You can edit it.
                  </p>
                  <input
                    value={experienceSearch}
                    onChange={(e) => setExperienceSearch(e.target.value.slice(0, 50))}
                    placeholder="Type to filter experience options"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                  />
                  <div className="flex flex-wrap gap-2">
                    {filteredExperiences.map((opt) => {
                      const active = form.experience === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, experience: opt }))}
                          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                            active
                              ? 'border-[#28A8E1] bg-[#EAF7FD] text-[#1F8FC2]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {step === 5 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Preferred Language</h3>
                  <input
                    value={languageSearch}
                    onChange={(e) => setLanguageSearch(e.target.value.slice(0, 50))}
                    placeholder="Type to search language"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                  />
                  <div className="flex flex-wrap gap-2">
                    {filteredLanguages.map((lang) => {
                      const active = form.language === lang;
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, language: lang }))}
                          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                            active
                              ? 'border-[#28A8E1] bg-[#EAF7FD] text-[#1F8FC2]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {lang}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {step === 6 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Interview Type</h3>
                  <input
                    value={interviewTypeSearch}
                    onChange={(e) => setInterviewTypeSearch(e.target.value.slice(0, 60))}
                    placeholder="Type to filter interview type"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                  />
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredInterviewTypes.map((type) => {
                      const active = form.interviewType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, interviewType: type }))}
                          className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${
                            active
                              ? 'border-[#28A8E1] bg-[#EAF7FD] text-[#1F8FC2]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {step === 7 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Preferred Date</h3>
                  <div className="flex flex-wrap gap-2">
                    {weekdayDateOptions.map((opt) => {
                      const active = normalizeDateForCompare(form.preferredDate) === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, preferredDate: opt.value }))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'border-[#28A8E1] bg-[#EAF7FD] text-[#1F8FC2]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {step === 8 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Preferred Time</h3>
                  <p className="text-sm text-slate-500">Pick one or more ready slots, or add a custom time.</p>
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={newTimeSlot}
                      onChange={(e) => setNewTimeSlot(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                    />
                    <button
                      type="button"
                      onClick={addTimeSlot}
                      className="rounded-xl bg-[#28A8E1] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TIME_SLOTS.map((slot) => {
                      const active = form.preferredTime.includes(slot.value);
                      return (
                        <button
                          key={slot.value}
                          type="button"
                          onClick={() => {
                            setForm((prev) => ({
                              ...prev,
                              preferredTime: prev.preferredTime.includes(slot.value)
                                ? prev.preferredTime.filter((item) => item !== slot.value)
                                : [...prev.preferredTime, slot.value],
                            }));
                          }}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'border-[#28A8E1] bg-[#EAF7FD] text-[#1F8FC2]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                  {form.preferredTime.length > 0 ? (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Selected Slots ({getWeekdayShortLabel(form.preferredDate)})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {form.preferredTime.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => removeTimeSlot(slot)}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                            title="Remove slot"
                          >
                            {getWeekdayShortLabel(form.preferredDate)} - {formatTimeLabel(slot)} x
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === 9 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Interview Duration</h3>
                  <input
                    value={durationSearch}
                    onChange={(e) => setDurationSearch(e.target.value.slice(0, 20))}
                    placeholder="Type duration (e.g. 60)"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                  />
                  <div className="flex flex-wrap gap-2">
                    {filteredDurations.map((minutes) => {
                      const active = form.duration === minutes;
                      return (
                        <button
                          key={minutes}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, duration: minutes }))}
                          className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                            active
                              ? 'border-[#28A8E1] bg-[#EAF7FD] text-[#1F8FC2]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {minutes} Minutes
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {step === 10 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Interview Focus Details</h3>
                  <div className="relative">
                    <WritingAssistField
                      multiline={false}
                      value={form.targetRole}
                      onChange={(next) => setForm((prev) => ({ ...prev, targetRole: next.slice(0, 120) }))}
                      onFocus={() => setTargetRoleSuggestOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setTargetRoleSuggestOpen(false), 120);
                      }}
                      placeholder="Target role (e.g. Frontend Developer)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                    />
                    {targetRoleSuggestOpen && form.targetRole.trim().length >= 2 ? (
                      <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {targetRoleLoading ? (
                          <p className="px-3 py-2 text-sm text-slate-500">Loading AI suggestions...</p>
                        ) : targetRoleSuggestions.length > 0 ? (
                          targetRoleSuggestions.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => applyTargetRoleSuggestion(item)}
                              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {item}
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-slate-500">No AI suggestion yet. You can type manually.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className="relative">
                    <WritingAssistField
                      multiline={false}
                      value={form.companyDomain}
                      onChange={(next) => setForm((prev) => ({ ...prev, companyDomain: next.slice(0, 160) }))}
                      onFocus={() => setCompanyDomainSuggestOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setCompanyDomainSuggestOpen(false), 120);
                      }}
                      placeholder="Company or domain (e.g. fintech product company)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                    />
                    {companyDomainSuggestOpen && form.companyDomain.trim().length >= 2 ? (
                      <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {companyDomainLoading ? (
                          <p className="px-3 py-2 text-sm text-slate-500">Loading AI suggestions...</p>
                        ) : companyDomainSuggestions.length > 0 ? (
                          companyDomainSuggestions.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => applyCompanyDomainSuggestion(item)}
                              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {item}
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-slate-500">No AI suggestion yet. You can type manually.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <WritingAssistField
                    value={form.weakAreas}
                    onChange={(next) => setForm((prev) => ({ ...prev, weakAreas: next.slice(0, 500) }))}
                    placeholder="Weak areas to cover (communication, coding speed, system design, etc.)"
                    className="h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                  />
                  <div className="relative">
                    <input
                      value={form.mustCoverTopics || ''}
                      onChange={(e) => setForm((prev) => ({ ...prev, mustCoverTopics: e.target.value.slice(0, 500) }))}
                      onFocus={() => setMustCoverTopicSuggestOpen(true)}
                      onBlur={() => {
                        window.setTimeout(() => setMustCoverTopicSuggestOpen(false), 120);
                      }}
                      placeholder="Must-cover topics (comma separated)"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                    />
                    {mustCoverTopicSuggestOpen && (form.mustCoverTopics || '').trim().length >= 2 ? (
                      <div className="absolute z-20 mt-1 max-h-44 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                        {mustCoverTopicLoading ? (
                          <p className="px-3 py-2 text-sm text-slate-500">Loading AI suggestions...</p>
                        ) : mustCoverTopicSuggestions.length > 0 ? (
                          mustCoverTopicSuggestions.map((item) => (
                            <button
                              key={item}
                              type="button"
                              onMouseDown={(event) => event.preventDefault()}
                              onClick={() => applyMustCoverTopicSuggestion(item)}
                              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {item}
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-2 text-sm text-slate-500">No AI suggestion yet. You can type manually.</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">Additional Notes</h4>
                  <WritingAssistField
                    value={form.notes || ''}
                    onChange={(next) => setForm((prev) => ({ ...prev, notes: next.slice(0, 1000) }))}
                    placeholder="Topics to cover, weak areas, company prep, special requests..."
                    className="h-36 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#28A8E1]"
                  />
                  <p className="text-xs text-slate-500">{(form.notes || '').length}/1000</p>
                </div>
              ) : null}

              {step === 11 ? (
                <div className="space-y-3">
                  <h3 className="text-base font-semibold text-slate-900">Review Request</h3>
                  <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    <p><span className="font-semibold text-slate-900">Target Role:</span> {form.targetRole}</p>
                    <p><span className="font-semibold text-slate-900">Company / Domain:</span> {form.companyDomain}</p>
                    <p><span className="font-semibold text-slate-900">Category:</span> {form.category}</p>
                    <p><span className="font-semibold text-slate-900">Tech Stack:</span> {form.techStack.join(', ')}</p>
                    <p><span className="font-semibold text-slate-900">Difficulty:</span> {form.difficulty}</p>
                    <p><span className="font-semibold text-slate-900">Experience:</span> {form.experience}</p>
                    <p><span className="font-semibold text-slate-900">Interview Type:</span> {form.interviewType}</p>
                    <p><span className="font-semibold text-slate-900">Language:</span> {form.language}</p>
                    <p><span className="font-semibold text-slate-900">Preferred Date:</span> {form.preferredDate}</p>
                    <p><span className="font-semibold text-slate-900">Preferred Time:</span> {form.preferredTime.join(', ')}</p>
                    <p><span className="font-semibold text-slate-900">Duration:</span> {form.duration} Minutes</p>
                    <p><span className="font-semibold text-slate-900">Weak Areas:</span> {form.weakAreas}</p>
                    <p><span className="font-semibold text-slate-900">Must-cover Topics:</span> {form.mustCoverTopics?.trim() || 'N/A'}</p>
                    <p><span className="font-semibold text-slate-900">Notes:</span> {form.notes?.trim() || 'N/A'}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="px-5 pb-2">
                <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
                  {error}
                </p>
              </div>
            ) : null}

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={goBack}
                disabled={step === 1}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Back
              </button>
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="rounded-xl bg-[#28A8E1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1F8FC2]"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="rounded-xl bg-[#28A8E1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1F8FC2] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="px-5 py-10 text-center">
            <h3 className="text-xl font-bold text-emerald-700">Request Submitted</h3>
            <p className="mt-2 text-slate-600">Your interview request has been submitted successfully.</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">Request ID: {successRequestId}</p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="mt-6 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1F8FC2]"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
