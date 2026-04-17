'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import Image from 'next/image';
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
  preferredIndustry: string;
  functionalArea: string;
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
  'Other'
];

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
  'Other'
];

const JOB_TYPES = ['Full-time', 'Contract', 'Part-time', 'Freelance', 'Internship'];

const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];

const RELOCATION_OPTIONS = [
  'Open to Relocate',
  'Not Open to Relocate',
  'Open to Remote Only'
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AED', 'CAD', 'AUD', 'SGD', 'JPY', 'CNY'];

const SALARY_FREQUENCIES = ['Annually', 'Monthly', 'Hourly'];

const AVAILABILITY_OPTIONS = [
  'Immediately',
  '15 days',
  '30 days',
  '45 days',
  '60 days',
  '90 days',
  'Negotiable'
];

const NOTICE_PERIOD_OPTIONS = [
  '15 days',
  '30 days',
  '45 days',
  '60 days',
  '90 days',
  'Negotiable'
];

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
  const [preferredIndustry, setPreferredIndustry] = useState(initialData?.preferredIndustry || '');
  const [functionalArea, setFunctionalArea] = useState(initialData?.functionalArea || '');
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
  const [availabilityToStart, setAvailabilityToStart] = useState(
    initialData?.availabilityToStart || ''
  );
  const [noticePeriod, setNoticePeriod] = useState(initialData?.noticePeriod || '');
  const [aiSuggestedJobTitles, setAiSuggestedJobTitles] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  useEffect(() => {
    if (initialData) {
      setPreferredJobTitles(initialData.preferredJobTitles || []);
      setPreferredIndustry(initialData.preferredIndustry || '');
      setFunctionalArea(initialData.functionalArea || '');
      setJobTypes(initialData.jobTypes || []);
      setWorkModes(initialData.workModes || []);
      setPreferredLocations(initialData.preferredLocations || []);
      setRelocationPreference(initialData.relocationPreference || '');
      setSalaryCurrency(initialData.salaryCurrency || 'USD');
      setSalaryAmount(initialData.salaryAmount || '');
      setSalaryFrequency(initialData.salaryFrequency || 'Annually');
      setAvailabilityToStart(initialData.availabilityToStart || '');
      setNoticePeriod(initialData.noticePeriod || '');
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  const resetForm = () => {
    setPreferredJobTitles([]);
    setJobTitleInput('');
    setPreferredIndustry('');
    setFunctionalArea('');
    setJobTypes([]);
    setWorkModes([]);
    setPreferredLocations([]);
    setLocationInput('');
    setRelocationPreference('');
    setSalaryCurrency('USD');
    setSalaryAmount('');
    setSalaryFrequency('Annually');
    setAvailabilityToStart('');
    setNoticePeriod('');
    setAiSuggestedJobTitles([]);
    setSuggestionError('');
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

  const isFormComplete = Boolean(
    preferredJobTitles.length > 0 &&
    preferredIndustry.trim() &&
    functionalArea.trim() &&
    jobTypes.length > 0 &&
    workModes.length > 0
  );

  const handleSave = () => {
    onSave({
      preferredJobTitles,
      preferredIndustry,
      functionalArea,
      jobTypes,
      workModes,
      preferredLocations,
      relocationPreference,
      salaryCurrency,
      salaryAmount,
      salaryFrequency,
      availabilityToStart,
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
          {isFormComplete && (
            <button
              onClick={handleSave}
              className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600"
            >
              Save Preferences
            </button>
          )}
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
                      className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

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

                  {/* Preferred Industry and Functional Area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferred Industry
                      </label>
                      <select
                        value={preferredIndustry}
                        onChange={(e) => setPreferredIndustry(e.target.value)}
                      className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Industry</option>
                        {INDUSTRIES.map((industry) => (
                          <option key={industry} value={industry}>{industry}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Functional Area / Department
                      </label>
                      <select
                        value={functionalArea}
                        onChange={(e) => setFunctionalArea(e.target.value)}
                      className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Functional Area</option>
                        {FUNCTIONAL_AREAS.map((area) => (
                          <option key={area} value={area}>{area}</option>
                        ))}
                      </select>
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
                    <div className="space-y-2">
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
                  </div>

                  {/* Work Mode */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Work Mode
                    </label>
                    <div className="space-y-2">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Availability to Start
                    </label>
                    <select
                      value={availabilityToStart}
                      onChange={(e) => setAvailabilityToStart(e.target.value)}
                      className="w-full px-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Availability</option>
                      {AVAILABILITY_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
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

    </ProfileDrawer>
  );
}
