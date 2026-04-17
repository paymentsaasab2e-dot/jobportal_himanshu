'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ProjectData) => void;
  initialData?: ProjectData;
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

export default function ProjectModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: ProjectModalProps) {
  const isEditMode = Boolean(initialData);
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
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Normalize documents to ensure each has a unique id
    if (initialData?.documents && Array.isArray(initialData.documents)) {
      const normalizedDocs = initialData.documents.map((doc: any, index: number) => {
        if (typeof doc === 'string') {
          return {
            id: `doc-${index}-${Date.now()}`,
            name: doc.split('/').pop() || 'Document',
            url: doc,
          };
        }
        return {
          id: doc.id || `doc-${index}-${Date.now()}`,
          name: doc.name || 'Document',
          url: doc.url,
          file: doc.file,
          size: doc.size,
        };
      });
      setDocuments(normalizedDocs);
    } else {
      setDocuments([]);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (initialData) {
      setProjectTitle(initialData.projectTitle || '');
      setProjectType(initialData.projectType || '');
      setOrganizationClient(initialData.organizationClient || '');
      setCurrentlyWorking(initialData.currentlyWorking ?? false);
      setStartDate(initialData.startDate || '');
      setEndDate(initialData.endDate || '');
      setProjectDescription(initialData.projectDescription || '');
      setResponsibilities(initialData.responsibilities || '');
      setTechnologies(initialData.technologies || []);
      setProjectOutcome(initialData.projectOutcome || '');
      setProjectLink(initialData.projectLink || '');
    } else {
      // Reset all fields when initialData is undefined (Add mode)
      setProjectTitle('');
      setProjectType('');
      setOrganizationClient('');
      setCurrentlyWorking(false);
      setStartDate('');
      setEndDate('');
      setProjectDescription('');
      setResponsibilities('');
      setTechnologies([]);
      setProjectOutcome('');
      setProjectLink('');
      setDocuments([]);
    }
    setValidationError('');
    setFieldErrors({});
  }, [initialData, isOpen]);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    Array.from(e.target.files).forEach((file) => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only PDF, PNG, and JPG files are allowed.`);
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 10MB.`);
        return;
      }

      const newDoc: ProjectDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
      };
      setDocuments(prev => [...prev, newDoc]);
    });
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

    Array.from(e.dataTransfer.files).forEach((file) => {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file type: ${file.name}. Only PDF, PNG, and JPG files are allowed.`);
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File too large: ${file.name}. Maximum size is 10MB.`);
        return;
      }

      const newDoc: ProjectDocument = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        file,
        name: file.name,
        size: file.size,
      };
      setDocuments(prev => [...prev, newDoc]);
    });
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};

    if (!projectTitle.trim()) nextErrors.projectTitle = 'Project title is required.';
    if (!projectType.trim()) nextErrors.projectType = 'Project type is required.';
    if (!startDate.trim()) nextErrors.startDate = 'Start date is required.';
    if (!projectDescription.trim()) nextErrors.projectDescription = 'Project description is required.';

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

    onSave({
      projectTitle,
      projectType,
      organizationClient,
      currentlyWorking,
      startDate,
      endDate,
      projectDescription,
      responsibilities,
      technologies,
      projectOutcome,
      projectLink,
      documents,
    });
  };

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
            onClick={handleSave}
            disabled={!projectTitle.trim() || !projectType.trim() || !startDate.trim() || !projectDescription.trim()}
            className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isEditMode ? 'Update Project' : 'Save Project'}
          </button>
        </div>
      )}
    >
            <div className="space-y-6">
              {validationError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {validationError}
                </div>
              ) : null}
              {/* Project Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title <span className="text-red-500">*</span>
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.projectTitle ? 'border-red-400' : 'border-gray-300'}`}
                />
                {fieldErrors.projectTitle ? <p className="mt-1 text-xs text-red-600">{fieldErrors.projectTitle}</p> : null}
              </div>

              {/* Project Type and Organization / Client - Two Column */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Project Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={projectType}
                    onChange={(e) => {
                      setProjectType(e.target.value);
                      if (fieldErrors.projectType) {
                        setFieldErrors((prev) => ({ ...prev, projectType: '' }));
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.projectType ? 'border-red-400' : 'border-gray-300'}`}
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
                    Organization / Client <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={organizationClient}
                    onChange={(e) => setOrganizationClient(e.target.value)}
                    placeholder="If applicable — Company, University, or Client Name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        if (fieldErrors.startDate) {
                          setFieldErrors((prev) => ({ ...prev, startDate: '' }));
                        }
                      }}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.startDate ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9095A1] pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {fieldErrors.startDate ? <p className="mt-1 text-xs text-red-600">{fieldErrors.startDate}</p> : null}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-gray-500 text-xs">(Optional)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        if (fieldErrors.endDate) {
                          setFieldErrors((prev) => ({ ...prev, endDate: '' }));
                        }
                      }}
                      disabled={currentlyWorking}
                      className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${fieldErrors.endDate ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    <svg
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9095A1] pointer-events-none"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  {fieldErrors.endDate ? <p className="mt-1 text-xs text-red-600">{fieldErrors.endDate}</p> : null}
                </div>
              </div>

              {/* Project Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Description <span className="text-red-500">*</span>
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${fieldErrors.projectDescription ? 'border-red-400' : 'border-gray-300'}`}
                />
                {fieldErrors.projectDescription ? <p className="mt-1 text-xs text-red-600">{fieldErrors.projectDescription}</p> : null}
              </div>

              {/* Responsibilities / Contributions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responsibilities / Contributions <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={responsibilities}
                  onChange={(e) => setResponsibilities(e.target.value)}
                  placeholder="Mention what you contributed—features built, research done, tasks handled…"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Technologies / Tools Used */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technologies / Tools Used <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={technologiesInput}
                  onChange={(e) => setTechnologiesInput(e.target.value)}
                  onKeyPress={handleAddTechnology}
                  placeholder="Add technologies (e.g., React, Python, Figma, SQL)…"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  Project Outcome / Results <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={projectOutcome}
                  onChange={(e) => setProjectOutcome(e.target.value)}
                  placeholder="Mention improvements, results, metrics, awards, or impact…"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Project Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Link <span className="text-gray-500 text-xs">(Optional)</span>
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
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${fieldErrors.projectLink ? 'border-red-400' : 'border-gray-300'}`}
                />
                {fieldErrors.projectLink ? <p className="mt-1 text-xs text-red-600">{fieldErrors.projectLink}</p> : null}
              </div>

              {/* Upload Your Project Documents/Certificates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Project Documents/Certificates <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                    dragActive
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
                        </div>
                        <button
                          onClick={() => handleRemoveFile(doc.id)}
                          className="ml-3 text-red-500 hover:text-red-700 flex-shrink-0"
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
