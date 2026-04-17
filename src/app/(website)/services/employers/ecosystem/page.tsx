"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Building2, Globe, ShieldCheck, Zap } from "lucide-react";
import { EcosystemOverviewSection, WhyCompaniesNeedThisSection } from "@/app/(website)/employers/components";

export default function EmployerEcosystemPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen font-sans bg-[#f7fbff] text-slate-950 flex flex-col selection:bg-sky-100 selection:text-sky-900">
      <main className="flex-1">
        {/* Dynamic Enterprise Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden bg-white border-b border-slate-100">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(40,168,223,0.05),transparent_50%)]" />
          
          <div className="mx-auto max-w-[1240px] px-6 relative z-10">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-full px-5 py-2 mb-8">
                <Building2 className="w-4 h-4 text-[#28A8DF]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#28A8DF]">Enterprise Ecosystem</span>
              </div>
              
              <h1 className="text-5xl lg:text-[64px] font-black text-slate-950 mb-8 tracking-tight leading-[1.05]">
                One operating layer for <br/>
                <span className="text-[#28A8DF]">modern employers.</span>
              </h1>
              
              <p className="text-xl text-slate-600 leading-relaxed font-medium mb-10 max-w-2xl">
                SAASA B2E combines hiring, workforce operations, payroll, CRM, and executive reporting into one connected, autonomous command center.
              </p>

              <div className="flex flex-wrap gap-5">
                <button
                  onClick={() => router.push('/whatsapp')}
                  className="bg-[#28A8DF] text-white font-bold px-10 py-4.5 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-sky-500/20 flex items-center gap-3 active:scale-95"
                >
                  Access Enterprise Hub <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Core Content */}
        <EcosystemOverviewSection />
        <WhyCompaniesNeedThisSection />

        {/* Global Scalability Strip */}
        <section className="py-20 bg-slate-900 text-white overflow-hidden relative">
           <div className="absolute top-0 right-0 w-[600px] h-full bg-blue-600/10 blur-[120px] rounded-full translate-x-1/2 pointer-events-none" />
           
           <div className="mx-auto max-w-[1240px] px-6 relative z-10">
              <div className="grid lg:grid-cols-2 gap-20 items-center">
                 <div>
                    <h2 className="text-4xl font-black mb-6 tracking-tight">Built for scale. <br/> Designed for trust.</h2>
                    <p className="text-lg text-slate-400 font-medium leading-relaxed mb-10">
                       Whether you're managing a team of 50 or 5,000, our infrastructure ensures data isolation, role-based security, and zero-latency operations.
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-6">
                       {[
                         { label: "ISO Certified", icon: ShieldCheck },
                         { label: "Global Uptime", icon: Globe },
                         { label: "Instant Sync", icon: Zap },
                         { label: "Multi-Tenant", icon: Building2 }
                       ].map((item, i) => (
                         <li key={i} className="flex items-center gap-3 text-slate-300 font-bold">
                            <item.icon className="w-5 h-5 text-sky-400" /> {item.label}
                         </li>
                       ))}
                    </ul>
                 </div>
                 
                 <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#28A8DF] to-indigo-600 rounded-[32px] blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="relative bg-slate-800 border border-white/10 rounded-[32px] p-8 lg:p-12">
                       <p className="text-slate-400 font-mono text-sm leading-relaxed mb-6">
                          // Enterprise Connectivity Layer <br/>
                          CONNECTED_DEVICES: 4,000+ <br/>
                          BIOMETRIC_SYNC: ACTIVE <br/>
                          LEDGER_RECONCILIATION: COMPLETED
                       </p>
                       <div className="h-2 bg-slate-700 rounded-full w-full mb-4">
                          <div className="h-full bg-sky-400 rounded-full w-[94%]" />
                       </div>
                       <p className="text-[12px] font-black uppercase tracking-widest text-[#28A8DF]">System Reliability: 99.98%</p>
                    </div>
                 </div>
              </div>
           </div>
        </section>

        {/* Final CTA Strip */}
        <section className="py-32 bg-[#F8FAFC]">
           <div className="mx-auto max-w-[1000px] px-6 text-center">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-950 mb-8 tracking-tight">
                Secure your enterprise <br/>
                <span className="text-[#28A8DF]">command center today.</span>
              </h2>
              <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto">
                Ready to transform your recruitment and HR operations with the SAASA B2E ecosystem? Join the future of workforce management.
              </p>
              <button
                onClick={() => router.push('/whatsapp')}
                className="bg-[#28A8DF] text-white font-black px-12 py-5 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-sky-500/20 active:scale-95 text-[17px]"
              >
                Access Enterprise Portal
              </button>
           </div>
        </section>
      </main>
    </div>

  );
}


