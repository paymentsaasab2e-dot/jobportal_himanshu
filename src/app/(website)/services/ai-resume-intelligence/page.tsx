"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Target, ArrowRight, ShieldCheck, Zap, BrainCircuit, ScanSearch, FileEdit } from "lucide-react";

export default function AiIntelligenceServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen font-sans bg-white flex flex-col selection:bg-sky-100 selection:text-sky-900">
      <main className="flex-1">
        {/* Immersive Hero */}
        <section className="relative pt-44 pb-24 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-sky-50 to-transparent rounded-full blur-[120px] opacity-40 pointer-events-none" />
          
          <div className="mx-auto max-w-[1240px] px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2.5 bg-white border border-sky-100 rounded-full px-5 py-2.5 mb-10 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700">
              <Sparkles className="w-4.5 h-4.5 text-[#28A8DF] animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#28A8DF]">Next-Gen Resume Intelligence</span>
            </div>
            
            <h1 className="text-5xl lg:text-[72px] font-black text-slate-950 mb-8 tracking-tight leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-700">
              Preview how AI <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#28A8DF] via-[#28A8DF] to-indigo-600">decodes your career.</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-600 leading-relaxed font-medium mb-12 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-700 delay-150">
              Stop applying blindly. Use our suite of specialized AI tools to simulate enterprise hiring software and uncover exactly what's holding you back.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-in fade-in slide-in-from-bottom-16 duration-700 delay-300">
              <button
                onClick={() => router.push('/whatsapp')}
                className="group relative inline-flex items-center justify-center gap-3 bg-[#28A8DF] text-white font-bold px-10 py-5 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-[17px] w-full sm:w-auto"
              >
                Scan My Resume <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </button>
              <button
                onClick={() => router.push('/whatsapp')}
                className="inline-flex items-center justify-center gap-3 border border-slate-200 bg-white text-slate-900 font-bold px-10 py-5 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 text-[17px] w-full sm:w-auto"
              >
                Use AI CV Editor
              </button>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 bg-slate-50/50 border-y border-slate-100">
          <div className="mx-auto max-w-[1240px] px-6">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "X-Ray Formatting",
                  desc: "Expose hidden formatting triggers that cause 40% of resumes to be rejected by enterprise software immediately.",
                  icon: ScanSearch,
                  color: "blue"
                },
                {
                  title: "Keyword Matching",
                  desc: "Uncover exactly missing high-intent keywords that recruiters are searching for in your specific industry and role.",
                  icon: Target,
                  color: "indigo"
                },
                {
                  title: "Tone Refactoring",
                  desc: "AI-driven suggestions to swap passive verbs with high-impact leadership signals that double your interview callback rate.",
                  icon: FileEdit,
                  color: "emerald"
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-[32px] p-8 border border-slate-200/60 shadow-sm hover:shadow-md transition-all group">
                  <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-50 text-${feature.color}-600 flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-950 mb-4">{feature.title}</h3>
                  <p className="text-slate-500 font-medium leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Showcase */}
        <section className="py-32">
          <div className="mx-auto max-w-[1240px] px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-950 mb-8 tracking-tight">
                  The intelligence <br/> 
                  <span className="text-[#28A8DF]">behind the curtain.</span>
                </h2>
                <div className="space-y-8">
                  {[
                    {
                      label: "ATS Algorithm Simulation",
                      desc: "We mirror the parsing logic used by Workday, Greenhouse, and SAP SuccessFactors.",
                      icon: ShieldCheck
                    },
                    {
                      label: "Action Verb Impact",
                      desc: "Score your bullet points against our database of 200k+ high-performance CVs.",
                      icon: Zap
                    },
                    {
                      label: "AI Readability Metrics",
                      desc: "Ensure your content is optimized for both bots and human recruiters.",
                      icon: BrainCircuit
                    }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#28A8DF] border border-sky-100">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{item.label}</h4>
                        <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative rounded-[40px] bg-slate-950 p-10 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.15)]">
                 <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[80px]" />
                 
                 <div className="relative z-10 space-y-6 font-mono text-sm leading-relaxed">
                   <div className="flex items-center gap-2 mb-8">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                      <span className="text-slate-500 ml-2 font-sans font-bold text-[11px] uppercase tracking-widest px-3 border border-slate-800 rounded-full">AI Analysis Active</span>
                   </div>
                   
                   <p className="text-rose-400/80 line-through decoration-rose-500/50 decoration-2">- Led a team to complete project on time within budget.</p>
                   
                   <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6 relative group">
                      <div className="absolute -top-3 left-4 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-md">Optimized Result</div>
                      <p className="text-emerald-50 font-bold text-[15px] leading-relaxed">
                        Strategically <span className="text-emerald-400">orchestrated</span> a cross-functional squad of 12, delivering a $4M mission-critical initiative 2 weeks <span className="text-emerald-400">ahead of schedule</span> with 100% stakeholder buy-in.
                      </p>
                   </div>

                   <p className="text-slate-400 italic mt-8 text-xs font-sans">
                     * AI detected "Led" as a generic verb. Replacing with "Orchestrated" improved ATS authority score by 18.4%.
                   </p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-32 bg-[#FCFDFE]">
          <div className="mx-auto max-w-[1000px] px-6 text-center">
            <h2 className="text-4xl lg:text-5xl font-black text-slate-950 mb-8 tracking-tight">
              Ready to see yours?
            </h2>
            <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto">
              Join 50,000+ candidates who have optimized their applications and secured roles at top-tier companies.
            </p>
            <button
              onClick={() => router.push('/whatsapp')}
              className="bg-[#28A8DF] text-white font-bold px-12 py-5 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-[17px]"
            >
              Get Free Analysis
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}


