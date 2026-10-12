import type { Metadata } from "next";
import { CheckCircle2, Shield, Timer, Zap } from "lucide-react";
import { TryFreeLoginClient } from "./TryFreeLoginClient";
import { TRIAL_DURATION_DAYS } from "@/lib/employers/constants";

export const metadata: Metadata = {
  title: "Try it free",
  description:
    "Request a tailored Agency or Standalone workspace. Verify your email and get a 5-day try-free login with all modules.",
};

const HIGHLIGHTS = [
  {
    icon: Timer,
    title: `${TRIAL_DURATION_DAYS}-day free trial`,
    body: "Full workspace access — no credit card to start.",
  },
  {
    icon: Zap,
    title: "All modules unlocked",
    body: "Jobs, candidates, interviews, matches, and more.",
  },
  {
    icon: Shield,
    title: "Agency or Standalone",
    body: "Pick the workspace type that matches how you hire.",
  },
] as const;

export default function TryFreePage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#f7fafc] px-4 pb-20 pt-28 sm:px-6 sm:pt-32 lg:pb-24">
      {/* Atmosphere — brand orange + sky, not flat white */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 55% at 8% 0%, rgba(249,115,22,0.18), transparent 55%),
            radial-gradient(ellipse 70% 50% at 92% 8%, rgba(40,168,223,0.22), transparent 50%),
            radial-gradient(ellipse 50% 40% at 50% 100%, rgba(40,168,223,0.08), transparent 60%),
            linear-gradient(180deg, #fff7ed 0%, #f8fafc 42%, #eef6fb 100%)
          `,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f172a' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-14">
        <aside className="mx-auto w-full max-w-lg lg:mx-0 lg:sticky lg:top-32 lg:max-w-none">
          <p className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-700 shadow-sm backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            Try HRyantra free
          </p>
          <h1 className="mt-5 text-balance text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            Start hiring in{" "}
            <span className="bg-gradient-to-r from-orange-500 to-[#28A8DF] bg-clip-text text-transparent">
              {TRIAL_DURATION_DAYS} days
            </span>
            , not weeks.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-slate-600 sm:text-[17px]">
            Tell us Agency or Standalone, verify your email, and we create your try-free login
            with every module ready to explore.
          </p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li
                key={item.title}
                className="flex gap-3 rounded-2xl border border-white/80 bg-white/60 p-3.5 shadow-[0_12px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur-sm"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-50 to-orange-50 text-[#28A8DF] ring-1 ring-sky-100">
                  <item.icon className="h-5 w-5" strokeWidth={2.25} />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-sm leading-snug text-slate-500">{item.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-6 flex items-start gap-2 text-xs leading-relaxed text-slate-500">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            After the trial ends, request access and our team follows up from HQ CRM.
          </p>
        </aside>

        <div className="mx-auto w-full max-w-lg lg:mx-0 lg:max-w-none">
          <TryFreeLoginClient />
        </div>
      </div>
    </main>
  );
}
