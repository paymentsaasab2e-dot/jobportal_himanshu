'use client';

import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import {
  buildAiSkillCoachPrompt,
  buildCvGapCoachItems,
  buildExperienceCoachItems,
  buildSkillWriteup,
  frameUserExperienceAnswer,
  type CvGapCoachItem,
} from '@/lib/cv-gap-coach';
import { WritingAssistField } from '@/components/common/WritingSuggestions';
import { generateSkillWriteupWithAi } from '@/app/lms/api/client';

type Props = {
  missingKeywords: string[];
  /** Existing skill names already on the CV — selectable for write-ups. */
  existingSkillNames?: string[];
  hasExperience: boolean;
  weakOrEmptyBullets: boolean;
  roleHint?: string;
  targetRole?: string;
  company?: string;
  jobDescriptionSnippet?: string;
  onAppendKeyword: (keyword: string) => void;
  onApplyFramed: (payload: {
    item: CvGapCoachItem;
    framed: string;
    skillWriteup?: string;
    applyAs: 'experience' | 'summary' | 'skills';
  }) => void;
};

function itemFromKeyword(keyword: string): CvGapCoachItem {
  const trimmed = keyword.trim() || 'Skill';
  const fromLib = buildCvGapCoachItems([trimmed])[0];
  if (fromLib) return fromLib;
  return {
    id: `skill-${trimmed.toLowerCase().replace(/\s+/g, '-')}`,
    keyword: trimmed,
    whyNeeded: '',
    conceptsLearned: [trimmed],
    jdShortlistNeeds: '',
    askInUserLanguage: `What have you done with ${trimmed}?`,
    tip: '',
    applyTarget: 'skills',
  };
}

export function CvGapCoach({
  missingKeywords,
  existingSkillNames = [],
  hasExperience,
  weakOrEmptyBullets,
  roleHint,
  targetRole,
  company,
  jobDescriptionSnippet,
  onAppendKeyword,
  onApplyFramed,
}: Props) {
  const items = useMemo(() => {
    const fromKeywords = buildCvGapCoachItems(missingKeywords);
    const fromExperience = buildExperienceCoachItems({
      hasExperience,
      weakOrEmptyBullets,
      roleHint,
    });
    const seen = new Set(
      [...fromExperience, ...fromKeywords].map((i) => i.keyword.toLowerCase()),
    );
    const fromExisting: CvGapCoachItem[] = [];
    for (const name of existingSkillNames) {
      const key = name.trim();
      if (!key || seen.has(key.toLowerCase())) continue;
      seen.add(key.toLowerCase());
      fromExisting.push(itemFromKeyword(key));
    }
    return [...fromExperience, ...fromKeywords, ...fromExisting].slice(0, 20);
  }, [
    existingSkillNames,
    hasExperience,
    missingKeywords,
    roleHint,
    weakOrEmptyBullets,
  ]);

  const [mode, setMode] = useState<'select' | 'manual'>('select');
  const [activeId, setActiveId] = useState<string>('');
  const [manualSkill, setManualSkill] = useState('');
  const [description, setDescription] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      setMode('manual');
      return;
    }
    if (mode === 'select' && !items.some((i) => i.id === activeId)) {
      setActiveId(items[0].id);
    }
  }, [activeId, items, mode]);

  const active: CvGapCoachItem =
    mode === 'manual'
      ? itemFromKeyword(manualSkill.trim() || 'Skill')
      : items.find((i) => i.id === activeId) || items[0] || itemFromKeyword('Skill');

  const applyToCv = (writeup: string, alsoExperience = false) => {
    const text = writeup.trim();
    if (!text) return;
    onApplyFramed({
      item: active,
      framed: text,
      skillWriteup: text,
      applyAs: 'skills',
    });
    if (alsoExperience && active.applyTarget !== 'skills') {
      const result = frameUserExperienceAnswer(description || text, active);
      onApplyFramed({
        item: active,
        framed: result.framed || text,
        skillWriteup: text,
        applyAs: active.applyTarget,
      });
    }
    setDescription('');
  };

  const runAiAndApply = async () => {
    const skillName = mode === 'manual' ? manualSkill.trim() : active.keyword.trim();
    if (!skillName) return;

    const coachItem = itemFromKeyword(skillName);
    setAiBusy(true);
    try {
      const prompt = buildAiSkillCoachPrompt(coachItem, {
        userAnswer: description,
        targetRole: targetRole || roleHint,
        company,
        jobDescriptionSnippet,
      });
      const aiText = await generateSkillWriteupWithAi({
        promptContent: prompt,
        targetRole: targetRole || roleHint || 'Professional',
      });
      const fallback = buildSkillWriteup(coachItem, {
        userAnswer: description,
        targetRole,
        company,
        jobDescriptionSnippet,
      });
      const finalText = aiText || fallback;
      onApplyFramed({
        item: coachItem,
        framed: finalText,
        skillWriteup: finalText,
        applyAs: 'skills',
      });
      if (coachItem.applyTarget !== 'skills') {
        const result = frameUserExperienceAnswer(description || finalText, coachItem);
        onApplyFramed({
          item: coachItem,
          framed: result.framed || finalText,
          skillWriteup: finalText,
          applyAs: coachItem.applyTarget,
        });
      }
      setDescription('');
      if (mode === 'manual') setManualSkill('');
    } catch {
      const fallback = buildSkillWriteup(coachItem, {
        userAnswer: description,
        targetRole,
        company,
        jobDescriptionSnippet,
      });
      applyToCv(fallback, coachItem.applyTarget !== 'skills');
    } finally {
      setAiBusy(false);
    }
  };

  const canGenerate =
    !aiBusy &&
    (mode === 'manual' ? Boolean(manualSkill.trim()) : Boolean(active?.keyword));

  return (
    <div className="mt-3 space-y-2.5 rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[11px] font-semibold text-sky-700">AI coach</p>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-0.5">
        <button
          type="button"
          onClick={() => setMode('select')}
          disabled={items.length === 0}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${
            mode === 'select' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Select skill
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex-1 rounded-md px-2 py-1.5 text-xs font-semibold transition ${
            mode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
          }`}
        >
          Add manually
        </button>
      </div>

      {mode === 'select' && items.length > 0 ? (
        <select
          value={activeId || items[0]?.id || ''}
          onChange={(e) => setActiveId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-800 outline-none focus:border-sky-400"
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.keyword}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={manualSkill}
          onChange={(e) => setManualSkill(e.target.value)}
          placeholder="Skill name (e.g. Jest, TypeScript)"
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
        />
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <WritingAssistField
          value={description}
          onChange={setDescription}
          rows={2}
          placeholder="Short description…"
          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-sky-400"
          wrapperClassName="min-w-0 w-full flex-1"
        />
        <button
          type="button"
          onClick={() => void runAiAndApply()}
          disabled={!canGenerate}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-40 sm:min-w-[7.5rem]"
        >
          {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          Generate AI
        </button>
      </div>

      {mode === 'select' && active?.keyword ? (
        <button
          type="button"
          onClick={() => onAppendKeyword(active.keyword)}
          className="text-[11px] text-slate-400 hover:text-slate-600"
        >
          Add “{active.keyword}” as keyword only
        </button>
      ) : mode === 'manual' && manualSkill.trim() ? (
        <button
          type="button"
          onClick={() => {
            onAppendKeyword(manualSkill.trim());
            setManualSkill('');
          }}
          className="text-[11px] text-slate-400 hover:text-slate-600"
        >
          Add “{manualSkill.trim()}” as keyword only
        </button>
      ) : null}
    </div>
  );
}
