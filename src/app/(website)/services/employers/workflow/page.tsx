"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Workflow, Layers, CheckCircle2, Repeat } from "lucide-react";
import { ConnectedBusinessFlowSection, RoleBasedControlSection } from "@/app/(website)/employers/components";

export default function EmployerWorkflowPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen font-sans bg-[#f7fbff] text-slate-950 flex flex-col selection:bg-sky-100 selection:text-sky-900">
      <main className="flex-1">
        {/* Workflow Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden bg-white border-b border-slate-100">
          <div className="mx-auto max-w-[1240px] px-6 relative z-10">
            <div className="grid lg:grid-cols-[1fr_480px] gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full px-5 py-2 mb-8">
                  <Workflow className="w-4 h-4 text-indigo-600" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">Integrated Business Flow</span>
                </div>
                
                <h1 className="text-5xl lg:text-[64px] font-black text-slate-950 mb-8 tracking-tight leading-[1.05]">
                  Connected from <br/>
                  <span className="text-indigo-600">Lead to Onboarding.</span>
                </h1>
                
                <p className="text-xl text-slate-600 leading-relaxed font-medium mb-10 max-w-2xl">
                  Eliminate operational silos. Our unified workflow ensures every module hands off context seamlessly—from the first lead to the final payroll closure.
                </p>

                <div className="flex flex-wrap gap-5">
                  <button
                    onClick={() => router.push('/whatsapp')}
                    className="bg-slate-900 text-white font-black px-10 py-4.5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex items-center gap-3 active:scale-95"
                  >
                    Access Workflow Tools <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="hidden lg:block relative font-sans">
                 <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl p-8 space-y-6">
                    {[
                      { label: "Lead Captured", status: "Done", icon: CheckCircle2, color: "emerald" },
                      { label: "AI Shortlisting", status: "In Progress", icon: Repeat, color: "blue" },
                      { label: "Payroll Readiness", status: "Waiting", icon: Layers, color: "slate" }
                    ].map((step, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                         <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full bg-${step.color}-100 text-${step.color}-600 flex items-center justify-center`}>
                               <step.icon className="w-5 h-5" />
                            </div>
                            <span className="font-bold text-slate-900">{step.label}</span>
                         </div>
                         <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-${step.color}-50 text-${step.color}-700 border border-${step.color}-100`}>{step.status}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          </div>
        </section>

        <ConnectedBusinessFlowSection />
        <RoleBasedControlSection />

        {/* Final CTA Section */}
        <section className="py-32 bg-white">
           <div className="mx-auto max-w-[1000px] px-6 text-center">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-950 mb-8 tracking-tight">
                Connect your business <br/>
                <span className="text-indigo-600">from end-to-end.</span>
              </h2>
              <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto">
                Stop managing silos. Transition to a unified, autonomous workflow that scales with your growth.
              </p>
              <button
                onClick={() => router.push('/whatsapp')}
                className="bg-slate-950 text-white font-black px-12 py-5 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-indigo-950/20 active:scale-95 text-[17px]"
              >
                Join the Ecosystem
              </button>
           </div>
        </section>
      </main>
    </div>
  );
}


