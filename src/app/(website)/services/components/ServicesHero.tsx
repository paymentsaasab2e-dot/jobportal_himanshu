'use client';

import { useRouter } from 'next/navigation';
import {
  FileCheck,
  TrendingUp,
  Sparkles,
  Target,
  ArrowRight
} from 'lucide-react';
import { SVC_PRIMARY_BTN, SVC_SECONDARY_BTN } from '../constants';

const FLOATING_CARDS = [
  {
    icon: FileCheck,
    label: 'Resume Score',
    value: '+34%',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
  },
  {
    icon: Target,
    label: 'Interview Readiness',
    value: '88/100',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
  },
  {
    icon: TrendingUp,
    label: 'Skill Growth',
    value: '3 gaps found',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
  },
];

export default function ServicesHero() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden group">
      {/* Cinematic Gradient Background */}
      <div className="absolute inset-0 bg-slate-950 rounded-[40px] overflow-hidden">
        <div className="absolute -top-24 -right-24 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-[500px] w-[500px] rounded-full bg-indigo-500/10 blur-[100px]" />
      </div>

      <div className="relative z-10 p-8 lg:p-20 flex flex-col lg:flex-row items-center gap-16">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 mb-8 backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-sky-400">Career Intelligence Platform</span>
          </div>

          <h1 className="text-4xl lg:text-[64px] font-black text-white mb-8 tracking-tight leading-[1.05]">
            Power your next <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-400">career upgrade.</span>
          </h1>

          <p className="text-xl text-slate-400 leading-relaxed font-medium mb-10 max-w-2xl mx-auto lg:mx-0">
            From ATS resume intelligence to executive profile optimization. Access the suite of tools used by top industry professionals to dominate their market.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
            <button
              onClick={() => router.push('/whatsapp')}
              className="bg-sky-500 text-slate-950 font-black px-12 py-5 rounded-2xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-[17px] flex items-center justify-center gap-3 w-full sm:w-auto"
            >
              Start Your Free Hack <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                const grid = document.getElementById('services-grid');
                grid?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white/5 border border-white/10 text-white font-bold px-10 py-5 rounded-2xl hover:bg-white/10 transition-all text-[17px] w-full sm:w-auto"
            >
              Browse Ecosystem
            </button>
          </div>
        </div>

        {/* Dynamic visual representation */}
        <div className="hidden lg:block relative shrink-0">
           <div className="grid grid-cols-2 gap-4 w-[400px]">
              {FLOATING_CARDS.map((card, idx) => (
                <div key={card.label} className={`p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:scale-105 ${idx === 1 ? 'translate-y-8' : ''}`}>
                   <div className={`w-12 h-12 rounded-2xl ${card.bg} border ${card.border} flex items-center justify-center mb-6`}>
                      <card.icon strokeWidth={2.5} className={`w-6 h-6 ${card.color}`} />
                   </div>
                   <p className="text-white font-black text-lg">{card.value}</p>
                   <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mt-1">{card.label}</p>
                </div>
              ))}
              <div className="p-6 rounded-3xl border border-sky-500/20 bg-sky-500/10 backdrop-blur-sm flex items-center justify-center">
                 <div className="text-center">
                    <p className="text-sky-400 font-black text-2xl">99%</p>
                    <p className="text-sky-400/60 text-[10px] font-black uppercase tracking-widest mt-1">Accuracy</p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </section>

  );
}
