'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { Suspense, useState } from 'react';
import { LMS_CARD_CLASS, LMS_PAGE_SUBTITLE } from '../../constants';
import { useLmsToast } from '../../components/ux/LmsToastProvider';
import type { NoteType } from '../../data/ai-mock';
import { LmsCtaButton } from '../../components/ux/LmsCtaButton';
import { LmsSkeleton } from '../../components/states/LmsSkeleton';
import { createNote } from '../../api/client';

const NOTE_TYPES: NoteType[] = ['Interview Prep', 'Learning Notes', 'Company Research', 'Salary Research'];

function LmsNewNotePageFallback() {
  return (
    <div className={LMS_CARD_CLASS}>
      <LmsSkeleton lines={4} />
    </div>
  );
}

function LmsNewNotePageContent() {
  const router = useRouter();
  const search = useSearchParams();
  const toast = useLmsToast();

  const queryTitle = search.get('title');
  const queryType = search.get('type');
  const queryBody = search.get('body');

  const [title, setTitle] = useState(queryTitle || '');
  const [type, setType] = useState<NoteType>((queryType as NoteType) || 'Learning Notes');
  const [body, setBody] = useState(queryBody || '');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = title.trim().length > 2 && body.trim().length > 4 && !isSaving;

  const handleSave = async () => {
    if (!canSave) return;
    setIsSaving(true);
    try {
      const data = await createNote({ title: title.trim(), body: body.trim(), type });
      toast.push({ title: 'Note created', message: title.trim(), tone: 'success' });
      router.push(`/lms/notes/${data.id}`);
    } catch (err) {
      toast.push({ title: 'Error', message: 'Failed to create note.', tone: 'critical' });
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="min-w-0">
        <Link href="/lms/notes" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to notes
        </Link>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Create note</h1>
        <p className={LMS_PAGE_SUBTITLE}>Stored directly in your MongoDB Database.</p>
      </div>

      <div className={`${LMS_CARD_CLASS} space-y-4`}>
        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={isSaving}
            placeholder="e.g., Talking points for next screen"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Type</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as NoteType)}
            disabled={isSaving}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 cursor-pointer disabled:opacity-50"
          >
            {NOTE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Body</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isSaving}
            placeholder="Write your note…"
            rows={10}
            className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:opacity-50"
          />
        </label>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <LmsCtaButton
            variant="primary"
            disabled={!canSave}
            leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
            onClick={handleSave}
          >
            {isSaving ? 'Saving...' : 'Save note'}
          </LmsCtaButton>
          <LmsCtaButton variant="secondary" onClick={() => router.push('/lms/notes')} disabled={isSaving}>
            Cancel
          </LmsCtaButton>
        </div>
      </div>
    </div>
  );
}

export default function LmsNewNotePage() {
  return (
    <Suspense fallback={<LmsNewNotePageFallback />}>
      <LmsNewNotePageContent />
    </Suspense>
  );
}
