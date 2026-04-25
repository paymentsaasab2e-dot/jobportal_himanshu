'use client';

import { useState, useEffect, useRef } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { API_ORIGIN, resolveDocumentUrl } from '@/lib/api-base';
import DocumentViewerModal from './DocumentViewerModal';

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EducationData) => void;
  initialData?: EducationData;
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
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  currentlyStudying: boolean;
  grade: string;
  modeOfStudy: string;
  courseDuration: string;
  documents?: EducationDocument[];
}

export default function EducationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: EducationModalProps) {
  const [educationLevel, setEducationLevel] = useState(initialData?.educationLevel || '');
  const [degreeProgram, setDegreeProgram] = useState(initialData?.degreeProgram || '');
  const [institutionName, setInstitutionName] = useState(initialData?.institutionName || '');
  const [fieldOfStudy, setFieldOfStudy] = useState(initialData?.fieldOfStudy || '');
  const [startYear, setStartYear] = useState(initialData?.startYear || '');
  const [endYear, setEndYear] = useState(initialData?.endYear || '');
  const [currentlyStudying, setCurrentlyStudying] = useState(initialData?.currentlyStudying || false);
  const [grade, setGrade] = useState(initialData?.grade || '');
  const [modeOfStudy, setModeOfStudy] = useState(initialData?.modeOfStudy || '');
  const [courseDuration, setCourseDuration] = useState(initialData?.courseDuration || '');
  const [documents, setDocuments] = useState<EducationDocument[]>(initialData?.documents || []);
  const [dragActive, setDragActive] = useState(false);
  const [dateError, setDateError] = useState<string>('');
  
  // Preview Modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    url: '',
    name: '',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update values when initialData changes
  useEffect(() => {
    if (initialData) {
      setEducationLevel(initialData.educationLevel || '');
      setDegreeProgram(initialData.degreeProgram || '');
      setInstitutionName(initialData.institutionName || '');
      setFieldOfStudy(initialData.fieldOfStudy || '');
      setStartYear(initialData.startYear || '');
      setEndYear(initialData.endYear || '');
      setCurrentlyStudying(initialData.currentlyStudying || false);
      setGrade(initialData.grade || '');
      setModeOfStudy(initialData.modeOfStudy || '');
      setCourseDuration(initialData.courseDuration || '');
      
      // Normalize documents to ensure they all have unique IDs
      const normalizedDocuments: EducationDocument[] = (initialData.documents || []).map((doc, index) => {
        if (typeof doc === 'string') {
          // If it's a string (URL from database), convert to object
          return {
            id: `doc-${Date.now()}-${index}`,
            url: doc,
            name: doc.split('/').pop() || 'Document',
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
    } else {
      // Clear all fields for "Add" mode
      setEducationLevel('');
      setDegreeProgram('');
      setInstitutionName('');
      setFieldOfStudy('');
      setStartYear('');
      setEndYear('');
      setCurrentlyStudying(false);
      setGrade('');
      setModeOfStudy('');
      setCourseDuration('');
      setDocuments([]);
    }
  }, [initialData, isOpen]);

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
    let url = '';
    if (doc.url) {
      url = resolveDocumentUrl(doc.url);
    } else if (doc.file) {
      url = URL.createObjectURL(doc.file);
    }

    if (url) {
      setPreviewModal({
        isOpen: true,
        url: url,
        name: doc.name,
      });
    }
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

  const validateYearOrder = (start: string, end: string): string => {
    if (!start || !end) return '';
    if (Number(end) < Number(start)) {
      return 'End year must be after start year';
    }
    return '';
  };

  const handleStartYearChange = (value: string) => {
    setStartYear(value);
    setDateError('');
    // If end year exists and is now invalid, reset it
    if (endYear && value) {
      const error = validateYearOrder(value, endYear);
      if (error) {
        setEndYear('');
        setDateError(error);
      }
    }
  };

  const handleEndYearChange = (value: string) => {
    if (startYear && value) {
      const error = validateYearOrder(startYear, value);
      setDateError(error);
      if (!error) {
        setEndYear(value);
      }
    } else {
      setDateError('');
      setEndYear(value);
    }
  };

  const missingRequiredFields: string[] = [];
  if (!String(educationLevel || '').trim()) missingRequiredFields.push('Education Level');
  if (!String(degreeProgram || '').trim()) missingRequiredFields.push('Degree / Program');
  if (!String(institutionName || '').trim()) missingRequiredFields.push('Institution / University Name');
  if (!String(fieldOfStudy || '').trim()) missingRequiredFields.push('Field of Study / Major');
  
  if (!startYear) missingRequiredFields.push('Start Year');
  if (!currentlyStudying && !endYear) missingRequiredFields.push('End Year');
  
  if (!String(grade || '').trim()) missingRequiredFields.push('Grade / Percentage / GPA');
  if (!String(modeOfStudy || '').trim()) missingRequiredFields.push('Mode of Study');
  if (!String(courseDuration || '').trim()) missingRequiredFields.push('Course Duration');
  if (documents.length === 0) missingRequiredFields.push('Education Certificates/Documents');

  const isGradeNumeric = /^\d+(\.\d{1,2})?$/.test(String(grade || '').trim());
  const isCourseDurationNumeric = /^\d+(\.\d{1,2})?$/.test(String(courseDuration || '').trim());

  const hasDateOrderError =
    !currentlyStudying &&
    startYear &&
    endYear &&
    parseInt(endYear) < parseInt(startYear);

  const hasNumericError =
    (String(grade || '').trim().length > 0 && !isGradeNumeric) ||
    (String(courseDuration || '').trim().length > 0 && !isCourseDurationNumeric);

  const validationErrors: string[] = [];
  if (missingRequiredFields.length > 0) {
    validationErrors.push(`Missing required fields: ${missingRequiredFields.join(', ')}`);
  }
  if (hasDateOrderError) {
    validationErrors.push('End Year cannot be earlier than Start Year');
  }
  if (hasNumericError) {
    validationErrors.push('Please enter valid numeric values for Grade and Course Duration (e.g., 85.5 or 4)');
  }

  const isFormValid =
    missingRequiredFields.length === 0 &&
    !hasDateOrderError &&
    !hasNumericError;

  const handleSave = () => {
    if (!isFormValid) {
      alert(validationErrors.join('\n'));
      return;
    }

    onSave({
      id: initialData?.id,
      educationLevel,
      degreeProgram,
      institutionName,
      fieldOfStudy,
      startYear,
      endYear,
      currentlyStudying,
      grade,
      modeOfStudy,
      courseDuration,
      documents: documents.length > 0 ? documents : undefined,
    });
    onClose();
  };

  const inputClassName =
    'h-11 w-full rounded-lg border border-gray-200 px-4 text-sm text-gray-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300';
  const selectClassName =
    'h-11 w-full rounded-lg border border-gray-200 bg-white px-4 text-sm text-gray-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300';
  const textareaClassName =
    'min-h-[100px] w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-gray-300 resize-none';

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Add Education"
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
            disabled={!isFormValid}
            className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
          >
            Save Education
          </button>
        </div>
      )}
    >
            <div className="space-y-6">
              {/* Education Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Education Level <span className="text-amber-600">*</span>
                </label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className={`${selectClassName} ${!educationLevel && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  >
                    <option value="">Select Education Level</option>
                    <option value="High School">High School</option>
                    <option value="Associate Degree">Associate Degree</option>
                    <option value="Bachelor's Degree">Bachelor's Degree</option>
                    <option value="Master's Degree">Master's Degree</option>
                    <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Certification">Certification</option>
                  </select>
                  {!educationLevel && (
                    <p className="mt-1 text-xs text-amber-600">Education level is required</p>
                  )}
              </div>

              {/* Degree / Program */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Degree / Program <span className="text-amber-600">*</span>
                </label>
                  <input
                    type="text"
                    value={degreeProgram}
                    onChange={(e) => setDegreeProgram(e.target.value)}
                    placeholder="e.g., Bachelor of Computer Science"
                    className={`${inputClassName} ${!degreeProgram.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!degreeProgram.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Degree/Program is required</p>
                  )}
              </div>

              {/* Institution / University Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution / University Name <span className="text-amber-600">*</span>
                </label>
                  <input
                    type="text"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    placeholder="e.g., University of Mumbai"
                    className={`${inputClassName} ${!institutionName.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!institutionName.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Institution name is required</p>
                  )}
              </div>

              {/* Field of Study / Major */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field of Study / Major <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  value={fieldOfStudy}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="e.g., Computer Science"
                  className={`${inputClassName} ${!fieldOfStudy.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                />
                {!fieldOfStudy.trim() && (
                  <p className="mt-1 text-xs text-amber-600">Field of study is required</p>
                )}
              </div>

              {/* Dates Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Year <span className="text-amber-600">*</span>
                  </label>
                  <select
                    value={startYear}
                    onChange={(e) => handleStartYearChange(e.target.value)}
                    className={`${selectClassName} ${!startYear && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  >
                    <option value="">Select Start Year</option>
                    {startYearOptions.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {!startYear && (
                    <p className="mt-1 text-xs text-amber-600">Start year is required</p>
                  )}
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Year {!currentlyStudying && <span className="text-amber-600">*</span>}
                  </label>
                  <select
                    value={endYear}
                    onChange={(e) => handleEndYearChange(e.target.value)}
                    disabled={currentlyStudying}
                    className={`${selectClassName} disabled:bg-gray-100 disabled:cursor-not-allowed ${(!currentlyStudying && !endYear) || hasDateOrderError ? 'border-red-500 focus:ring-red-500 bg-red-50' : ''}`}
                  >
                    <option value="">Select End Year</option>
                    {endYearOptions.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {!currentlyStudying && !endYear && (
                    <p className="mt-1 text-xs text-amber-600">End year is required</p>
                  )}
                </div>
              </div>

              {/* Currently Studying Checkbox */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={currentlyStudying}
                    onChange={(e) => {
                      setCurrentlyStudying(e.target.checked);
                      if (e.target.checked) {
                        setEndYear('');
                        setDateError('');
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">I am currently studying here</span>
                </label>
                {dateError && (
                  <p className="mt-2 text-xs text-red-600">{dateError}</p>
                )}
              </div>

              {/* Academic Details Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Academic Details</h3>
                
                {/* Grade / Percentage / GPA */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grade / Percentage / GPA <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    placeholder="e.g., 8.2 or 78 or 3.5"
                    className={`${inputClassName} ${(!grade.trim() || (grade.trim().length > 0 && !isGradeNumeric)) && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!grade.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Grade is required</p>
                  )}
                  {grade.trim().length > 0 && !isGradeNumeric && (
                    <p className="mt-1 text-xs text-red-600">Enter a valid number (up to 2 decimals).</p>
                  )}
                </div>

                {/* Mode of Study */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mode of Study <span className="text-amber-600">*</span>
                  </label>
                  <select
                    value={modeOfStudy}
                    onChange={(e) => setModeOfStudy(e.target.value)}
                    className={`${selectClassName} ${!modeOfStudy.trim() && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  >
                    <option value="">Select Mode of Study</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Online">Online</option>
                    <option value="Distance Learning">Distance Learning</option>
                  </select>
                  {!modeOfStudy.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Mode of study is required</p>
                  )}
                </div>

                {/* Course Duration */}
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Course Duration <span className="text-amber-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={courseDuration}
                    onChange={(e) => setCourseDuration(e.target.value)}
                    placeholder="e.g., 3"
                    className={`${inputClassName} ${(!courseDuration.trim() || (courseDuration.trim().length > 0 && !isCourseDurationNumeric)) && 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500'}`}
                  />
                  {!courseDuration.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Course duration is required</p>
                  )}
                  {courseDuration.trim().length > 0 && !isCourseDurationNumeric && (
                    <p className="mt-1 text-xs text-red-600">Enter a valid number (up to 2 decimals).</p>
                  )}
                </div>
              </div>

              {/* Upload Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Education Certificates/Documents <span className="text-amber-600">*</span>
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
                      : documents.length === 0
                      ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500'
                      : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
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
                      className={documents.length === 0 ? 'text-red-400' : 'text-gray-400'}
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    <p className={`text-sm text-center ${documents.length === 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      <span className={documents.length === 0 ? 'text-amber-700 font-medium' : 'text-blue-600 font-medium'}>Click to upload</span> or drag and drop
                    </p>
                    <p className={`text-xs ${documents.length === 0 ? 'text-amber-600' : 'text-gray-500'}`}>PDF, PNG, JPG (Max 5MB per file)</p>
                  </div>
                </div>
                {documents.length === 0 && (
                  <p className="mt-1 text-xs text-amber-600">At least one document is required</p>
                )}

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
                            className="w-5 h-5 text-gray-400 flex-shrink-0"
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
                          {(doc.url || doc.file) && (
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

              {(missingRequiredFields.length > 0 || hasDateOrderError) && (
                <div className="rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2">
                  <p className="text-xs font-medium text-amber-700">
                    {missingRequiredFields.length > 0
                      ? `Missing required fields: ${missingRequiredFields.join(', ')}`
                      : 'Please fix validation errors before saving.'}
                  </p>
                  {hasDateOrderError && (
                    <p className="mt-1 text-xs font-medium text-amber-700">
                      End Year cannot be before Start Year.
                    </p>
                  )}
                </div>
              )}
            </div>

            <DocumentViewerModal
              isOpen={previewModal.isOpen}
              onClose={() => setPreviewModal({ ...previewModal, isOpen: false })}
              documentUrl={previewModal.url}
              documentName={previewModal.name}
            />
    </ProfileDrawer>
  );
}
