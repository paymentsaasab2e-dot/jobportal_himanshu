"use client";

import React from "react";
import { motion, useInView } from "framer-motion";
import {
  Target,
  FileSearch,
  GraduationCap,
  Users,
  CreditCard,
  TrendingUp,
  Repeat,
  CheckCircle2,
  Sparkles,
  Zap,
  Brain,
} from "lucide-react";
import { BlurRevealHeading } from "./BlurRevealText";

const WORKFLOW_STEPS = [
  {
    label: "Hire",
    icon: Target,
    color: "text-blue-600",
    bg: "bg-blue-500/15",
    ring: "ring-blue-400/40",
    border: "border-blue-300",
    glow: "group-hover:shadow-[0_0_28px_rgba(59,130,246,0.45)]",
    labelColor: "text-blue-700",
  },
  {
    label: "Evaluate",
    icon: FileSearch,
    color: "text-indigo-600",
    bg: "bg-indigo-500/15",
    ring: "ring-indigo-400/40",
    border: "border-indigo-300",
    glow: "group-hover:shadow-[0_0_28px_rgba(99,102,241,0.45)]",
    labelColor: "text-indigo-700",
  },
  {
    label: "Train",
    icon: GraduationCap,
    color: "text-violet-600",
    bg: "bg-violet-500/15",
    ring: "ring-violet-400/40",
    border: "border-violet-300",
    glow: "group-hover:shadow-[0_0_28px_rgba(139,92,246,0.45)]",
    labelColor: "text-violet-700",
  },
  {
    label: "Manage",
    icon: Users,
    color: "text-fuchsia-600",
    bg: "bg-fuchsia-500/15",
    ring: "ring-fuchsia-400/40",
    border: "border-fuchsia-300",
    glow: "group-hover:shadow-[0_0_28px_rgba(217,70,239,0.45)]",
    labelColor: "text-fuchsia-700",
  },
  {
    label: "Pay",
    icon: CreditCard,
    color: "text-amber-600",
    bg: "bg-amber-500/15",
    ring: "ring-amber-400/40",
    border: "border-amber-300",
    glow: "group-hover:shadow-[0_0_28px_rgba(245,158,11,0.45)]",
    labelColor: "text-amber-700",
  },
  {
    label: "Improve",
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-400/40",
    border: "border-emerald-300",
    glow: "group-hover:shadow-[0_0_28px_rgba(16,185,129,0.45)]",
    labelColor: "text-emerald-700",
  },
  {
    label: "Repeat",
    icon: Repeat,
    color: "text-sky-600",
    bg: "bg-sky-500/15",
    ring: "ring-sky-400/40",
    border: "border-sky-300",
    glow: "group-hover:shadow-[0_0_28px_rgba(14,165,233,0.45)]",
    labelColor: "text-sky-700",
  },
] as const;

const VALUE_POINTS = [
  {
    title: "No fragmented tools",
    desc: "Unified data across all modules without complex integrations.",
    icon: Sparkles,
    accent: "from-blue-500/10 to-cyan-500/5",
    border: "border-blue-200/80",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-600",
  },
  {
    title: "No manual coordination",
    desc: "Automated direct handoffs between hiring, HR, and finance.",
    icon: Zap,
    accent: "from-violet-500/10 to-fuchsia-500/5",
    border: "border-violet-200/80",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-600",
  },
  {
    title: "AI-driven decisions",
    desc: "Predictive intelligence injected at every lifecycle stage.",
    icon: Brain,
    accent: "from-emerald-500/10 to-teal-500/5",
    border: "border-emerald-200/80",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-600",
  },
] as const;

const stepVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.92 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: 0.12 + i * 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  }),
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.35 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function EmployersOverviewSection() {
  const workflowRef = React.useRef<HTMLDivElement>(null);
  const workflowInView = useInView(workflowRef, { once: true, margin: "-10% 0px" });

  return (
    <section id="overview" className="relative overflow-hidden pt-20 pb-16 bg-white border-y border-slate-200">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59,130,246,0.08), transparent 55%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(139,92,246,0.06), transparent 50%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <BlurRevealHeading
            as="h2"
            className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4"
            lines={[{ text: "Not just another tool." }]}
          />
          <p className="text-[1.1rem] text-slate-600 font-normal leading-relaxed mt-6">
            SAASA B2E is a fully integrated HR ecosystem that connects recruitment, employee management,
            learning, and payroll into one intelligent workflow.
          </p>
        </div>

        <div ref={workflowRef} className="relative py-8 overflow-x-auto scrollbar-none">
          <div className="min-w-[1000px] flex items-center justify-between relative px-10">
            {/* Tether track */}
            <div className="absolute top-1/2 left-16 right-16 h-1.5 -translate-y-1/2 z-0 rounded-full overflow-hidden bg-slate-100/90">
              <div className="absolute inset-0 bg-linear-to-r from-blue-200/50 via-violet-200/50 via-fuchsia-200/50 via-amber-200/50 to-emerald-200/50" />
              <motion.div
                className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-linear-to-r from-blue-500 via-indigo-500 via-violet-500 via-fuchsia-500 via-amber-500 to-emerald-500"
                initial={{ scaleX: 0 }}
                animate={workflowInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              />
              <motion.div
                className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]"
                initial={{ left: "0%" }}
                animate={
                  workflowInView
                    ? { left: ["0%", "100%", "0%"] }
                    : { left: "0%" }
                }
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1.2,
                }}
              />
            </div>

            {WORKFLOW_STEPS.map((step, idx) => (
              <motion.div
                key={step.label}
                custom={idx}
                initial="hidden"
                animate={workflowInView ? "visible" : "hidden"}
                variants={stepVariants}
                className="relative z-10 flex flex-col items-center gap-4 group"
              >
                <div
                  className={`relative w-[4.25rem] h-[4.25rem] rounded-2xl bg-white border-2 ${step.border} ring-4 ${step.ring} flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${step.glow}`}
                >
                  <motion.span
                    className={`absolute inset-0 rounded-2xl ${step.bg}`}
                    animate={workflowInView ? { opacity: [0.35, 0.7, 0.35] } : { opacity: 0.35 }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: idx * 0.25 }}
                  />
                  <div className={`relative p-2.5 rounded-xl ${step.bg}`}>
                    <step.icon className={`w-6 h-6 ${step.color}`} strokeWidth={2} />
                  </div>
                </div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-[0.18em] ${step.labelColor} group-hover:scale-105 transition-transform`}
                >
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mt-14 max-w-5xl mx-auto">
          {VALUE_POINTS.map((val, idx) => (
            <motion.div
              key={val.title}
              custom={idx}
              initial="hidden"
              animate={workflowInView ? "visible" : "hidden"}
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`relative overflow-hidden rounded-3xl border ${val.border} bg-linear-to-br ${val.accent} p-8 text-center shadow-sm hover:shadow-md transition-shadow`}
            >
              <div
                className={`w-12 h-12 mx-auto ${val.iconBg} rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/60`}
              >
                <val.icon className={`w-5 h-5 ${val.iconColor}`} strokeWidth={2} />
              </div>
              <BlurRevealHeading
                as="h4"
                className="text-[17px] text-slate-900 font-bold mb-3"
                lines={[{ text: val.title }]}
              />
              <p className="text-[14px] text-slate-600 leading-relaxed">{val.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
