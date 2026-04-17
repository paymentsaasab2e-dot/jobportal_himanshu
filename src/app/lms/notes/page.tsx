'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useMemo, useEffect } from 'react';
import { Plus, StickyNote, Sparkles, BookOpen, Link2, Search, X } from 'lucide-react';
import { LMS_CARD_CLASS, LMS_CARD_INTERACTIVE, LMS_PAGE_SUBTITLE, LMS_SECTION_TITLE } from '../constants';
import { AISectionHeading, AIActionChips, AIInsightCard } from '../components/ai';
import {
  notesAIChips,
  notesAIInsight,
  notesLearningEngineOutput,
  notesSmartLinkDemo,
  notesEmptyState,
  type NoteType,
} from '../data/ai-mock';
import { fetchNotes } from '../api/client';
import { LmsSkeleton } from '../components/states/LmsSkeleton';

function noteTypeStyle(t: NoteType | string) {
  const map: Record<string, string> = {
    'Interview Prep': 'bg-indigo-50 text-indigo-800 border-indigo-100',
    'Learning Notes': 'bg-emerald-50 text-emerald-900 border-emerald-100',
    'Company Research': 'bg-sky-50 text-sky-900 border-sky-100',
    'Salary Research': 'bg-amber-50 text-amber-900 border-amber-100',
  };
  return map[t] || 'bg-gray-50 text-gray-800 border-gray-200';
}

const NOTE_TYPES: NoteType[] = ['Interview Prep', 'Learning Notes', 'Company Research', 'Salary Research'];

export default function LmsNotesPage() {
  const router = useRouter();
  
  const [backendNotes, setBackendNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const data = await fetchNotes();
        setBackendNotes(data || []);
      } catch (err) {
        console.error('Failed to load notes', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const rawNotes = useMemo(() => {
    return backendNotes.map(n => ({
      id: n.id,
      title: n.title,
      body: n.body,
      type: n.type,
      updated: new Date(n.updatedAt).toLocaleDateString()
    }));
  }, [backendNotes]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | NoteType>('All');

  const displayNotes = useMemo(() => {
    return rawNotes.filter(note => {
      const matchesTab = activeTab === 'All' || note.type === activeTab;
      const lowerQ = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        note.title.toLowerCase().includes(lowerQ) || 
        note.body.toLowerCase().includes(lowerQ);
      return matchesTab && matchesSearch;
    });
  }, [rawNotes, searchQuery, activeTab]);

  const hasAnyNotes = rawNotes.length > 0;
  
  const handleAIChipClick = (action: { id: string, label: string }) => {
     let title = 'AI Generated Draft';
     let type: NoteType = 'Learning Notes';
     let body = 'AI draft template initialized...\\n\\n';
     
     if (action.id === 'sum') {
         title = 'Summary of recent topics';
         body += '- Core concepts extracted.\\n- Review required items highlighted.';
     } else if (action.id === 'flash') {
         title = 'Flashcard collection';
         body += 'Q: \\nA: \\n';
     } else if (action.id === 'quiz') {
         title = 'Generated mock questions';
         type = 'Interview Prep';
         body += 'Question 1: Explain the tradeoff between X and Y?';
     } else if (action.id === 'keys') {
         title = 'Key concepts extraction';
         body += 'Concept 1:\\n- Why it matters';
     } else if (action.id === 'interview') {
         title = 'Interview answer bank';
         type = 'Interview Prep';
     } else if (action.id === 'mockq') {
         title = 'Mock interview question set';
         type = 'Interview Prep';
     } else if (action.id === 'eli5') {
         title = 'Explain it like an interviewer';
         type = 'Interview Prep';
     }
     
     router.push(`/lms/notes/new?title=${encodeURIComponent(title)}&type=${encodeURIComponent(type)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="min-w-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1 tracking-tight">Notes</h1>
          <p className={LMS_PAGE_SUBTITLE}>
            Learning engine directly connected to your remote Database.
          </p>
        </div>
        <Link
          href="/lms/notes/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Create note
        </Link>
      </div>

      <section className="space-y-4 rounded-2xl border border-violet-100 bg-white/70 p-5 sm:p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <AISectionHeading title="AI note actions" />
        <AIActionChips actions={notesAIChips} onAction={handleAIChipClick} />
        <div className="pt-2">
          <AIInsightCard
            icon={Sparkles}
            title={notesAIInsight.title}
            recommendation={notesAIInsight.recommendation}
            scoreOrTag={notesAIInsight.badge}
            ctaLabel={notesAIInsight.ctaLabel}
            ctaHref="/lms/quizzes"
          />
        </div>
      </section>

      {hasAnyNotes ? (
        <section className="space-y-4">
          <AISectionHeading title="From your notes (live backend)" />
          <div className={`${LMS_CARD_CLASS} grid grid-cols-1 md:grid-cols-3 gap-4 border-violet-50 transition-all duration-200 hover:shadow-md`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Key concepts</p>
              <ul className="space-y-1 text-sm font-semibold text-gray-800">
                {notesLearningEngineOutput.concepts.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <BookOpen className="h-4 w-4 shrink-0 text-[#28A8E1] mt-0.5" strokeWidth={2} />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Quiz questions generated</p>
              <ul className="space-y-2 text-sm font-normal text-gray-600 list-decimal pl-4">
                {notesLearningEngineOutput.quizQuestions.map((q) => (
                  <li key={q}>{q}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3 flex flex-col justify-between">
              <div>
                 <p className="text-xs font-bold uppercase tracking-wide text-rose-800 mb-1">Weak area flagged</p>
                 <p className="text-sm font-semibold text-gray-900">{notesLearningEngineOutput.weakArea}</p>
              </div>
              <Link
                href="/lms/quizzes"
                className="mt-3 inline-block text-sm font-semibold text-[#28A8E1] hover:underline"
              >
                Open generated quizzes →
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className={LMS_SECTION_TITLE}>Recent</h2>
        
        {hasAnyNotes && (
           <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="relative flex-1">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                 <input 
                    type="text" 
                    placeholder="Search notes by title or content..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-[#28A8E1] focus:ring-1 focus:ring-[#28A8E1] outline-none"
                 />
                 {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                       <X className="h-4 w-4" />
                    </button>
                 )}
              </div>
              
              <select 
                 value={activeTab}
                 onChange={(e) => setActiveTab(e.target.value as 'All' | NoteType)}
                 className="w-full sm:w-48 px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:border-[#28A8E1] focus:ring-1 focus:ring-[#28A8E1] outline-none bg-white cursor-pointer"
              >
                 <option value="All">All Types</option>
                 {NOTE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
           </div>
        )}

        {loading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
             <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><LmsSkeleton lines={3} /></div>
             <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"><LmsSkeleton lines={3} /></div>
           </div>
        ) : !hasAnyNotes ? (
           // Global Empty State
          <div className={`${LMS_CARD_CLASS} text-center py-14 px-6 border-dashed border-2 border-gray-200 transition-all duration-200 hover:shadow-md`}>
            <StickyNote className="h-12 w-12 mx-auto text-gray-300 mb-4" strokeWidth={1.5} />
            <h3 className="text-lg font-bold text-gray-900">{notesEmptyState.title}</h3>
            <p className="mt-2 text-sm font-normal text-gray-500 max-w-md mx-auto">{notesEmptyState.body}</p>
            <Link
              href="/lms/notes/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:scale-[1.02] cursor-pointer"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              {notesEmptyState.cta}
            </Link>
          </div>
        ) : displayNotes.length === 0 ? (
           // Filter Empty State
           <div className="text-center py-12 px-6 rounded-xl border border-dashed border-gray-200 bg-gray-50">
             <Search className="h-10 w-10 mx-auto text-gray-300 mb-3" />
             <h3 className="text-base font-bold text-gray-900">No matching notes found</h3>
             <p className="mt-1 text-sm text-gray-500 mb-4">Try adjusting your search query or type filter.</p>
             <button
               onClick={() => { setSearchQuery(''); setActiveTab('All'); }}
               className="text-sm font-semibold text-[#28A8E1] hover:underline"
             >
               Clear all filters
             </button>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayNotes.map((note) => (
              <Link key={note.id} href={`/lms/notes/${note.id}`} className={LMS_CARD_INTERACTIVE}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-800 border border-yellow-100">
                    <StickyNote className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${noteTypeStyle(note.type)}`}
                    >
                      {note.type}
                    </span>
                    <h2 className="mt-2 text-base font-bold text-gray-900 leading-snug truncate">{note.title}</h2>
                    <p className="mt-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                      Updated · {note.updated}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
