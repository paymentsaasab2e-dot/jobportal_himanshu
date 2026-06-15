'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import { LMS_CARD_CLASS } from '../../constants';
import { AISectionHeading } from '../../components/ai';
import { LmsStatusBadge } from '../../components/ux/LmsStatusBadge';
import {
  fetchQuizTopicSuggestions,
  generateQuizzesFromTopic,
  type GeneratedQuizSummary,
} from '../../api/client';
import { buildQuizAttemptHref, formatQuizDifficulty } from '../quiz-utils';
import { difficultyBadge } from '../quiz-page-helpers';

type QuizTopicGeneratorProps = {
  onGenerated?: (topic: string, quizzes: GeneratedQuizSummary[]) => void;
};

export function QuizTopicGenerator({ onGenerated }: QuizTopicGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedQuizzes, setGeneratedQuizzes] = useState<GeneratedQuizSummary[]>([]);
  const [activeTopic, setActiveTopic] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = topic.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setSuggestLoading(false);
      setSuggestError(null);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setSuggestLoading(true);
        setSuggestError(null);
        const next = await fetchQuizTopicSuggestions(query);
        if (!controller.signal.aborted) {
          setSuggestions(next);
        }
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setSuggestError('Unable to load suggestions right now.');
        }
      } finally {
        if (!controller.signal.aborted) {
          setSuggestLoading(false);
        }
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [topic]);

  useEffect(() => {
    const handleDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSuggestOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, []);

  const applySuggestion = (value: string) => {
    setTopic(value);
    setSuggestOpen(false);
    setHighlight(-1);
  };

  const handleGenerate = async (topicValue?: string) => {
    const value = (topicValue ?? topic).trim();
    if (value.length < 2 || generating) return;

    setTopic(value);
    setGenerating(true);
    setGenerateError(null);
    setSuggestOpen(false);

    try {
      const result = await generateQuizzesFromTopic(value);
      setActiveTopic(result.topic);
      setGeneratedQuizzes(result.quizzes);
      onGenerated?.(result.topic, result.quizzes);
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate quizzes.');
      setGeneratedQuizzes([]);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <AISectionHeading title="AI quiz generator" />
        <div className={`${LMS_CARD_CLASS} space-y-4`} ref={containerRef}>
          <p className="text-sm text-gray-600">
            Enter a topic and OpenAI will suggest ideas while you type, then create 5 practice quizzes for that topic.
          </p>

          <div className="relative">
            <label htmlFor="quiz-topic-input" className="text-sm font-semibold text-gray-900">
              Quiz topic
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <input
                id="quiz-topic-input"
                type="text"
                value={topic}
                onChange={(event) => {
                  setTopic(event.target.value);
                  setSuggestOpen(true);
                  setHighlight(-1);
                }}
                onFocus={() => setSuggestOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setHighlight((prev) => Math.min(prev + 1, suggestions.length - 1));
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setHighlight((prev) => Math.max(prev - 1, 0));
                  } else if (event.key === 'Enter') {
                    event.preventDefault();
                    if (highlight >= 0 && suggestions[highlight]) {
                      void handleGenerate(suggestions[highlight]);
                    } else {
                      void handleGenerate();
                    }
                  } else if (event.key === 'Escape') {
                    setSuggestOpen(false);
                    setHighlight(-1);
                  }
                }}
                placeholder="e.g. JavaScript, React Hooks, System Design"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none ring-[#28A8E1] transition focus:border-[#28A8E1] focus:ring-2"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => void handleGenerate()}
                disabled={topic.trim().length < 2 || generating}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {generating ? 'Generating…' : 'Generate 5 quizzes'}
              </button>
            </div>

            {suggestOpen && topic.trim().length >= 2 ? (
              <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {suggestLoading ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading OpenAI suggestions…
                  </div>
                ) : suggestions.length > 0 ? (
                  <ul>
                    {suggestions.map((suggestion, index) => (
                      <li key={suggestion}>
                        <button
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => applySuggestion(suggestion)}
                          className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition hover:bg-sky-50 ${
                            highlight === index ? 'bg-sky-50' : ''
                          }`}
                        >
                          <Sparkles className="h-4 w-4 text-[#28A8E1]" />
                          <span>{suggestion}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-500">
                    {suggestError || 'No suggestions yet. Press Enter to generate quizzes for this topic.'}
                  </p>
                )}
              </div>
            ) : null}
          </div>

          {generateError ? (
            <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {generateError}
            </p>
          ) : null}
        </div>
      </section>

      {generatedQuizzes.length > 0 ? (
        <section className="space-y-4">
          <AISectionHeading title={`Generated quizzes — ${activeTopic}`} />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {generatedQuizzes.map((quiz) => {
              const questionCount = quiz.totalQuestions ?? quiz.questionsCount ?? 5;
              const minutes = quiz.durationMinutes ?? quiz.estimatedMinutes ?? 8;
              const difficulty = formatQuizDifficulty(quiz.difficulty);

              return (
                <div key={quiz.id} className={`${LMS_CARD_CLASS} flex h-full flex-col justify-between gap-4`}>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
                      <LmsStatusBadge label="AI generated" tone="info" />
                    </div>
                    <p className="text-sm text-gray-600">{quiz.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {difficultyBadge(difficulty)}
                      <span className="self-center text-xs font-medium text-gray-500">
                        {questionCount} questions
                      </span>
                      <span className="self-center text-xs font-medium text-gray-500">{minutes} min</span>
                    </div>
                  </div>
                  <Link
                    href={buildQuizAttemptHref(quiz.id, quiz.skill ?? null)}
                    className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                  >
                    Start practice
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
