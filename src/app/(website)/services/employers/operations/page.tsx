"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Cpu, Bot, Smartphone, Terminal, Radio } from "lucide-react";
import { AiLayerSection, IntegrationsSection, MobileCompanionSection } from "@/app/(website)/employers/components";

export default function EmployerOperationsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen font-sans bg-[#f7fbff] text-slate-950 flex flex-col selection:bg-sky-100 selection:text-sky-900">
      <main className="flex-1">
        {/* Operations Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden bg-slate-950 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(40,168,223,0.1),transparent_50%)]" />
          
          <div className="mx-auto max-w-[1240px] px-6 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-5 py-2 mb-8">
                  <Cpu className="w-4 h-4 text-sky-400" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-sky-400">AI & Operational Intelligence</span>
                </div>
                
                <h1 className="text-5xl lg:text-[64px] font-black text-white mb-8 tracking-tight leading-[1.05]">
                  Autonomous <br/>
                  <span className="text-sky-400">Operations Layer.</span>
                </h1>
                
                <p className="text-xl text-slate-400 leading-relaxed font-medium mb-10 max-w-2xl">
                  Useful AI, integrated mobile experiences, and enterprise-grade connectivity. We automate the repetitive so your team can focus on the strategic.
                </p>

                <div className="flex flex-wrap gap-5 mt-10">
                   <button
                     onClick={() => router.push('/whatsapp')}
                     className="bg-sky-500 text-slate-950 font-black px-12 py-5 rounded-2xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-[17px] flex items-center gap-3"
                   >
                     Access Operations Hub <ArrowRight className="w-5 h-5" />
                   </button>
                </div>
              </div>

              <div className="hidden lg:block relative">
                 <div className="bg-slate-900 rounded-[40px] border border-white/10 p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/10 rounded-full blur-[60px]" />
                    <div className="space-y-6">
                       <div className="flex items-center justify-between pb-6 border-b border-white/5">
                          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest transition-colors group-hover:text-sky-400 flex items-center gap-2">
                             <Terminal className="w-4 h-4" /> System Health
                          </p>
                          <span className="text-emerald-400 text-xs font-black uppercase">Live</span>
                       </div>
                       <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500">AI Throughput</p>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-sky-500 rounded-full w-[82%]" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-500">Sync Latency</p>
                          <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div className="h-full bg-emerald-500 rounded-full w-[14%]" />
                          </div>
                          <p className="text-[10px] text-slate-600 font-bold">OPTIMAL: 14ms</p>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-white">
          <AiLayerSection />
          <IntegrationsSection />
          <MobileCompanionSection />
        </div>

        {/* Final CTA Section */}
        <section className="py-32 bg-slate-950 text-white">
           <div className="mx-auto max-w-[1000px] px-6 text-center">
              <h2 className="text-4xl lg:text-5xl font-black text-white mb-8 tracking-tight">
                Scale your intelligence <br/>
                <span className="text-sky-400">layer exponentially.</span>
              </h2>
              <p className="text-xl text-slate-400 font-medium mb-12 max-w-2xl mx-auto">
                Join the league of forward-thinking enterprises automating their core operations with SAASA B2E's AI layer.
              </p>
              <button
                onClick={() => router.push('/whatsapp')}
                className="bg-sky-500 text-slate-950 font-black px-12 py-5 rounded-2xl hover:bg-sky-400 transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-[17px]"
              >
                Access Command Center
              </button>
           </div>
        </section>
      </main>
    </div>

  );
}


