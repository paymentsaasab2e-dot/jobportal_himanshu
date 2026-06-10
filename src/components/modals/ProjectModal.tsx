'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';
import ProfileDatePicker from '@/components/profile/ProfileDatePicker';
import { profileFieldClass, profileTextareaClass } from '@/lib/profile-modal-ui';
import {
  downloadProfileDocumentItem,
  getProfileDocumentDisplayName,
  isStoredProfileDocument,
  openProfileDocumentInNewTab,
  validateProfileDocumentFile,
} from '@/lib/profile-documents';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectData) => void | Promise<void>;
  initialData?: ProjectData;
  mode?: 'add' | 'edit';
  editingEntryId?: string | null;
}

export interface ProjectDocument {
  id: string;
  file?: File;
  name: string;
  url?: string;
  size?: number;
}

export interface ProjectData {
  id?: string;
  projectTitle: string;
  projectType: string;
  organizationClient: string;
  currentlyWorking: boolean;
  startDate: string;
  endDate: string;
  projectDescription: string;
  responsibilities: string;
  technologies: string[];
  projectOutcome: string;
  projectLink: string;
  documents?: ProjectDocument[];
}

const PROJECT_TYPES = [
  'Academic Project',
  'Personal Project',
  'Freelance Project',
  'Open Source',
  'Company Project',
  'Research Project',
  'Other'
];

function normalizeProjectDocuments(documents: ProjectData['documents']): ProjectDocument[] {
  return (documents || []).map((doc, index) => {
    if (typeof doc === 'string') {
      return {
        id: `doc-${index}-${doc}`,
        url: doc,
        name: getProfileDocumentDisplayName(doc),
      };
    }
    if (doc && typeof doc === 'object') {
      const storedUrl =
        typeof doc.url === 'string' && doc.url.trim()
          ? doc.url
          : typeof (doc as { file?: string }).file === 'string'
            ? String((doc as { file?: string }).file)
            : undefined;
      return {
        id: doc.id || `doc-${index}-${storedUrl || doc.name || 'document'}`,
        file: doc.file instanceof File ? doc.file : undefined,
        name: doc.name || (storedUrl ? getProfileDocumentDisplayName(storedUrl) : 'Document'),
        url: storedUrl,
        size: doc.size,
      };
    }
    return {
      id: `doc-${index}`,
      name: 'Document',
    };
  });
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  mode = 'edit',
  editingEntryId = null,
}: ProjectModalProps) {
  const isEditMode = mode === 'edit' && Boolean(initialData);
  const [projectTitle, setProjectTitle] = useState(initialData?.projectTitle || '');
  const [projectType, setProjectType] = useState(initialData?.projectType || '');
  const [organizationClient, setOrganizationClient] = useState(initialData?.organizationClient || '');
  const [currentlyWorking, setCurrentlyWorking] = useState(initialData?.currentlyWorking ?? false);
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [projectDescription, setProjectDescription] = useState(initialData?.projectDescription || '');
  const [responsibilities, setResponsibilities] = useState(initialData?.responsibilities || '');
  const [technologiesInput, setTechnologiesInput] = useState('');
  const [technologies, setTechnologies] = useState<string[]>(initialData?.technologies || []);
  const [projectOutcome, setProjectOutcome] = useState(initialData?.projectOutcome || '');
  const [projectLink, setProjectLink] = useState(initialData?.projectLink || '');
  const [documents, setDocuments] = useState<ProjectDocument[]>(
    normalizeProjectDocuments(initialData?.documents),
  );
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionInitKeyRef = useRef<string | null>(null);

  const resetForm = useCallback(() => {
    setProjectTitle('');
    setProjectType('');
    setOrganizationClient('');
    setCurrentlyWorking(false);
    setStartDate('');
    setEndDate('');
    setProjectDescription('');
    setResponsibilities('');
    setTechnologiesInput('');
    setTechnologies([]);
    setProjectOutcome('');
    setProjectLink('');
    setDocuments([]);
    setValidationError('');
    setFieldErrors({});
  }, []);

  const populateFormFromProject = useCallback((data: ProjectData) => {
    setProjectTitle(data.projectTitle || '');
    setProjectType(data.projectType || '');
    setOrganizationClient(data.organizationClient || '');
    setCurrentlyWorking(data.currentlyWorking ?? false);
    setStartDate(data.startDate || '');
    setEndDate(data.endDate || '');
    setProjectDescription(data.projectDescription || '');
    setResponsibilities(data.responsibilities || '');
    setTechnologiesInput('');
    setTechnologies(data.technologies || []);
    setProjectOutcome(data.projectOutcome || '');
    setProjectLink(data.projectLink || '');
    setDocuments(normalizeProjectDocuments(data.documents));
    setValidationError('');
    setFieldErrors({});
  }, []);

  // Initialize only when the drawer opens or the edited entry changes —
  // not on every parent re-render (which used to wipe newly added documents).
  useEffect(() => {
    if (!isOpen) {
      sessionInitKeyRef.current = null;
      return;
    }

    const initKey = mode === 'add' || !editingEntryId ? 'add' : `edit:${editingEntryId}`;
    if (sessionInitKeyRef.current === initKey) {
      return;
    }
    sessionInitKeyRef.current = initKey;

    if (mode === 'add' || !editingEntryId || !initialData) {
      resetForm();
      return;
    }

    populateFormFromProject(initialData);
  }, [isOpen, mode, editingEntryId, initialData, populateFormFromProject, resetForm]);

  useEffect(() => {
    if (currentlyWorking && endDate) {
      setEndDate('');
    }
  }, [currentlyWorking, endDate]);

  const handleAddTechnology = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && technologiesInput.trim()) {
      e.preventDefault();
      if (!technologies.includes(technologiesInput.trim())) {
        setTechnologies([...technologies, technologiesInput.trim()]);
      }
      setTechnologiesInput('');
    }
  };

  const handleRemoveTechnology = (index: number) => {
    setTechnologies(technologies.filter((_, i) => i !== index));
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const nextDocs: ProjectDocument[] = [];
    for (const file of Array.from(files)) {
      const validation = validateProfileDocumentFile(file);
      if (!validation.ok) {
        alert(validation.message);
        continue;
      }

      nextDocs.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
      });
    }

    if (nextDocs.length > 0) {
      setDocuments((prev) => [...prev, ...nextDocs]);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (docId: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== docId));
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

    if (!e.dataTransfer.files) return;

    handleFileSelect(e.dataTransfer.files);
  };

  const handleSave = async () => {
    const hasAnyFormData = Boolean(
      projectTitle.trim() ||
        projectType.trim() ||
        organizationClient.trim() ||
        currentlyWorking ||
        startDate ||
        endDate ||
        projectDescription.trim() ||
        responsibilities.trim() ||
        technologiesInput.trim() ||
        technologies.length > 0 ||
        projectOutcome.trim() ||
        projectLink.trim() ||
        documents.length > 0,
    );

    if (!hasAnyFormData) {
      onClose();
      return;
    }

    const nextErrors: Record<string, string> = {};

    if (!currentlyWorking && startDate && endDate && endDate < startDate) {
      nextErrors.endDate = 'End date cannot be earlier than start date.';
    }

    if (projectLink.trim()) {
      try {
        const parsedUrl = new URL(projectLink.trim());
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
          nextErrors.projectLink = 'Use a valid http or https URL.';
        }
      } catch (_error) {
        nextErrors.projectLink = 'Enter a valid URL.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setValidationError('Please fix the highlighted fields before saving.');
      return;
    }

    setFieldErrors({});
    setValidationError('');

    const finalTechnologies = [...technologies];
    const pendingTechnology = technologiesInput.trim();
    if (pendingTechnology && !finalTechnologies.includes(pendingTechnology)) {
      finalTechnologies.push(pendingTechnology);
    }

    setIsSaving(true);
    try {
      await onSave({
        id: initialData?.id ?? editingEntryId ?? undefined,
        projectTitle: projectTitle.trim(),
        projectType,
        organizationClient: organizationClient.trim(),
        currentlyWorking,
        startDate,
        endDate,
        projectDescription: projectDescription.trim(),
        responsibilities: responsibilities.trim(),
        technologies: finalTechnologies,
        projectOutcome: projectOutcome.trim(),
        projectLink: projectLink.trim(),
        documents: documents.length > 0 ? documents : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Error saving project:', error);
      alert(error instanceof Error ? error.message : 'Error saving project. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClassName = profileFieldClass();
  const selectClassName = `${profileFieldClass()} appearance-none bg-white`;
  const textareaClassName = `${profileTextareaClass} min-h-[100px]`;

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Project' : 'Add Project'}
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
            onClick={() => void handleSave()}
            disabled={isSaving}
            className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? 'Saving...' : isEditMode ? 'Update Project' : 'Save Project'}
          </button>
        </div>
      )}
    >
      <div className="space-y-6">
        {validationError ? (
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2 text-sm text-amber-700">
            {validationError}
          </div>
        ) : null}
        {/* Project Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Title
          </label>
          <input
            type="text"
            value={projectTitle}
            onChange={(e) => {
              setProjectTitle(e.target.value);
              if (fieldErrors.projectTitle) {
                setFieldErrors((prev) => ({ ...prev, projectTitle: '' }));
              }
            }}
            placeholder="e.g., E-commerce Website, Machine Learning Model, Marketing Campaign"
            className={`${inputClassName} ${fieldErrors.projectTitle ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500' : ''}`}
          />
          {fieldErrors.projectTitle ? <p className="mt-1 text-xs text-red-600">{fieldErrors.projectTitle}</p> : null}
        </div>

        {/* Project Type and Organization / Client - Two Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Project Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Type
            </label>
            <select
              value={projectType}
              onChange={(e) => {
                setProjectType(e.target.value);
                if (fieldErrors.projectType) {
                  setFieldErrors((prev) => ({ ...prev, projectType: '' }));
                }
              }}
              className={`${selectClassName} ${fieldErrors.projectType ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500' : ''}`}
            >
              <option value="">Select Project Type</option>
              {PROJECT_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {fieldErrors.projectType ? <p className="mt-1 text-xs text-red-600">{fieldErrors.projectType}</p> : null}
          </div>

          {/* Organization / Client */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization / Client
            </label>
            <input
              type="text"
              value={organizationClient}
              onChange={(e) => setOrganizationClient(e.target.value)}
              placeholder="If applicable — Company, University, or Client Name"
              className={inputClassName}
            />
          </div>
        </div>

        {/* Currently Working Checkbox */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={currentlyWorking}
              onChange={(e) => setCurrentlyWorking(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">I am currently working on this project</span>
          </label>
        </div>

        {/* Dates - Two Column */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <ProfileDatePicker
              value={startDate}
              max={endDate || undefined}
              onChange={(value) => {
                setStartDate(value);
                if (fieldErrors.startDate) {
                  setFieldErrors((prev) => ({ ...prev, startDate: '' }));
                }
              }}
              invalid={Boolean(fieldErrors.startDate)}
            />
            {fieldErrors.startDate ? <p className="mt-1 text-xs text-red-600">{fieldErrors.startDate}</p> : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <ProfileDatePicker
              value={endDate}
              min={startDate || undefined}
              onChange={(value) => {
                setEndDate(value);
                if (fieldErrors.endDate) {
                  setFieldErrors((prev) => ({ ...prev, endDate: '' }));
                }
              }}
              disabled={currentlyWorking}
              invalid={Boolean(fieldErrors.endDate)}
              displayValue={currentlyWorking ? 'Present' : undefined}
            />
            {fieldErrors.endDate ? <p className="mt-1 text-xs text-red-600">{fieldErrors.endDate}</p> : null}
          </div>
        </div>

        {/* Project Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Description
          </label>
          <textarea
            value={projectDescription}
            onChange={(e) => {
              setProjectDescription(e.target.value);
              if (fieldErrors.projectDescription) {
                setFieldErrors((prev) => ({ ...prev, projectDescription: '' }));
              }
            }}
            placeholder="Explain the project goals, your role, key tasks, and outcomes…"
            rows={4}
            className={`${textareaClassName} ${fieldErrors.projectDescription ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500' : ''}`}
          />
          {fieldErrors.projectDescription ? <p className="mt-1 text-xs text-red-600">{fieldErrors.projectDescription}</p> : null}
        </div>

        {/* Responsibilities / Contributions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Responsibilities / Contributions
          </label>
          <textarea
            value={responsibilities}
            onChange={(e) => setResponsibilities(e.target.value)}
            placeholder="Mention what you contributed—features built, research done, tasks handled…"
            rows={4}
            className={textareaClassName}
          />
        </div>

        {/* Technologies / Tools Used */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Technologies / Tools Used
          </label>
          <input
            type="text"
            value={technologiesInput}
            onChange={(e) => setTechnologiesInput(e.target.value)}
            onKeyPress={handleAddTechnology}
            placeholder="Add technologies (e.g., React, Python, Figma, SQL)…"
            className={inputClassName}
          />
          {technologies.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {technologies.map((tech, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                >
                  {tech}
                  <button
                    onClick={() => handleRemoveTechnology(index)}
                    className="text-blue-700 hover:text-blue-900"
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
        </div>

        {/* Project Outcome / Results */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Outcome / Results
          </label>
          <textarea
            value={projectOutcome}
            onChange={(e) => setProjectOutcome(e.target.value)}
            placeholder="Mention improvements, results, metrics, awards, or impact…"
            rows={4}
            className={textareaClassName}
          />
        </div>

        {/* Project Link */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Project Link
          </label>
          <input
            type="text"
            value={projectLink}
            onChange={(e) => {
              setProjectLink(e.target.value);
              if (fieldErrors.projectLink) {
                setFieldErrors((prev) => ({ ...prev, projectLink: '' }));
              }
            }}
            placeholder="GitHub, Behance, Portfolio, Drive link…"
            className={`${inputClassName} ${fieldErrors.projectLink ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500' : ''}`}
          />
          {fieldErrors.projectLink ? <p className="mt-1 text-xs text-red-600">{fieldErrors.projectLink}</p> : null}
        </div>

        {/* Upload Your Project Documents/Certificates */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Your Project Documents/Certificates
          </label>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
              }`}
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
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
            <p className="mt-2 text-sm text-gray-600">Click to upload or drag and drop</p>
            <p className="mt-1 text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
          </div>
          {documents.length > 0 && (
            <div className="mt-4 space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
                          <button
                            type="button"
                            onClick={() => openProfileDocumentInNewTab(doc.url!, doc.name)}
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
                            onClick={() => void downloadProfileDocumentItem(doc, doc.name)}
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
                    onClick={() => handleRemoveFile(doc.id)}
                    className="ml-3 text-amber-600 hover:text-amber-700 flex-shrink-0"
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
