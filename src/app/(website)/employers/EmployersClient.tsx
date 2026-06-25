"use client";

import type { PricingPlan } from "@/components/ui/pricing";
import React from "react";
import { EmployersHeroSection } from "./EmployersHeroSection";
import { EmployersFloatingHeroSection } from "./EmployersFloatingHeroSection";
import { EmployersCoreModulesBento } from "./EmployersCoreModulesBento";
import { EmployersPricingSection } from "./EmployersPricingSection";
import { EmployersOverviewSection } from "./EmployersOverviewSection";
import { BlurRevealHeading } from "./BlurRevealText";
import {
  Brain, FileText, Share2, Calendar, Target,
  Users, CheckSquare, BarChart2,
  TrendingUp, AlertCircle, CreditCard, ShieldCheck,
  GraduationCap,
  ArrowRight, Repeat,
  CheckCircle2, Zap, LayoutDashboard, FileSearch,
  Briefcase, Bot
} from "lucide-react";

type EmployerLandingPageProps = {
  initialPricingPlans: PricingPlan[];
};

export default function EmployerLandingPage({
  initialPricingPlans,
}: EmployerLandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-purple-500/30 selection:text-purple-900 overflow-x-hidden antialiased">


      

      <main>
        <EmployersHeroSection />

        <div className="text-slate-800">
        <EmployersOverviewSection />

        <EmployersCoreModulesBento />

        <EmployersPricingSection initialPlans={initialPricingPlans} />

        {/* 4. ECOSYSTEM VIEW (CRITICAL UI) */}
        <section id="ecosystem" className="pt-16 pb-16 bg-slate-50 relative overflow-hidden border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid xl:grid-cols-2 gap-20 items-center relative z-10">
            
            {/* Copy */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-sky-200 bg-sky-50 mb-8">
                <Repeat className="w-4 h-4 text-sky-600" />
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky-700">
                  Continuous Improvement Loop
                </span>
              </div>
              <BlurRevealHeading
                as="h2"
                className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]"
                lines={[{ text: "Every module works seamlessly together." }]}
              />
              <p className="text-[1.1rem] lg:text-[1.2rem] text-slate-600 font-normal leading-relaxed mb-12">
                It isn't just about passing data. Our ecosystem creates a continuous loop of intelligence for your organization, improving itself with every action.
              </p>

              <div className="space-y-8">
                {[
                  { title: "Candidate Rejection → AI Output", desc: "System detects common skill shortages and suggests training courses to existing staff automatically." },
                  { title: "Training Completed → AI Insight", desc: "Updates internal skill matrices, making future hiring matches more precise and targeted." },
                  { title: "Performance Tracked → Hiring Strategy", desc: "Real attendance and performance data feed back into the JD generator for better future hires." }
                ].map((loop, idx) => (
                  <div key={idx} className="flex gap-5 items-start">
                    <div className="shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-sky-600" />
                      </div>
                    </div>
                    <div>
                      <BlurRevealHeading
                        as="h4"
                        className="text-[16px] text-slate-900 font-bold mb-1.5 tracking-wide"
                        lines={[{ text: loop.title }]}
                      />
                      <p className="text-slate-600 text-[14px] leading-relaxed max-w-md">{loop.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Circular Flow UI */}
            <div className="relative h-[650px] items-center justify-center hidden lg:flex perspective-1000">
                <div className="absolute inset-0 bg-linear-to-br from-indigo-200/50 to-sky-200/50 rounded-full blur-[80px] opacity-60 pointer-events-none" />
                
                {/* The Loop Container */}
                <div className="relative w-[500px] h-[500px] border-[1.5px] border-dashed border-slate-300 rounded-full flex items-center justify-center animate-[spin_45s_linear_infinite]">
                  
                  {/* Center Hub */}
                  <div className="absolute w-36 h-36 bg-white border border-slate-100 rounded-full shadow-[0_20px_60px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center animate-[spin_45s_linear_infinite_reverse] z-20">
                    <Brain className="w-10 h-10 text-indigo-600 mb-2.5" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">AI Engine</span>
                  </div>

                  {/* Orbiting Modules */}
                  {[
                    { angle: 0, label: "Recruit", color: "text-blue-600", border: "border-blue-200", bg: "bg-blue-50", icon: Target },
                    { angle: 45, label: "Hire", color: "text-sky-600", border: "border-sky-200", bg: "bg-sky-50", icon: Briefcase },
                    { angle: 90, label: "Onboard", color: "text-emerald-600", border: "border-emerald-200", bg: "bg-emerald-50", icon: CheckSquare },
                    { angle: 135, label: "Track", color: "text-teal-600", border: "border-teal-200", bg: "bg-teal-50", icon: Users },
                    { angle: 180, label: "Evaluate", color: "text-amber-600", border: "border-amber-200", bg: "bg-amber-50", icon: TrendingUp },
                    { angle: 225, label: "Train", color: "text-pink-600", border: "border-pink-200", bg: "bg-pink-50", icon: GraduationCap },
                    { angle: 270, label: "Payroll", color: "text-orange-600", border: "border-orange-200", bg: "bg-orange-50" , icon: CreditCard},
                    { angle: 315, label: "Insights", color: "text-purple-600", border: "border-purple-200", bg: "bg-purple-50", icon: BarChart2 }
                  ].map((node, i) => {
                    const radius = 250; // half of 500px container
                    const rad = (node.angle * Math.PI) / 180;
                    const top = `calc(50% - ${Math.cos(rad) * radius}px)`;
                    const left = `calc(50% + ${Math.sin(rad) * radius}px)`;

                    return (
                      <div 
                        key={i} 
                        className={`absolute w-20 h-20 -ml-10 -mt-10 bg-white border ${node.border} rounded-[20px] flex flex-col items-center justify-center gap-1.5 shadow-md cursor-default hover:scale-110 hover:z-30 transition-all duration-300`}
                        style={{ top, left }}
                      >
                         <div className="animate-[spin_45s_linear_infinite_reverse] flex flex-col items-center justify-center w-full h-full">
                           <div className={`p-1.5 rounded-lg ${node.bg} mb-1`}>
                             <node.icon className={`w-4 h-4 ${node.color}`} strokeWidth={2.5} />
                           </div>
                           <span className={`text-[9px] font-bold uppercase tracking-wider text-slate-600`}>{node.label}</span>
                         </div>
                      </div>
                    );
                  })}
                </div>
            </div>

          </div>
        </section>

        <EmployersFloatingHeroSection />
        </div>
      </main>
    </div>
  );
}