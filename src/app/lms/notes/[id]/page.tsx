'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ArrowLeft, Pencil, Save, Trash2 } from 'lucide-react';
import { LMS_CARD_CLASS, LMS_PAGE_SUBTITLE } from '../../constants';
import { LmsCtaButton } from '../../components/ux/LmsCtaButton';
import { useLmsToast } from '../../components/ux/LmsToastProvider';
import type { NoteType } from '../../data/ai-mock';
import { LmsSkeleton } from '../../components/states/LmsSkeleton';
import { fetchNoteDetail, updateNote, deleteNote } from '../../api/client';

const NOTE_TYPES: NoteType[] = ['Interview Prep', 'Learning Notes', 'Company Research', 'Salary Research'];

function LmsNoteDetailPageFallback() {
  return (
    <div className={LMS_CARD_CLASS}>
      <LmsSkeleton lines={4} />
    </div>
  );
}

function LmsNoteDetailPageContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const toast = useLmsToast();

  const editMode = search.get('edit') === '1';

  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<any>(null);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<NoteType | string>('Learning Notes');
  const [body, setBody] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchNoteDetail(params.id);
        if (data) {
          setNote(data);
          setTitle(data.title);
          setType(data.type);
          setBody(data.body);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  if (loading) {
    return <LmsNoteDetailPageFallback />;
  }

  if (!note) {
    return (
      <div className="space-y-6">
        <Link href="/lms/notes" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to notes
        </Link>
        <div className={`${LMS_CARD_CLASS} text-sm text-gray-600 bg-rose-50/20 border-rose-100`}>
          <p className="font-bold text-rose-800">Note not found</p>
          <p className="mt-1">This note does not exist in your database or was removed.</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateNote(note.id, { title: title.trim() || note.title, body, type });
      toast.push({ title: 'Saved', message: 'Note updated in database.', tone: 'success' });
      setNote({ ...note, title: title.trim() || note.title, body, type });
      router.push(`/lms/notes/${note.id}`);
    } catch (err) {
      toast.push({ title: 'Error', message: 'Failed to update note.', tone: 'critical' });
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this note?')) {
        try {
            await deleteNote(note.id);
            toast.push({ title: 'Note deleted', message: 'Removed from database.', tone: 'success' });
            router.push('/lms/notes');
        } catch (err) {
            toast.push({ title: 'Error', message: 'Failed to delete note.', tone: 'critical' });
        }
    }
  };

  return (
    <div className="space-y-8">
      <div className="min-w-0">
        <Link href="/lms/notes" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to notes
        </Link>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{note.title}</h1>
        <p className={LMS_PAGE_SUBTITLE}>Stored directly in your MongoDB Database.</p>
      </div>

      <div className={`${LMS_CARD_CLASS} space-y-4`}>
        {editMode ? (
          <>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Title</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-gray-400">Type</span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as NoteType)}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 cursor-pointer"
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
                rows={12}
                className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 justify-between">
              <div className="flex flex-col sm:flex-row gap-2">
                <LmsCtaButton
                  variant="primary"
                  leftIcon={<Save className="h-4 w-4" strokeWidth={2} />}
                  onClick={handleSave}
                >
                  Save changes
                </LmsCtaButton>
                <LmsCtaButton variant="secondary" onClick={() => router.push(`/lms/notes/${note.id}`)}>
                  Cancel
                </LmsCtaButton>
              </div>
              
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-xl text-rose-600 px-4 py-2 text-sm font-semibold hover:bg-rose-50 transition-colors"
                onClick={handleDelete}
              >
                 <Trash2 className="h-4 w-4" />
                 Delete note
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-sm font-semibold text-gray-800">
                {note.type}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-xl text-rose-600 px-3 py-2 text-sm font-semibold hover:bg-rose-50 transition-colors"
                  onClick={handleDelete}
                >
                   <Trash2 className="h-4 w-4" />
                </button>
                <LmsCtaButton
                  variant="secondary"
                  leftIcon={<Pencil className="h-4 w-4" strokeWidth={2} />}
                  onClick={() => router.push(`/lms/notes/${note.id}?edit=1`)}
                >
                  Edit
                </LmsCtaButton>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last updated · {new Date(note.updatedAt).toLocaleDateString()}</p>
            <pre className="whitespace-pre-wrap text-sm font-normal text-gray-700 leading-relaxed font-sans mt-4">{note.body}</pre>
          </>
        )}
      </div>
    </div>
  );
}

export default function LmsNoteDetailPage() {
  return (
    <Suspense fallback={<LmsNoteDetailPageFallback />}>
      <LmsNoteDetailPageContent />
    </Suspense>
  );
}
