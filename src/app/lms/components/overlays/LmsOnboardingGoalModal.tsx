'use client';

import { useState, useEffect, useRef } from 'react';
import { Target, Sparkles, ArrowRight, Loader2, Search } from 'lucide-react';
import { useLmsState } from '../../state/LmsStateProvider';
import { fetchGoalRecommendations } from '../../api/client';
import { showSuccessToast } from '@/components/common/toast/toast';

export function LmsOnboardingGoalModal({ onClose }: { onClose: () => void }) {
  const { setLmsGoalAction } = useLmsState();
  const [goal, setGoal] = useState('');
  const [isSetting, setIsSetting] = useState(false);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [showRecs, setShowRecs] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (goal.trim().length > 1) {
      setIsTyping(true);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      
      debounceTimer.current = setTimeout(async () => {
        try {
          const data = await fetchGoalRecommendations(goal);
          if (data && data.length > 0) {
            setRecommendations(data);
            setShowRecs(true);
          } else {
            setShowRecs(false);
          }
        } catch (err) {
          console.error('Recs failed:', err);
          setShowRecs(false);
        } finally {
          setIsTyping(false);
        }
      }, 500);
    } else {
      setShowRecs(false);
    }
  }, [goal]);

  const handleSetup = async (finalGoal?: string) => {
    const goalToSave = finalGoal || goal;
    if (!goalToSave.trim()) return;
    
    setIsSetting(true);
    try {
      await setLmsGoalAction(goalToSave);
      showSuccessToast('Learning goal saved', goalToSave);
      onClose();
    } catch (err) {
      console.error('Failed to set goal', err);
    } finally {
      setIsSetting(false);
    }
  };

  const selectRecommendation = (rec: string) => {
    setGoal(rec);
    setShowRecs(false);
    handleSetup(rec);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300 px-4">
      <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-5 duration-500 fill-mode-both">
        <div className="relative p-8 sm:p-10 text-center">
          {/* Decorative background glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-400/20 blur-[80px] pointer-events-none" />
          
          <div className="relative mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#28A8E1] to-blue-600 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50">
            <Target className="h-8 w-8" strokeWidth={2.5} />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
            What is your goal?
          </h2>
          <p className="text-slate-500 text-sm sm:text-[15px] font-medium max-w-[320px] mx-auto mb-10 leading-relaxed">
            Tell us your career ambition, and we'll orchestrate the entire LMS to get you there.
          </p>

          <div className="space-y-4">
            <div className="group relative">
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="I want to become a..."
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-4 text-slate-900 placeholder:text-slate-400 focus:border-[#28A8E1] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all duration-300 font-bold text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleSetup()}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-[#28A8E1] transition-colors" />
              </div>

              {/* AI Recommendations Dropdown */}
              {showRecs && !isSetting && (
                <div className="absolute top-full left-0 right-0 mt-2 z-10 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50 animate-in slide-in-from-top-2 duration-200">
                  <div className="bg-slate-50/50 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-50">
                    AI Suggestions
                  </div>
                  {recommendations.map((rec) => (
                    <button
                      key={rec}
                      onClick={() => selectRecommendation(rec)}
                      className="flex w-full items-center gap-3 px-6 py-4 text-left text-sm font-bold text-slate-700 hover:bg-sky-50 hover:text-[#28A8E1] transition-all group/item border-b border-slate-50 last:border-0"
                    >
                      <Sparkles className="h-4 w-4 text-sky-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      {rec}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => handleSetup()}
              disabled={!goal.trim() || isSetting}
              className={`group relative flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5 text-base font-bold text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-slate-200 active:scale-[0.98] disabled:opacity-50 disabled:grayscale disabled:scale-100 disabled:shadow-none`}
            >
              {isSetting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Orchestrating AI...
                </>
              ) : (
                <>
                  Setup LMS according to the goal
                  <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
                </>
              )}
            </button>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Personalized modules • Career Roadmaps • Mock Interviews
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
