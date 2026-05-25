'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';
import ProfileDatePicker from '@/components/profile/ProfileDatePicker';
import {
  profileFieldClass,
  profileSelectClassName,
  profileTextareaClass,
} from '@/lib/profile-modal-ui';
import { getProfileDocumentDisplayName, isStoredProfileDocument } from '@/lib/profile-documents';
import {
  type CitySuggestion,
  formatCitySuggestionLabel,
  searchCitySuggestions,
} from '@/lib/geo-locations';

interface InternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: InternshipData) => void;
  initialData?: InternshipData;
  mode?: 'add' | 'edit';
}

export interface InternshipDocument {
  id: string;
  file?: File | string;
  name: string;
  url?: string;
  size?: number;
}

export interface InternshipData {
  id?: string;
  internshipTitle: string;
  companyName: string;
  internshipType: string;
  domainDepartment: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  location: string;
  workMode: string;
  responsibilities: string;
  learnings: string;
  skills: string[];
  documents?: InternshipDocument[];
}

export default function InternshipModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'edit',
}: InternshipModalProps) {
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

  const applyLocationSuggestion = useCallback(
    (suggestion: CitySuggestion) => {
      locationSuggestUserInitiatedRef.current = false;
      setLocation(formatCitySuggestionLabel(suggestion));
      resetLocationSuggestState();
    },
    [resetLocationSuggestState],
  );

  const resetForm = () => {
    setInternshipTitle('');
    setCompanyName('');
    setInternshipType('');
    setDomainDepartment('');
    setStartDate('');
    setEndDate('');
    setCurrentlyWorking(false);
    setLocation('');
    resetLocationSuggestState();
    locationSuggestUserInitiatedRef.current = false;
    setWorkMode('');
    setResponsibilities('');
    setLearnings('');
    setSkillsInput('');
    setSkills([]);
    setDocuments([]);
  };

  const [internshipTitle, setInternshipTitle] = useState(initialData?.internshipTitle || '');
  const [companyName, setCompanyName] = useState(initialData?.companyName || '');
  const [internshipType, setInternshipType] = useState(initialData?.internshipType || '');
  const [domainDepartment, setDomainDepartment] = useState(initialData?.domainDepartment || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [currentlyWorking, setCurrentlyWorking] = useState(initialData?.currentlyWorking ?? false);
  const [location, setLocation] = useState(initialData?.location || '');
  const [workMode, setWorkMode] = useState(initialData?.workMode || '');
  const [responsibilities, setResponsibilities] = useState(initialData?.responsibilities || '');
  const [learnings, setLearnings] = useState(initialData?.learnings || '');
  const [skillsInput, setSkillsInput] = useState('');
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [documents, setDocuments] = useState<InternshipDocument[]>(initialData?.documents || []);
  const [dragActive, setDragActive] = useState(false);
  const [dateError, setDateError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update state when modal opens or initial data changes
  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'add' || !initialData) {
      resetForm();
      return;
    }

    if (initialData) {
      setInternshipTitle(initialData.internshipTitle || '');
      setCompanyName(initialData.companyName || '');
      setInternshipType(initialData.internshipType || '');
      setDomainDepartment(initialData.domainDepartment || '');
      setStartDate(initialData.startDate || '');
      setEndDate(initialData.endDate || '');
      setCurrentlyWorking(initialData.currentlyWorking ?? false);
      setLocation(initialData.location || '');
      resetLocationSuggestState();
      locationSuggestUserInitiatedRef.current = false;
      setWorkMode(initialData.workMode || '');
      setResponsibilities(initialData.responsibilities || '');
      setLearnings(initialData.learnings || '');
      setSkills(initialData.skills || []);

      // Normalize documents to ensure they all have unique IDs
      const normalizedDocuments: InternshipDocument[] = (initialData.documents || []).map((doc, index) => {
        if (typeof doc === 'string') {
          // If it's a string (URL from database), convert to object
          return {
            id: `doc-${Date.now()}-${index}`,
            url: doc,
            name: getProfileDocumentDisplayName(doc),
          };
        } else if (doc && typeof doc === 'object') {
          // If it's already an object, ensure it has an id
          return {
            id: doc.id || `doc-${Date.now()}-${index}`,
            file: doc.file,
            name: doc.name || 'Document',
            url: doc.url,
            size: doc.size,
          };
        } else {
          // Fallback for any other type
          return {
            id: `doc-${Date.now()}-${index}`,
            name: 'Document',
          };
        }
      });
      setDocuments(normalizedDocuments);
    }
  }, [isOpen, initialData, mode, resetLocationSuggestState]);

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

    const query = location.trim();
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
  }, [location, isOpen, resetLocationSuggestState]);

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

      const newDoc: InternshipDocument = {
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

  const validateEndDate = (start: string, end: string): string => {
    if (!start || !end) return '';
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    if (endDateObj < startDateObj) {
      return 'End date must be after start date';
    }
    return '';
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    setDateError('');
    // If end date exists and is now invalid, reset it
    if (endDate && value) {
      const error = validateEndDate(value, endDate);
      if (error) {
        setEndDate('');
        setDateError(error);
      }
    }
  };

  const handleEndDateChange = (value: string) => {
    if (startDate && value) {
      const error = validateEndDate(startDate, value);
      setDateError(error);
      if (!error) {
        setEndDate(value);
      }
    } else {
      setDateError('');
      setEndDate(value);
    }
  };

  const handleSave = () => {
    const hasAnyFormData = Boolean(
      internshipTitle.trim() ||
        companyName.trim() ||
        internshipType ||
        domainDepartment ||
        startDate ||
        endDate ||
        currentlyWorking ||
        location.trim() ||
        workMode ||
        responsibilities.trim() ||
        learnings.trim() ||
        skillsInput.trim() ||
        skills.length > 0 ||
        documents.length > 0,
    );

    if (!hasAnyFormData) {
      onClose();
      return;
    }

    onSave({
      internshipTitle: internshipTitle.trim(),
      companyName: companyName.trim(),
      internshipType,
      domainDepartment,
      startDate,
      endDate,
      currentlyWorking,
      location: location.trim(),
      workMode,
      responsibilities: responsibilities.trim(),
      learnings: learnings.trim(),
      skills,
      documents: documents.length > 0 ? documents : undefined,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'add' ? 'Add Internship' : 'Edit Internship'}
      widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
      footer={(
        <div className="flex items-center justify-end gap-3">
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
            Save Internship
          </button>
        </div>
      )}
    >
      <div className="space-y-6">
        {/* Basic Information Section - Two Column Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Internship Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internship Title
              </label>
              <input
                type="text"
                value={internshipTitle}
                onChange={(e) => setInternshipTitle(e.target.value)}
                placeholder="e.g., Marketing & Communications Intern"
                className={profileFieldClass()}
              />
            </div>

            {/* Internship Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Internship Type
              </label>
              <select
                value={internshipType}
                onChange={(e) => setInternshipType(e.target.value)}
                className={profileSelectClassName}
              >
                <option value="">Select internship type</option>
                <option value="full-time">Full-time Internship</option>
                <option value="part-time">Part-time Internship</option>
                <option value="remote">Remote Internship</option>
                <option value="hybrid">Hybrid Internship</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Company / Organization Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company / Organization Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., SAASA Corp."
                className={profileFieldClass()}
              />
            </div>

            {/* Domain / Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain / Department
              </label>
              <select
                value={domainDepartment}
                onChange={(e) => setDomainDepartment(e.target.value)}
                className={profileSelectClassName}
              >
                <option value="">Select domain / department</option>
                <option value="marketing">Marketing</option>
                <option value="engineering">Engineering</option>
                <option value="finance">Finance</option>
                <option value="hr">Human Resources</option>
                <option value="operations">Operations</option>
                <option value="sales">Sales</option>
                <option value="design">Design</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dates Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Dates</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <ProfileDatePicker
                value={startDate}
                max={endDate || undefined}
                onChange={handleStartDateChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <ProfileDatePicker
                value={endDate}
                min={startDate || undefined}
                onChange={handleEndDateChange}
                disabled={currentlyWorking}
                displayValue={currentlyWorking ? 'Present' : undefined}
              />
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentlyWorking}
                  onChange={(e) => {
                    setCurrentlyWorking(e.target.checked);
                    if (e.target.checked) {
                      setEndDate('');
                      setDateError('');
                    }
                  }}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <span className="text-sm text-blue-600 font-medium">I am currently working here</span>
              </label>
              {dateError && (
                <p className="mt-2 text-xs text-amber-600">{dateError}</p>
              )}
            </div>
          </div>
        </div>

        {/* Location & Mode Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Location & Mode</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative" ref={locationAutocompleteRef}>
                <input
                  type="text"
                  value={location}
                  autoComplete="off"
                  onChange={(e) => {
                    locationSuggestUserInitiatedRef.current = true;
                    setLocation(e.target.value);
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
                  className={profileFieldClass()}
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
                Start typing a city or country and select a suggested location
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Work Mode
              </label>
              <select
                value={workMode}
                onChange={(e) => setWorkMode(e.target.value)}
                className={profileSelectClassName}
              >
                <option value="">Select work mode</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
          </div>
        </div>

        {/* Role Details Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Role Details</h3>

          {/* Responsibilities / Tasks Performed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Responsibilities / Tasks Performed
            </label>
            <textarea
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe your main tasks, duties, and contributions..."
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Learnings or Outcomes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learnings or Outcomes
            </label>
            <textarea
              value={learnings}
              onChange={(e) => setLearnings(e.target.value)}
              rows={4}
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what you learned, skills gained, or outcomes achieved..."
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        {/* Skills Used Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">Skills Used</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills Applied
            </label>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      onClick={() => {
                        setSkills(skills.filter((_, i) => i !== index));
                      }}
                      className="text-blue-700 hover:text-blue-900"
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
            <div className="flex gap-2">
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && skillsInput.trim()) {
                    setSkills([...skills, skillsInput.trim()]);
                    setSkillsInput('');
                  }
                }}
                placeholder="Add skills you used during this internship..."
                className="flex-1 rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  if (skillsInput.trim()) {
                    setSkills([...skills, skillsInput.trim()]);
                    setSkillsInput('');
                  }
                }}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Upload Documents Section */}
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-gray-900">
            Upload Your Internship Certificates/Documents{' '}
          </h3>

          {/* File Input (Hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />

          {/* Drag and Drop Area */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full px-4 py-6 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
              }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <p className="text-sm text-center text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PDF, PNG, JPG (Max 5MB per file)</p>
            </div>
          </div>

          {/* Uploaded Files List */}
          {documents.length > 0 && (
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div
                  key={doc.id || `doc-${index}`}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                      {doc.size && (
                        <p className="text-xs text-gray-500">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      {isStoredProfileDocument(doc) && (
                        <>
                          <a
                            href={resolveDocumentUrl(doc.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 transition-colors"
                            title="View Document"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </a>
                          <a
                            href={resolveDocumentUrl(doc.url)}
                            download={doc.name}
                            className="text-orange-600 hover:text-orange-700 transition-colors"
                            title="Download Document"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile(doc.id);
                    }}
                    className="ml-2 p-1 text-amber-600 hover:text-amber-700 hover:bg-red-50 rounded transition-colors"
                    aria-label="Remove file"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </ProfileDrawer>
  );
}
