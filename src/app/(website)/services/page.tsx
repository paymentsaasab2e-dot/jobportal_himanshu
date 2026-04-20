'use client';

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, type Variants } from 'framer-motion';
import { 
  FileText, 
  BrainCircuit, 
  Mic2, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';

// --- Animation Variants ---
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const floatingAnimation: Variants = {
  initial: { y: 0 },
  animate: {
    y: [0, -15, 0],
    transition: {
      duration: 5,
      repeat: Infinity,
      ease: "easeInOut" as const
    }
  }
};

// --- Data ---
const CORE_SERVICES = [
  {
    id: 'cv-editor',
    title: 'AI CV Architect',
    tag: 'Resume Engineering',
    description: 'Transform your professional narrative into a high-performance, ATS-optimized masterpiece.',
    icon: FileText,
    features: ['Keyword Optimization', 'Template Selection', 'PDF Export'],
    color: 'from-blue-500 to-cyan-400',
    glow: 'bg-blue-400/20'
  },
  {
    id: 'quiz',
    title: 'Skill Assessment',
    tag: 'Knowledge Testing',
    description: 'Validate your expertise with adaptive quizzes tailored to industry-standard benchmarks.',
    icon: BrainCircuit,
    features: ['Real-time Scoring', 'Weakness Analysis', 'Certificates'],
    color: 'from-sky-500 to-indigo-500',
    glow: 'bg-sky-400/20'
  },
  {
    id: 'interview-prep',
    title: 'Interview Simulator',
    tag: 'AI Coaching',
    description: 'Practice with our behavioral AI to master your delivery and build unbreakable confidence.',
    icon: Mic2,
    features: ['Voice Feedback', 'Common Question Bank', 'Performance Metrics'],
    color: 'from-indigo-500 to-violet-500',
    glow: 'bg-indigo-400/20'
  }
];

export default function RedesignedServicesPage() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <div ref={containerRef} className="min-h-screen bg-white text-slate-900 selection:bg-sky-100 overflow-x-hidden">
      
      {/* 1. CINEMATIC HERO */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-6 pt-20">
        {/* Animated Background Elements */}
        <motion.div style={{ y: backgroundY }} className="absolute inset-0 z-0">
          <div className="absolute top-[10%] left-[5%] w-72 h-72 bg-blue-100 rounded-full blur-[120px] opacity-60" />
          <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-indigo-100 rounded-full blur-[120px] opacity-60" />
        </motion.div>

        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white mb-10 shadow-2xl"
          >
            <Zap className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">AI-Powered Career Suite</span>
          </motion.div>
          
          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="text-6xl md:text-8xl font-black tracking-tight mb-10 leading-[0.95] text-slate-950"
          >
            Your future is <br />
            <span className="relative">
              Handcrafted.
              <motion.svg 
                initial={{ pathLength: 0 }} 
                animate={{ pathLength: 1 }} 
                transition={{ delay: 1, duration: 1 }}
                className="absolute -bottom-2 left-0 w-full h-3 text-sky-500/30" viewBox="0 0 300 10"
              >
                <path d="M5 5C50 5 150 2 295 8" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none" />
              </motion.svg>
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto mb-14 font-medium leading-relaxed"
          >
            The premium ecosystem for professionals who refuse to settle. Three tools, one unified path to excellence.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-6"
          >
            <button className="px-8 py-4 bg-slate-950 text-white rounded-full font-bold transition-transform hover:scale-105 active:scale-95 shadow-xl">
              Explore Tools
            </button>
            <button className="px-8 py-4 bg-white border border-slate-200 rounded-full font-bold hover:bg-slate-50 transition-colors shadow-sm">
              Watch Preview
            </button>
          </motion.div>
        </div>
      </section>

      {/* 2. THE CORE TRIO (Services) */}
      <section className="px-6 py-20 relative bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            {CORE_SERVICES.map((service, idx) => (
              <motion.div
                key={service.id}
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="group relative bg-white border border-slate-200/60 rounded-[40px] p-10 transition-all duration-500 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)]"
              >
                {/* Dynamic Background Glow */}
                <div className={`absolute inset-0 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${service.glow} blur-2xl`} />

                <div className="relative z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-8 shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-500`}>
                    <service.icon className="w-8 h-8 text-white" />
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-px w-8 bg-sky-500" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-sky-600">
                      {service.tag}
                    </span>
                  </div>
                  
                  <h3 className="text-3xl font-bold mb-6 text-slate-950">
                    {service.title}
                  </h3>
                  
                  <p className="text-slate-500 leading-relaxed mb-10 text-lg font-medium">
                    {service.description}
                  </p>

                  <div className="space-y-4 mb-12">
                    {service.features.map((feature, fIdx) => (
                      <motion.div 
                        key={fIdx}
                        className="flex items-center gap-4 text-slate-700 font-semibold"
                      >
                        <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                        </div>
                        {feature}
                      </motion.div>
                    ))}
                  </div>

                  <button className="group/btn w-full py-5 bg-white border-2 border-slate-950 text-slate-950 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-950 hover:text-white transition-all duration-300">
                    Launch Application
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 3. INTERACTIVE FEATURE SECTION */}
      <section className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <h2 className="text-5xl font-black text-slate-950 mb-8 tracking-tight">
              Why settle for <br />
              <span className="text-sky-500">Industry Standard?</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium mb-10 leading-relaxed">
              We leverage proprietary neural networks and human recruitment insights to give you an unfair advantage in the hiring process.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { label: 'Bank-Grade Security', icon: ShieldCheck },
                { label: 'Real-time Analytics', icon: Zap }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                    <item.icon className="w-6 h-6 text-sky-600" />
                  </div>
                  <span className="font-bold text-slate-900">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-1 relative"
          >
            <motion.div 
              variants={floatingAnimation}
              initial="initial"
              animate="animate"
              className="relative z-10 bg-white rounded-3xl shadow-[0_50px_100px_rgba(0,0,0,0.1)] p-8 border border-slate-100"
            >
              {/* Mock UI Element */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="space-y-4">
                <div className="h-4 w-3/4 bg-slate-100 rounded-full animate-pulse" />
                <div className="h-4 w-full bg-slate-50 rounded-full" />
                <div className="h-20 w-full bg-sky-50 rounded-2xl border border-sky-100 flex items-center justify-center">
                  <Sparkles className="text-sky-400 w-8 h-8" />
                </div>
                <div className="h-4 w-1/2 bg-slate-100 rounded-full" />
              </div>
            </motion.div>
            
            {/* Background Decorative Circles */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-sky-100 rounded-full blur-[80px] -z-10" />
          </motion.div>
        </div>
      </section>

      
    </div>
  );
}