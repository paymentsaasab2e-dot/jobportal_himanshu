'use client';

import { useState, useEffect, KeyboardEvent } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';
import {
  profileFieldClass,
  profileTextareaClass,
  profileCancelBtnClass,
  profileSaveBtnClass,
} from '@/lib/profile-modal-ui';

interface SkillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: SkillsData) => void;
  initialData?: SkillsData;
}

export interface Skill {
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'Hard Skills' | 'Soft Skills' | 'Tools / Technologies';
}

export interface SkillsData {
  skills: Skill[];
  additionalNotes: string;
}

const AI_SUGGESTIONS = {
  'Hard Skills': ['Python', 'SQL', 'Data Analysis', 'JavaScript', 'HTML/CSS', 'Machine Learning', 'Cloud Computing', 'DevOps'],
  'Soft Skills': ['Communication', 'Problem Solving', 'Project Management', 'Leadership', 'Teamwork', 'Time Management', 'Critical Thinking'],
  'Tools / Technologies': ['Excel', 'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Jira', 'Slack'],
};

export default function SkillsModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: SkillsModalProps) {
  const [skills, setSkills] = useState<Skill[]>(initialData?.skills || []);
  const [skillInput, setSkillInput] = useState('');
  const [activeTab, setActiveTab] = useState<'Hard Skills' | 'Soft Skills' | 'Tools / Technologies'>('Hard Skills');
  const [additionalNotes, setAdditionalNotes] = useState(initialData?.additionalNotes || '');

  useEffect(() => {
    if (initialData) {
      setSkills(initialData.skills || []);
      setAdditionalNotes(initialData.additionalNotes || '');
    } else {
      setSkills([]);
      setAdditionalNotes('');
    }
  }, [initialData, isOpen]);

  const handleAddSkill = (skillName: string, category?: 'Hard Skills' | 'Soft Skills' | 'Tools / Technologies') => {
    const trimmed = skillName.trim();
    if (!trimmed || skills.length >= 30) return;

    const alreadyAdded = skills.some(
      (skill) => skill.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (alreadyAdded) {
      setSkillInput('');
      return;
    }

    const newSkill: Skill = {
      name: trimmed,
      proficiency: 'Intermediate',
      category: category || activeTab,
    };
    setSkills([...skills, newSkill]);
    setSkillInput('');
  };

  const addSkillFromInput = () => {
    handleAddSkill(skillInput);
  };

  const handleSkillInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkillFromInput();
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleProficiencyChange = (index: number, proficiency: 'Beginner' | 'Intermediate' | 'Advanced') => {
    const updatedSkills = [...skills];
    updatedSkills[index].proficiency = proficiency;
    setSkills(updatedSkills);
  };

  const isFormValid = skills.length > 0;

  const handleSave = () => {
    if (!isFormValid) {
      alert('Please add at least one skill.');
      return;
    }
    onSave({
      skills,
      additionalNotes,
    });
    onClose();
  };

  const filteredSuggestions = AI_SUGGESTIONS[activeTab].filter(
    (suggestion) => !skills.some((skill) => skill.name.toLowerCase() === suggestion.toLowerCase()),
  );

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Skills"
      widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
      footer={(
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={`${profileCancelBtnClass} !px-3.5 !py-1.5`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isFormValid}
            className={`${profileSaveBtnClass} !px-3.5 !py-1.5`}
          >
            Save Skills
          </button>
        </div>
      )}
    >
      <div className="space-y-3.5">
        <div>
          <label className="profile-modal-label mb-1 block">Add Skills</label>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillInputKeyDown}
              placeholder="Type a skill and press Enter..."
              className={`${profileFieldClass(skills.length === 0)} min-w-0 flex-1`}
            />
            <button
              type="button"
              onClick={addSkillFromInput}
              disabled={!skillInput.trim() || skills.length >= 30}
              className="profile-modal-btn h-[2.25rem] shrink-0 rounded-lg bg-blue-600 px-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {skills.length === 0 && (
            <p className="mt-0.5 text-[11px] text-amber-600">At least one skill is required</p>
          )}
          <p className="mt-0.5 text-[11px] text-gray-500">Allow up to ~30 skills</p>

          {skills.length > 0 && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {skills.map((skill, index) => (
                <div
                  key={`${skill.name}-${index}`}
                  className="skills-modal-chip flex min-w-0 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-1"
                >
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-gray-900" title={skill.name}>
                    {skill.name}
                  </span>
                  <select
                    value={skill.proficiency}
                    onChange={(e) =>
                      handleProficiencyChange(index, e.target.value as 'Beginner' | 'Intermediate' | 'Advanced')
                    }
                    className="skills-modal-chip-select w-[4.75rem] shrink-0 border border-gray-300 bg-white text-gray-700 focus:ring-1 focus:ring-blue-500"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Proficiency for ${skill.name}`}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(index)}
                    className="shrink-0 text-[#9095A1] hover:text-gray-600"
                    aria-label={`Remove ${skill.name}`}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex border-b border-gray-200">
            {(['Hard Skills', 'Soft Skills', 'Tools / Technologies'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`border-b-2 px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-2 min-h-[3rem] rounded-md bg-gray-50 p-2">
            <p className="text-[11px] leading-snug text-gray-500">
              Suggestions for {activeTab} will appear here when typing.
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            AI Suggestions for You
          </h3>
          <div className="flex flex-wrap gap-1">
            {filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleAddSkill(suggestion, activeTab)}
                className="rounded border border-gray-300 bg-white px-2 py-0.5 text-[11px] text-gray-700 transition-colors hover:border-blue-500 hover:text-blue-600"
              >
                {suggestion} <span className="font-medium text-blue-600">+ Add</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            Additional Notes <span className="text-[11px] font-normal text-gray-500">(Optional)</span>
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any relevant skill information, training, or certifications..."
            rows={3}
            className={`${profileTextareaClass} !min-h-[4.5rem] text-xs`}
          />
        </div>
      </div>
    </ProfileDrawer>
  );
}
