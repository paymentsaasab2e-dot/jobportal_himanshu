'use client';

import { useEffect, useState } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import { profileFieldClass, profileSelectClassName } from '@/lib/profile-modal-ui';

interface GapExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: GapExplanationData) => void;
  initialData?: GapExplanationData;
  gapInfo?: {
    gapYears: number;
    gapMonths: number;
    gapDays?: number;
    fromDate: string;
    toDate: string;
  };
}

export interface GapExplanationData {
  id?: string;
  gapCategory: string;
  reasonForGap: string;
  gapDuration: string;
  selectedSkills: string[];
  coursesText: string;
  preferredSupport: {
    flexibleRole: boolean;
    hybridRemote: boolean;
    midLevelReEntry: boolean;
    skillRefresher: boolean;
  };
}

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export default function GapExplanationModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  gapInfo,
}: GapExplanationModalProps) {
  const [gapCategory, setGapCategory] = useState(initialData?.gapCategory || '');
  const [reasonForGap, setReasonForGap] = useState(initialData?.reasonForGap || '');
  const [gapDuration, setGapDuration] = useState(initialData?.gapDuration || '');
  const [skillsInput, setSkillsInput] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialData?.selectedSkills || []);
  const [coursesText, setCoursesText] = useState(initialData?.coursesText || '');
  const [preferredSupport, setPreferredSupport] = useState(initialData?.preferredSupport || {
    flexibleRole: false,
    hybridRemote: false,
    midLevelReEntry: false,
    skillRefresher: false,
  });

  useEffect(() => {
    if (!isOpen) return;

    setGapCategory(initialData?.gapCategory || '');
    setReasonForGap(initialData?.reasonForGap || '');
    setGapDuration(initialData?.gapDuration || '');
    setSkillsInput('');
    setSelectedSkills(initialData?.selectedSkills || []);
    setCoursesText(initialData?.coursesText || '');
    setPreferredSupport(initialData?.preferredSupport || {
      flexibleRole: false,
      hybridRemote: false,
      midLevelReEntry: false,
      skillRefresher: false,
    });
  }, [isOpen, initialData]);

  const hasPreferredSupport = Object.values(preferredSupport).some(Boolean);
  const isFormValid = Boolean(
    gapCategory &&
    reasonForGap &&
    gapDuration &&
    selectedSkills.length > 0 &&
    coursesText.trim() &&
    hasPreferredSupport
  );

  const MAX_GAP_SKILLS = 30;

  const addSkill = () => {
    const skill = skillsInput.trim();
    if (!skill || selectedSkills.length >= MAX_GAP_SKILLS) return;
    if (selectedSkills.some((existing) => existing.toLowerCase() === skill.toLowerCase())) {
      setSkillsInput('');
      return;
    }
    setSelectedSkills([...selectedSkills, skill]);
    setSkillsInput('');
  };

  const handleSave = () => {
    if (!isFormValid) return;
    onSave({
      gapCategory,
      reasonForGap,
      gapDuration,
      selectedSkills,
      coursesText,
      preferredSupport,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Explain Employment Gap"
      widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
      footer={(
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className="h-10 rounded-lg bg-orange-500 px-5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300 disabled:hover:bg-orange-300"
          >
            Save Gap Details
          </button>
        </div>
      )}
    >
          <div className="space-y-6">
            {/* Gap Information Display */}
            {gapInfo && (
              <div className="space-y-4">
                {/* Gap Duration */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Gap Duration Detected:
                  </p>
                  <p className="text-2xl font-bold text-blue-900">
                    {gapInfo.gapYears > 0 && `${gapInfo.gapYears} ${gapInfo.gapYears === 1 ? 'Year' : 'Years'}`}
                    {gapInfo.gapMonths > 0 && `${gapInfo.gapYears > 0 ? ' ' : ''}${gapInfo.gapMonths} ${gapInfo.gapMonths === 1 ? 'Month' : 'Months'}`}
                    {gapInfo.gapDays !== undefined && gapInfo.gapDays > 0 && gapInfo.gapYears === 0 && gapInfo.gapMonths === 0 && `${gapInfo.gapDays} ${gapInfo.gapDays === 1 ? 'Day' : 'Days'}`}
                    {gapInfo.gapYears === 0 && gapInfo.gapMonths === 0 && (!gapInfo.gapDays || gapInfo.gapDays === 0) && 'Less than 1 day'}
                  </p>
                </div>

                {/* Date Range */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Gap Period:</p>
                  <div className="flex items-center gap-2 text-gray-900">
                    <span className="font-medium">{formatDateForDisplay(gapInfo.fromDate)}</span>
                    <span className="text-gray-400">to</span>
                    <span className="font-medium">{formatDateForDisplay(gapInfo.toDate)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Gap Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Gap Category
              </label>
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gapCategory"
                    value="Academic"
                    checked={gapCategory === 'Academic'}
                    onChange={(e) => setGapCategory(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Academic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gapCategory"
                    value="Professional"
                    checked={gapCategory === 'Professional'}
                    onChange={(e) => setGapCategory(e.target.value)}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Professional</span>
                </label>
              </div>
            </div>

            {/* Reason for Gap */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Gap
              </label>
              <select
                value={reasonForGap}
                onChange={(e) => setReasonForGap(e.target.value)}
                className={`${profileSelectClassName} ${!reasonForGap ? 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500' : ''}`}
              >
                <option value="">Select a reason</option>
                <option value="career-break">Career Break</option>
                <option value="family-care">Family Care</option>
                <option value="health-issues">Health Issues</option>
                <option value="education">Education</option>
                <option value="travel">Travel</option>
                <option value="other">Other</option>
              </select>
              {!reasonForGap && (
                <p className="mt-1 text-xs text-amber-600">Reason for gap is required</p>
              )}
            </div>

            {/* Gap Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gap Duration
              </label>
              <select
                value={gapDuration}
                onChange={(e) => setGapDuration(e.target.value)}
                className={`${profileSelectClassName} ${!gapDuration ? 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500' : ''}`}
              >
                <option value="">Select gap duration</option>
                <option value="Less than 3 months">Less than 3 months</option>
                <option value="3-6 months">3-6 months</option>
                <option value="6 months - 1 year">6 months - 1 year</option>
                <option value="1-2 years">1-2 years</option>
                <option value="More than 2 years">More than 2 years</option>
              </select>
              {!gapDuration && (
                <p className="mt-1 text-xs text-amber-600">Gap duration is required</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Pre-filled from onboarding — you can edit if incorrect.
              </p>
            </div>

            {/* Skills You Continued During the Gap */}
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">
                Skills You Continued During the Gap
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && skillsInput.trim()) {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Type a skill and press Enter..."
                  className={`${profileFieldClass(selectedSkills.length === 0)} min-w-0 flex-1`}
                />
                <button
                  type="button"
                  onClick={addSkill}
                  disabled={!skillsInput.trim() || selectedSkills.length >= MAX_GAP_SKILLS}
                  className="profile-modal-btn h-[2.25rem] shrink-0 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add
                </button>
              </div>
              {selectedSkills.length === 0 && (
                <p className="mt-0.5 text-[11px] text-amber-600">At least one skill is required</p>
              )}
              <p className="mt-0.5 text-[11px] text-gray-500">Allow up to ~30 skills</p>
              {selectedSkills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => {
                          setSelectedSkills(selectedSkills.filter((_, i) => i !== index));
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
            </div>

            {/* Courses, Trainings, or Certifications */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Courses, Trainings, or Certifications
              </label>
              <textarea
                value={coursesText}
                onChange={(e) => setCoursesText(e.target.value)}
                rows={4}
                className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${!coursesText.trim() ? 'border-amber-200 bg-amber-50/50 focus:ring-amber-500' : 'border-gray-300'}`}
                placeholder="e.g., Completed a Data Science bootcamp, obtained PMP certification, attended workshops on Agile methodologies."
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                }}
              />
              {!coursesText.trim() && (
                <p className="mt-1 text-xs text-amber-600">Course/training details are required</p>
              )}
            </div>

            {/* Preferred Support When Returning to Work */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Support When Returning to Work
              </label>
              <div className={`space-y-3 p-3 rounded-lg ${!hasPreferredSupport ? 'bg-red-50 border border-red-200' : ''}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferredSupport.flexibleRole}
                    onChange={(e) => setPreferredSupport({ ...preferredSupport, flexibleRole: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Flexible role</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferredSupport.hybridRemote}
                    onChange={(e) => setPreferredSupport({ ...preferredSupport, hybridRemote: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Hybrid / Remote</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferredSupport.midLevelReEntry}
                    onChange={(e) => setPreferredSupport({ ...preferredSupport, midLevelReEntry: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Mid-level re-entry roles</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferredSupport.skillRefresher}
                    onChange={(e) => setPreferredSupport({ ...preferredSupport, skillRefresher: e.target.checked })}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <span className="text-sm text-gray-700">Skill refresher recommendations</span>
                </label>
              </div>
              {!hasPreferredSupport && (
                <p className="mt-1 text-xs text-amber-600">Select at least one support option</p>
              )}
            </div>
          </div>
    </ProfileDrawer>
  );
}
