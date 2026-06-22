"use client";

import type { ReactNode, SVGProps } from "react";
import {
  BarChart2,
  Bot,
  Brain,
  Briefcase,
  Calendar,
  CreditCard,
  DollarSign,
  Facebook,
  Globe,
  GraduationCap,
  Instagram,
  Linkedin,
  MessageCircle,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Brand3DIconProps = SVGProps<SVGSVGElement> & { className?: string };

function Brand3DShell({
  className,
  gradient,
  depthColor,
  glowColor,
  children,
}: {
  className?: string;
  gradient: string;
  depthColor: string;
  glowColor: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center transform-3d",
        className,
      )}
      style={{ transform: "perspective(720px) rotateX(11deg) rotateY(-10deg)" }}
    >
      <div
        className="absolute inset-[10%] rounded-xl blur-lg opacity-70"
        style={{ background: glowColor }}
        aria-hidden
      />
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center rounded-xl border border-white/35 text-white",
          gradient,
        )}
        style={{
          boxShadow: `0 8px 0 ${depthColor}, 0 14px 24px ${glowColor}`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function iconClassName(size = "h-6 w-6 md:h-7 md:w-7") {
  return cn(size, "drop-shadow-[0_2px_6px_rgba(0,0,0,0.28)]");
}

export function LinkedIn3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#0a66c2] via-[#3d9ae8] to-[#004182]"
      depthColor="#004182"
      glowColor="rgba(10,102,194,0.42)"
    >
      <Linkedin className={iconClassName()} strokeWidth={2.2} fill="currentColor" />
    </Brand3DShell>
  );
}

export function Facebook3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#1877f2] via-[#4c9aff] to-[#0d5bd7]"
      depthColor="#0d5bd7"
      glowColor="rgba(24,119,242,0.42)"
    >
      <Facebook className={iconClassName()} strokeWidth={2.2} fill="currentColor" />
    </Brand3DShell>
  );
}

export function X3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#2b2b2b] via-[#4a4a4a] to-[#0a0a0a]"
      depthColor="#0a0a0a"
      glowColor="rgba(15,15,15,0.38)"
    >
      <X className={iconClassName()} strokeWidth={2.6} />
    </Brand3DShell>
  );
}

export function Instagram3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]"
      depthColor="#7a2f96"
      glowColor="rgba(221,42,123,0.42)"
    >
      <Instagram className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}

export function WhatsApp3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#25d366] via-[#4ae584] to-[#128c7e]"
      depthColor="#128c7e"
      glowColor="rgba(37,211,102,0.42)"
    >
      <MessageCircle className={iconClassName()} strokeWidth={2.2} fill="currentColor" />
    </Brand3DShell>
  );
}

export function PaymentGateway3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#7c3aed] via-[#a78bfa] to-[#5b21b6]"
      depthColor="#5b21b6"
      glowColor="rgba(124,58,237,0.42)"
    >
      <CreditCard className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}

export function Payroll3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#f59e0b] via-[#fbbf24] to-[#d97706]"
      depthColor="#d97706"
      glowColor="rgba(245,158,11,0.42)"
    >
      <DollarSign className={iconClassName()} strokeWidth={2.4} />
    </Brand3DShell>
  );
}

export function Ai3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#6366f1] via-[#818cf8] to-[#4338ca]"
      depthColor="#4338ca"
      glowColor="rgba(99,102,241,0.42)"
    >
      <Brain className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}

export function Recruitment3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#0284c7] via-[#38bdf8] to-[#0369a1]"
      depthColor="#0369a1"
      glowColor="rgba(2,132,199,0.42)"
    >
      <Briefcase className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}

export function Workforce3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#059669] via-[#34d399] to-[#047857]"
      depthColor="#047857"
      glowColor="rgba(5,150,105,0.42)"
    >
      <Users className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}

export function Learning3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#ec4899] via-[#f472b6] to-[#be185d]"
      depthColor="#be185d"
      glowColor="rgba(236,72,153,0.42)"
    >
      <GraduationCap className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}

export function Analytics3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#0891b2] via-[#22d3ee] to-[#0e7490]"
      depthColor="#0e7490"
      glowColor="rgba(8,145,178,0.42)"
    >
      <BarChart2 className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}

export function Scheduling3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#ea580c] via-[#fb923c] to-[#c2410c]"
      depthColor="#c2410c"
      glowColor="rgba(234,88,12,0.42)"
    >
      <Calendar className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}

export function GlobalOps3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#0ea5e9] via-[#67e8f9] to-[#0284c7]"
      depthColor="#0284c7"
      glowColor="rgba(14,165,233,0.42)"
    >
      <Globe className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}

export function Compliance3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#14b8a6] via-[#5eead4] to-[#0f766e]"
      depthColor="#0f766e"
      glowColor="rgba(20,184,166,0.42)"
    >
      <ShieldCheck className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}

export function Automation3DIcon(props: Brand3DIconProps) {
  return (
    <Brand3DShell
      className={props.className}
      gradient="bg-linear-to-br from-[#8b5cf6] via-[#c4b5fd] to-[#6d28d9]"
      depthColor="#6d28d9"
      glowColor="rgba(139,92,246,0.42)"
    >
      <Bot className={iconClassName()} strokeWidth={2.2} />
    </Brand3DShell>
  );
}
