"use client";

import { useRouter } from "next/navigation";
import { Search, FileText, Target, ArrowRight, Star, ShieldCheck, Crown, Presentation, Users2 } from "lucide-react";

const SERVICES = [
  {
    id: "resume-review",
    title: "Executive Resume Crafting",
    shortDescription: "A bespoke, narrative-driven resume rebuild by senior talent partners targeting CXO and VP level mandates.",
    icon: Crown,
    badge: "Elite Tier",
    perks: ["1-on-1 Strategy Call", "Board-Ready Format", "Keyword Optimization"]
  },
  {
    id: "mock-interview",
    title: "Boardroom Simulation",
    shortDescription: "High-stakes mock interview sessions with veteran industry leaders to refine your executive presence and delivery.",
    icon: Presentation,
    badge: "Expert Led",
    perks: ["Behavioral Psychometry", "Industry Specific Case", "Video Analysis"]
  },
  {
    id: "career-coaching",
    title: "Leadership Strategy",
    shortDescription: "Long-term career mapping for established leaders navigating complex transitions or multi-national transfers.",
    icon: Target,
    badge: "Advisory",
    perks: ["Market Intelligence", "Transition Roadmap", "Negotiation Support"]
  }
];

export default function ExecutiveServicesPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen font-sans bg-slate-950 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      <main className="flex-1">
        {/* Cinematic Hero */}
        <section className="relative pt-52 pb-32 overflow-hidden bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none" />
          
          <div className="mx-auto max-w-[1360px] px-4 sm:px-5 lg:px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-5 py-2 mb-10">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-amber-400">Premium Portfolio</span>
            </div>
            
            <h1 className="text-5xl lg:text-[76px] font-black text-white mb-8 tracking-tight leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000">
              Personalized <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">Executive Support.</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-400 leading-relaxed font-medium mb-12 max-w-3xl mx-auto">
              When algorithms aren't enough, connect with verified industry leaders for bespoke career transformation and high-stakes interview preparation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={() => router.push('/whatsapp')}
                className="bg-amber-500 text-slate-950 font-black px-12 py-5 rounded-2xl hover:bg-amber-400 transition-all shadow-2xl shadow-amber-500/20 active:scale-95 text-[17px]"
              >
                Access Elite Services
              </button>
            </div>
          </div>
        </section>

        {/* The Elite Grid */}
        <section className="py-24 bg-white relative">
           <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-slate-950 to-transparent pointer-events-none" />
           
           <div className="mx-auto max-w-[1360px] px-4 sm:px-5 lg:px-6">
              <div className="grid lg:grid-cols-3 gap-8">
                {SERVICES.map((service, i) => (
                  <div key={service.id} className="group relative bg-white border border-slate-200 rounded-[32px] p-10 hover:shadow-[0_40px_80px_rgba(15,23,42,0.12)] hover:-translate-y-2 transition-all duration-500 flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                       <div className="w-16 h-16 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <service.icon className="w-8 h-8" />
                       </div>
                       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 bg-amber-50 border border-amber-100 px-4 py-1.5 rounded-full">{service.badge}</span>
                    </div>

                    <h3 className="text-2xl font-black text-slate-950 mb-4 tracking-tight leading-tight">{service.title}</h3>
                    <p className="text-[16px] font-medium text-slate-500 leading-relaxed mb-8 flex-1">{service.shortDescription}</p>

                    <ul className="space-y-4 mb-10 border-t border-slate-100 pt-8">
                       {service.perks.map((perk, idx) => (
                         <li key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                           <ShieldCheck className="w-4 h-4 text-emerald-500" /> {perk}
                         </li>
                       ))}
                    </ul>

                    <button 
                      onClick={() => router.push('/whatsapp')}
                      className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-2xl group-hover:bg-slate-950 group-hover:text-white group-hover:border-slate-950 transition-all flex items-center justify-center gap-2"
                    >
                      Learn More <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
           </div>
        </section>

        {/* Credibility Strip */}
        <section className="py-24 bg-slate-50 border-y border-slate-200/60">
           <div className="mx-auto max-w-[1360px] px-4 sm:px-5 lg:px-6">
              <div className="grid md:grid-cols-4 gap-12 text-center">
                 {[
                   { label: "Expert Partners", val: "200+", icon: Users2 },
                   { label: "Average Hike", val: "45%", icon: Target },
                   { label: "Success Rate", val: "94%", icon: ShieldCheck },
                   { label: "Elite Tier", val: "Exclusive", icon: Star }
                 ].map((stat, i) => (
                    <div key={i}>
                       <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-400 mb-4">
                          <stat.icon className="w-5 h-5" />
                       </div>
                       <p className="text-3xl font-black text-slate-950 mb-1">{stat.val}</p>
                       <p className="text-xs font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
                    </div>
                 ))}
              </div>
           </div>
        </section>

        {/* Private Consultation CTA */}
        <section className="py-32 bg-white">
           <div className="mx-auto max-w-[1000px] px-6 text-center">
              <div className="bg-slate-950 rounded-[48px] p-12 lg:p-20 relative overflow-hidden shadow-[0_40px_100px_rgba(15,23,42,0.3)]">
                 <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px]" />
                 
                 <h2 className="text-4xl lg:text-5xl font-black text-white mb-8 tracking-tight relative z-10 leading-tight">
                    Secure your next <br/> 
                    <span className="text-amber-400">leadership milestone.</span>
                 </h2>
                 <p className="text-xl text-slate-400 font-medium mb-12 max-w-2xl mx-auto relative z-10">
                    Confidential, personalized support for senior executives navigating the highest levels of global recruitment.
                 </p>
                 <button
                   onClick={() => router.push('/whatsapp')}
                   className="bg-amber-500 text-slate-950 font-black px-12 py-5 rounded-2xl hover:bg-amber-400 transition-all shadow-xl shadow-amber-500/20 active:scale-95 text-[17px] relative z-10"
                 >
                   Book Private Consultation
                 </button>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
}


