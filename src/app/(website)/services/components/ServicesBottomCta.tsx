'use client';

import { useRouter } from 'next/navigation';
import { SVC_PRIMARY_BTN, SVC_SECONDARY_BTN } from '../constants';

export default function ServicesBottomCta() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden group">
      <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl rounded-[40px] border border-white/20 shadow-2xl transition-all group-hover:scale-[1.01]" />
      
      <div className="relative z-10 py-16 px-8 text-center max-w-3xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-black text-slate-950 mb-6 tracking-tight">
          Ready to fast-track your <br/>
          <span className="text-[#28A8DF]">career progression?</span>
        </h2>
        
        <p className="text-lg text-slate-500 font-medium mb-10 leading-relaxed">
          Unlock personalized guidance and premium tools. Join 50,000+ top candidates using the SAASA B2E ecosystem.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => router.push('/whatsapp')}
            className="bg-[#28A8DF] text-white font-black px-12 py-5 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-[17px] w-full sm:w-auto"
          >
            Access Platform Now
          </button>
          <button
            type="button"
            onClick={() => {
              const grid = document.getElementById('services-grid');
              grid?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-white border border-slate-200 text-slate-600 font-bold px-10 py-5 rounded-2xl hover:bg-slate-50 transition-all text-[17px] w-full sm:w-auto"
          >
            Review Catalog
          </button>
        </div>
      </div>
    </section>
  );
}
