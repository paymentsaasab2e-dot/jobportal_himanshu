"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Package, Box, Component, Settings } from "lucide-react";
import { ProductDeepDiveSection } from "@/app/(website)/employers/components";

export default function EmployerModulesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen font-sans bg-[#f7fbff] text-slate-950 flex flex-col selection:bg-sky-100 selection:text-sky-900">
      <main className="flex-1">
        {/* Modules Hero */}
        <section className="relative pt-32 pb-20 overflow-hidden bg-white border-b border-slate-100">
          <div className="mx-auto max-w-[1240px] px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-full px-5 py-2 mb-8">
              <Package className="w-4 h-4 text-emerald-600" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-600">Specialized Product Modules</span>
            </div>
            
            <h1 className="text-5xl lg:text-[64px] font-black text-slate-950 mb-8 tracking-tight leading-[1.05] max-w-4xl mx-auto">
              Precision tools for every <br/>
              <span className="text-emerald-600">business function.</span>
            </h1>
            
            <p className="text-xl text-slate-600 leading-relaxed font-medium mb-10 max-w-2xl mx-auto">
              Each module in the SAASA ecosystem is built for high-performance operations, ensuring your team has the exact tools they need for recruitment, CRM, and payroll.
            </p>

            <div className="flex justify-center mb-16">
              <button
                onClick={() => router.push('/whatsapp')}
                className="bg-emerald-600 text-white font-black px-12 py-5 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 text-[17px] flex items-center gap-3"
              >
                Configure Your Stack <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center gap-12 text-slate-400">
               {[
                 { label: "Core OS", icon: Box },
                 { label: "Add-ons", icon: Component },
                 { label: "API Ready", icon: Settings }
               ].map((item, i) => (
                 <div key={i} className="flex items-center gap-2">
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-widest">{item.label}</span>
                 </div>
               ))}
            </div>
          </div>
        </section>

        <ProductDeepDiveSection />

        {/* Final CTA Section */}
        <section className="py-32 bg-[#F0F9FF]">
           <div className="mx-auto max-w-[1000px] px-6 text-center">
              <h2 className="text-4xl lg:text-5xl font-black text-slate-950 mb-8 tracking-tight">
                Built for specific <br/>
                <span className="text-emerald-600">business outcomes.</span>
              </h2>
              <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto">
                Select only the modules you need, or deploy the full SAASA suite for maximum operational harmony.
              </p>
              <button
                onClick={() => router.push('/whatsapp')}
                className="bg-emerald-600 text-white font-black px-12 py-5 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 text-[17px]"
              >
                Access Modules Now
              </button>
           </div>
        </section>
      </main>
    </div>
  );
}


