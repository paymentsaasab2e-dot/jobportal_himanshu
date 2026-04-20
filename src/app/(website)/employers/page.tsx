"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import {
  Brain, FileText, Share2, Calendar, Target,
  Users, CheckSquare, MapPin, Watch, BarChart2,
  TrendingUp, AlertCircle, CreditCard, ShieldCheck,
  Globe, GraduationCap, Video, HelpCircle,
  ArrowRight, Repeat, Cpu, DollarSign, Layers,
  CheckCircle2, Zap, LayoutDashboard, FileSearch,
  Briefcase, Bot
} from "lucide-react";

export default function EmployerLandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-purple-500/30 selection:text-purple-900 overflow-x-hidden antialiased">
      <Head>
        <title>HR Yantra - AI-Driven Workforce Ecosystem</title>
        <meta name="description" content="Your Entire Hiring & HR Operations — Powered by AI" />
      </Head>

      

      <main>
        {/* 1. HERO SECTION */}
        <section className="relative pt-32 pb-10 lg:pt-36 lg:pb-12 overflow-hidden">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none" />

          {/* Background Glows */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-400/20 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />
          <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-purple-400/20 rounded-full blur-[120px] mix-blend-multiply pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 lg:px-8 grid lg:grid-cols-2 gap-16 lg:gap-24 items-center relative z-10">
            {/* Left Copy */}
            <div className="max-w-2xl relative">
              <h1 className="text-5xl lg:text-[4.2rem] font-extrabold text-slate-900 tracking-tight leading-[1.05] mb-8">
                Your Entire Hiring & HR Operations — <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 leading-normal">
                  Powered by AI
                </span>
              </h1>
              <p className="text-[1.1rem] lg:text-[1.2rem] text-slate-600 font-normal leading-relaxed mb-10 max-w-xl">
                From hiring the right candidate to managing payroll and performance — automate everything in one unified platform.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
                <button
                  onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=ghodehimanshu453@gmail.com&su=Demo%20Request', '_blank')}
                  className="w-full sm:w-auto h-14 px-8 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-[15px] flex items-center justify-center gap-3 shadow-lg hover:shadow-[0_8px_30px_rgb(99,102,241,0.3)] transition-all hover:-translate-y-1"
                >
                  Request Demo <ArrowRight className="w-4 h-4" />
                </button>
                
              </div>

              {/* Trust Signals */}
              <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 sm:gap-6">
                {[
                  "AI-powered automation",
                  "Multi-country payroll ready",
                  "End-to-end lifecycle"
                ].map((signal, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[14px] font-medium text-slate-600">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={2.5} />
                    {signal}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Flow UI */}
            <div className="relative h-[600px] w-full hidden lg:block perspective-1000">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Visual abstract representation of the loop */}
                <div className="relative w-[340px] h-[340px]">
                   {/* Central Core */}
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-[40px] animate-pulse" />
                   <div className="absolute inset-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.05)] z-20">
                      <div className="text-center">
                        <Cpu className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
                        <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-slate-800">SAASA AI</span>
                      </div>
                   </div>

                   {/* Orbiting nodes */}
                   {mounted && (
                     <div className="absolute inset-0 animate-[spin_25s_linear_infinite] z-10">
                        {/* Node 1: Hiring */}
                        <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg animate-[spin_25s_linear_infinite_reverse]">
                          <Briefcase className="w-6 h-6 text-blue-500" />
                        </div>
                        {/* Node 2: Employee */}
                        <div className="absolute bottom-[18%] -right-4 w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg animate-[spin_25s_linear_infinite_reverse]">
                          <Users className="w-6 h-6 text-emerald-500" />
                        </div>
                        {/* Node 3: Payroll */}
                        <div className="absolute bottom-[18%] -left-4 w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-lg animate-[spin_25s_linear_infinite_reverse]">
                          <CreditCard className="w-6 h-6 text-amber-500" />
                        </div>
                     </div>
                   )}
                   
                   {/* Connecting dashed ring */}
                   <div className="absolute inset-0 border-[1.5px] border-dashed border-slate-200 rounded-full z-0 opacity-80" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PLATFORM OVERVIEW */}
        <section id="overview" className="pt-20 pb-16 bg-white border-y border-slate-200 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                Not just another tool.<br />
                <span className="text-slate-500 text-3xl md:text-4xl">A complete ecosystem.</span>
              </h2>
              <p className="text-[1.1rem] text-slate-600 font-normal leading-relaxed mt-6">
                SAASA B2E is a fully integrated HR ecosystem that connects recruitment, employee management, learning, and payroll into one intelligent workflow.
              </p>
            </div>

            {/* Horizontal Timeline */}
            <div className="relative py-8 overflow-x-auto scrollbar-none">
              <div className="min-w-[1000px] flex items-center justify-between relative px-10">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-16 right-16 h-[2px] bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-emerald-500/20 -translate-y-1/2 z-0" />
                
                {[
                  { label: "Hire", icon: Target, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
                  { label: "Evaluate", icon: FileSearch, color: "text-indigo-500", bg: "bg-indigo-50", border: "border-indigo-100" },
                  { label: "Train", icon: GraduationCap, color: "text-violet-500", bg: "bg-violet-50", border: "border-violet-100" },
                  { label: "Manage", icon: Users, color: "text-fuchsia-500", bg: "bg-fuchsia-50", border: "border-fuchsia-100" },
                  { label: "Pay", icon: CreditCard, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-100" },
                  { label: "Improve", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
                  { label: "Repeat", icon: Repeat, color: "text-slate-500", bg: "bg-slate-50", border: "border-slate-200" }
                ].map((step, idx) => (
                  <div key={idx} className="relative z-10 flex flex-col items-center gap-5 group">
                    <div className={`w-16 h-16 rounded-2xl bg-white border shadow-sm ${step.border} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_10px_20px_rgba(0,0,0,0.08)]`}>
                      <div className={`p-2.5 rounded-xl ${step.bg}`}>
                         <step.icon className={`w-6 h-6 ${step.color}`} strokeWidth={1.5} />
                      </div>
                    </div>
                    <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-slate-500 group-hover:text-slate-900 transition-colors">{step.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Value Points */}
            <div className="grid sm:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
              {[
                { title: "No fragmented tools", desc: "Unified data across all modules without complex integrations." },
                { title: "No manual coordination", desc: "Automated direct handoffs between hiring, HR, and finance." },
                { title: "AI-driven decisions", desc: "Predictive intelligence injected at every lifecycle stage." },
              ].map((val, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-3xl p-8 text-center hover:bg-slate-100 transition-colors shadow-sm">
                  <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h4 className="text-[17px] text-slate-900 font-bold mb-3">{val.title}</h4>
                  <p className="text-[14px] text-slate-600 leading-relaxed">{val.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. CORE MODULES */}
        <section id="modules" className="pt-32 pb-16 relative">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-20 max-w-2xl mx-auto">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">Core Modules</h2>
              <p className="text-[1.1rem] text-slate-600 leading-relaxed">Everything you need to run your workforce securely, accurately, and rapidly.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
              
              {/* MOD 1: AI Recruitment */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 lg:p-12 hover:border-blue-200 hover:shadow-[0_20px_40px_-15px_rgba(59,130,246,0.15)] transition-all duration-300 group">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                    <Brain className="w-8 h-8 text-blue-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[26px] font-bold text-slate-900 tracking-tight">AI Recruitment System</h3>
                    <p className="text-blue-600 text-[11px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-90">Hire Top Talent Fast</p>
                  </div>
                </div>
                <p className="text-slate-600 font-normal leading-relaxed mb-8">
                  Find, evaluate, and hire the right candidates faster with end-to-end AI-driven recruitment.
                </p>
                <div className="space-y-4 mb-10">
                  {["AI CV screening & ATS scoring", "AI Job Description generator", "Multi-platform job posting", "AI candidate matching & ranking", "Interview scheduling + automation"].map((f, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" strokeWidth={2.5} />
                      <span className="text-slate-700 text-[15px] font-medium">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-8 flex gap-4 items-start">
                  <div className="shrink-0 mt-1">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                     <strong className="block text-slate-900 text-[14px] mb-1.5 font-semibold">Real Benefits</strong>
                     <span className="text-slate-600 text-[14px] leading-relaxed block">Reduce hiring time by 70%, eliminate manual screening, get top candidates instantly.</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-slate-700 font-semibold text-[14px] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-6 py-3 rounded-full transition-colors group-hover:border-blue-300 group-hover:text-blue-700">
                  See Workflow <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {/* MOD 2: Employee Management */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 lg:p-12 hover:border-emerald-200 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] transition-all duration-300 group">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <LayoutDashboard className="w-8 h-8 text-emerald-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[26px] font-bold text-slate-900 tracking-tight">Employee Management</h3>
                    <p className="text-emerald-600 text-[11px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-90">Workforce Operations</p>
                  </div>
                </div>
                <p className="text-slate-600 font-normal leading-relaxed mb-8">
                  Manage your entire workforce from onboarding to daily operations effortlessly.
                </p>
                <div className="space-y-4 mb-10">
                  {["Digital onboarding & documents", "Task & project tracking", "Asset allocation & receipts", "Attendance (biometric + GPS)", "Leave & expense workflows"].map((f, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" strokeWidth={2.5} />
                      <span className="text-slate-700 text-[15px] font-medium">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-6 mb-8 flex gap-4 items-start">
                  <div className="shrink-0 mt-1">
                    <TrendingUp className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                     <strong className="block text-slate-900 text-[14px] mb-1.5 font-semibold">Real Benefits</strong>
                     <span className="text-slate-600 text-[14px] leading-relaxed block">Full transparency across teams, reduced HR workload, better employee accountability.</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-slate-700 font-semibold text-[14px] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-6 py-3 rounded-full transition-colors group-hover:border-emerald-300 group-hover:text-emerald-700">
                  See Workflow <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {/* MOD 3: Performance */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 lg:p-12 hover:border-purple-200 hover:shadow-[0_20px_40px_-15px_rgba(168,85,247,0.15)] transition-all duration-300 group">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                    <TrendingUp className="w-8 h-8 text-purple-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[26px] font-bold text-slate-900 tracking-tight">Performance & Analytics</h3>
                    <p className="text-purple-600 text-[11px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-90">Data-backed growth</p>
                  </div>
                </div>
                <p className="text-slate-600 font-normal leading-relaxed mb-8">
                  Measure performance with real data — not assumptions.
                </p>
                <div className="space-y-4 mb-10">
                  {["Task-based performance scoring", "Attendance impact analysis", "AI recommendations for improvement", "Promotion & growth insights"].map((f, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" strokeWidth={2.5} />
                      <span className="text-slate-700 text-[15px] font-medium">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-6 mb-8 flex gap-4 items-start">
                  <div className="shrink-0 mt-1">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                     <strong className="block text-slate-900 text-[14px] mb-1.5 font-semibold">Real Benefits</strong>
                     <span className="text-slate-600 text-[14px] leading-relaxed block">Identify top performers instantly, improve productivity with data, reduce attrition risk.</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-slate-700 font-semibold text-[14px] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-6 py-3 rounded-full transition-colors group-hover:border-purple-300 group-hover:text-purple-700">
                  See Workflow <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {/* MOD 4: Payroll */}
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 lg:p-12 hover:border-amber-200 hover:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.15)] transition-all duration-300 group">
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100">
                    <DollarSign className="w-8 h-8 text-amber-500" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-[26px] font-bold text-slate-900 tracking-tight">Payroll & Compliance</h3>
                    <p className="text-amber-600 text-[11px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-90">Zero Manual Errors</p>
                  </div>
                </div>
                <p className="text-slate-600 font-normal leading-relaxed mb-8">
                  Automate payroll with full compliance seamlessly linked to attendance.
                </p>
                <div className="space-y-4 mb-10">
                  {["Automated salary calculation", "Tax & compliance management", "Multi-country payroll support", "Tally & SAP integration", "Payslip automation"].map((f, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0" strokeWidth={2.5} />
                      <span className="text-slate-700 text-[15px] font-medium">{f}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 mb-8 flex gap-4 items-start">
                  <div className="shrink-0 mt-1">
                    <TrendingUp className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                     <strong className="block text-slate-900 text-[14px] mb-1.5 font-semibold">Real Benefits</strong>
                     <span className="text-slate-600 text-[14px] leading-relaxed block">100% accurate payroll, no compliance risks, saves the finance team hours.</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 text-slate-700 font-semibold text-[14px] bg-slate-100 hover:bg-slate-200 border border-slate-200 px-6 py-3 rounded-full transition-colors group-hover:border-amber-300 group-hover:text-amber-700">
                  See Workflow <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>

              {/* MOD 5: L&D */}
              <div className="lg:col-span-2 bg-gradient-to-br from-white to-pink-50/30 border border-slate-200 rounded-[2.5rem] p-10 lg:p-14 hover:border-pink-200 hover:shadow-[0_20px_40px_-15px_rgba(236,72,153,0.15)] transition-all duration-300 group">
                <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
                  <div>
                    <div className="flex items-center gap-5 mb-8">
                      <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center border border-pink-100">
                        <GraduationCap className="w-8 h-8 text-pink-500" strokeWidth={1.5} />
                      </div>
                      <div>
                        <h3 className="text-[26px] font-bold text-slate-900 tracking-tight">Learning & Development</h3>
                        <p className="text-pink-600 text-[11px] font-bold uppercase tracking-[0.2em] mt-1.5 opacity-90">Continuous Growth</p>
                      </div>
                    </div>
                    <p className="text-slate-600 font-normal leading-relaxed mb-8">
                      Turn employee gaps into growth with AI-driven training and integrated courses.
                    </p>
                    <div className="bg-pink-50/50 border border-pink-100 rounded-2xl p-6 mb-8 flex gap-4 items-start">
                      <div className="shrink-0 mt-1">
                        <TrendingUp className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <strong className="block text-slate-900 text-[14px] mb-1.5 font-semibold">Real Benefits</strong>
                        <span className="text-slate-600 text-[14px] leading-relaxed block">Upskill employees automatically, improve hiring success rate, and drive continuous workforce improvement.</span>
                      </div>
                    </div>
                    <button className="flex items-center gap-2 text-slate-700 font-semibold text-[14px] bg-white border border-slate-200 px-6 py-3 rounded-full transition-colors group-hover:border-pink-300 group-hover:text-pink-700">
                      See Workflow <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                  <div>
                    <div className="space-y-4">
                      {["AI-based course recommendations", "Integrated LMS (videos, assessments)", "Skill-gap detection from feedback", "Payment gateway for courses"].map((f, i) => (
                        <div key={i} className="flex items-center gap-4 bg-white border border-slate-100 shadow-sm p-5 rounded-2xl">
                          <CheckCircle2 className="w-6 h-6 text-pink-500 shrink-0" strokeWidth={2.5} />
                          <span className="text-slate-800 font-semibold text-[15px]">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

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
              <h2 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]">
                Every module works seamlessly together.
              </h2>
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
                      <h4 className="text-[16px] text-slate-900 font-bold mb-1.5 tracking-wide">{loop.title}</h4>
                      <p className="text-slate-600 text-[14px] leading-relaxed max-w-md">{loop.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Circular Flow UI */}
            <div className="relative h-[650px] items-center justify-center hidden lg:flex perspective-1000">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-200/50 to-sky-200/50 rounded-full blur-[80px] opacity-60 pointer-events-none" />
                
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

        {/* 5. WHY EMPLOYERS CHOOSE THIS */}
        <section id="benefits" className="pt-20 pb-12 relative bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Why Employers Choose Us</h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto border border-slate-100 rounded-3xl p-4 bg-slate-50/50">
              {[
                { icon: Watch, title: "Faster Hiring", desc: "Hire the right candidate in less time with AI-powered screening & matching." },
                { icon: DollarSign, title: "Reduced Costs", desc: "Eliminate multiple expensive tools and slow, repetitive manual processes." },
                { icon: BarChart2, title: "Data-Driven Decisions", desc: "Every HR decision is backed by real analytics and deep ecosystem insights." },
                { icon: Repeat, title: "Continuous Improvement", desc: "Your hiring and retention gets systematically better with every cycle." },
                { icon: Globe, title: "Scalable System", desc: "Native support for multiple locations, corporate entities, and countries." }
              ].map((item, idx) => (
                <div key={idx} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-8 hover:shadow-md transition-all">
                  <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center mb-5 border border-indigo-100">
                    <item.icon className="w-6 h-6 text-indigo-600" strokeWidth={2} />
                  </div>
                  <h4 className="text-[19px] font-bold text-slate-900 mb-2.5 tracking-wide">{item.title}</h4>
                  <p className="text-[14.5px] text-slate-600 font-normal leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. FINAL CTA */}
        <section className="pt-32 pb-40 relative bg-slate-50 border-t border-slate-200 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(79,70,229,0.08)_0%,transparent_50%)] pointer-events-none" />
          
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] mb-8">
              Ready to Transform Your Hiring & HR Operations?
            </h2>
            <p className="text-[1.15rem] text-slate-600 font-normal mb-12 max-w-2xl mx-auto leading-relaxed">
              See how SAASA B2E can streamline your entire workforce lifecycle and automate the heavy lifting seamlessly.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <button
                onClick={() => window.open('https://mail.google.com/mail/?view=cm&fs=1&to=ghodehimanshu453@gmail.com&su=Demo%20Request', '_blank')}
                className="w-full sm:w-auto h-14 px-10 rounded-full bg-indigo-600 text-white font-bold text-[15px] hover:scale-105 transition-transform shadow-[0_4px_20px_rgba(79,70,229,0.25)]"
              >
                Request Demo
              </button>
              
            </div>
          </div>
        </section>
      </main>
      
      {/* Footer Minimal */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center text-slate-500 text-[13px] font-medium min-h-[80px] flex items-center justify-center">
        <p>&copy; {new Date().getFullYear()} SAASA B2E. All rights reserved.</p>
      </footer>
    </div>
  );
}