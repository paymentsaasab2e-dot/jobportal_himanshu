"use client";

import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  FileText,
  Target,
  ArrowRight,
  UploadCloud,
  ShieldCheck,
  Zap,
  Microscope,
  Cpu,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

function AuthInterceptModal({
  isOpen,
  onClose,
  title,
  description,
  redirectUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  redirectUrl: string;
}) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleContinue = () => {
    sessionStorage.setItem("postLoginRedirect", redirectUrl);
    router.push("/whatsapp");
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50">
          <Target className="h-7 w-7 text-[#28A8DF]" />
        </div>
        <h2 className="mb-2 text-center text-xl font-bold tracking-tight text-slate-900">
          {title}
        </h2>
        <p className="mb-8 text-center text-sm leading-relaxed text-slate-500">
          {description}
        </p>
        <div className="space-y-3">
          <button
            onClick={handleContinue}
            className="w-full rounded-2xl bg-[#28A8DF] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-sky-500"
          >
            Register / Log In
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-2xl py-3 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center px-8 py-4">
      <span className="text-xl font-bold tracking-tight text-slate-900">
        {value}
      </span>
      <span className="mt-0.5 text-xs font-medium text-slate-400">{label}</span>
    </div>
  );
}

function ScanCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <span className="ml-3 text-[11px] font-medium uppercase tracking-widest text-slate-300">
          ATS Scanner
        </span>
      </div>

      <div className="mb-6 flex items-center gap-6 border-b border-slate-50 pb-6">
        <div className="relative h-16 w-16 shrink-0">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="#f1f5f9"
              strokeWidth="5"
            />
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="#28A8DF"
              strokeWidth="5"
              strokeDasharray="169.6"
              strokeDashoffset="42"
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-slate-800">
            87
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">ATS Score</p>
          <p className="mt-0.5 text-xs text-slate-400">Top 14% of applicants</p>
        </div>
      </div>

      <div className="space-y-3">
        {[
          { label: "Formatting", status: "Pass", ok: true },
          { label: "Keyword Match", status: "3 Missing", ok: false },
          { label: "Readability", status: "Pass", ok: true },
          { label: "Action Verbs", status: "Pass", ok: true },
        ].map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">{row.label}</span>
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                row.ok
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-sky-100 opacity-40 blur-3xl" />
    </div>
  );
}

function KeywordCard() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <div className="h-2.5 w-2.5 rounded-full bg-slate-200" />
        <span className="ml-3 text-[11px] font-medium uppercase tracking-widest text-slate-300">
          Context Matcher
        </span>
      </div>

      <p className="mb-4 text-xs leading-relaxed text-slate-300 line-through">
        Helped migrate legacy systems to cloud infrastructure.
      </p>

      <div className="relative rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <div className="absolute -top-3 left-4 rounded-full bg-[#28A8DF] px-3 py-1 text-[10px] font-semibold text-white">
          AI Rewrite
        </div>
        <p className="pt-1 text-sm font-medium leading-relaxed text-slate-700">
          Spearheaded migration of{" "}
          <span className="font-semibold text-[#28A8DF]">42 legacy systems</span>{" "}
          to <span className="font-semibold text-[#28A8DF]">AWS + Terraform</span>,
          reducing overhead by $250k.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["cloud-native", "Terraform", "AWS", "infrastructure"].map((kw) => (
          <span
            key={kw}
            className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-600"
          >
            +{kw}
          </span>
        ))}
      </div>

      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-50 opacity-60 blur-3xl" />
    </div>
  );
}

export default function ATSCheckPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authConfig, setAuthConfig] = useState({
    title: "",
    description: "",
    redirectUrl: "",
  });

  const triggerGatedAction = (title: string, desc: string, url: string) => {
    setAuthConfig({ title, description: desc, redirectUrl: url });
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 antialiased">
      <main>
        <section className="px-6 pb-20 pt-32">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-10 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-2">
              <Sparkles className="h-3.5 w-3.5 text-[#28A8DF]" />
              <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                AI Enterprise Scanner
              </span>
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 lg:text-[68px]">
              Beat the filters.
              <br />
              <span className="text-[#28A8DF]">Land the interview.</span>
            </h1>

            <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-slate-500">
              Our AI reads your resume exactly like enterprise hiring software
              and exposes the exact gaps before you hit apply.
            </p>

            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() =>
                  triggerGatedAction(
                    "Start AI Scan",
                    "Sign in to upload your CV and receive instant insights.",
                    "/whatsapp",
                  )
                }
                className="inline-flex items-center gap-2.5 rounded-2xl bg-[#28A8DF] px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition-colors hover:bg-sky-500"
              >
                <UploadCloud className="h-4 w-4" />
                Upload CV for Free Scan
                <ArrowRight className="h-4 w-4" />
              </button>
              <button className="inline-flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium text-slate-400 transition-colors hover:text-slate-600">
                See how it works
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-14 inline-flex items-center divide-x divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <StatBadge value="98%" label="Parser accuracy" />
              <StatBadge value="< 20s" label="Scan time" />
              <StatBadge value="50k+" label="Resumes scanned" />
            </div>
          </div>
        </section>

        <section className="border-t border-slate-50 px-6 py-20">
          <div className="mx-auto grid max-w-5xl items-center gap-16 lg:grid-cols-2">
            <div className="mx-auto w-full max-w-sm lg:mx-0">
              <ScanCard />
            </div>

            <div>
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50">
                <Target className="h-5 w-5 text-[#28A8DF]" />
              </div>
              <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 lg:text-4xl">
                X-Ray your application
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                Stop applying blindly. Get an instant compatibility score
                covering formatting errors, readability, and the weak verbs
                costing you interviews.
              </p>
              <div className="mb-8 grid grid-cols-2 gap-4">
                {[
                  {
                    title: "Formatting",
                    desc: "Parser trigger detection",
                    icon: Microscope,
                  },
                  {
                    title: "Readability",
                    desc: "Industry-specific grading",
                    icon: Cpu,
                  },
                  {
                    title: "Benchmarking",
                    desc: "Bullet point quantification",
                    icon: Zap,
                  },
                  {
                    title: "Compliance",
                    desc: "ISO-standard CV analysis",
                    icon: ShieldCheck,
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                      <item.icon className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {["Workday", "Greenhouse", "Lever", "iCIMS"].map((ats) => (
                  <span
                    key={ats}
                    className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500"
                  >
                    {"\u2713"} {ats}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-100 bg-slate-50/60 px-6 py-20">
          <div className="mx-auto grid max-w-5xl items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
                <FileText className="h-5 w-5 text-indigo-500" />
              </div>
              <h2 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-slate-900 lg:text-4xl">
                Bridge the keyword gap
              </h2>
              <p className="mb-8 text-base leading-relaxed text-slate-500">
                Our AI cross-references your experience against any job
                description and automatically refactors your resume to include
                the exact keywords hiring managers filter for.
              </p>
              <ul className="mb-8 space-y-3">
                {[
                  "Finds missing keywords in seconds",
                  "Rewrites bullets to match JD context",
                  "Preserves your authentic voice",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-center gap-2.5 text-sm font-medium text-slate-600"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    {point}
                  </li>
                ))}
              </ul>
              <button
                onClick={() =>
                  triggerGatedAction(
                    "Access CV Editor",
                    "Log in to use the AI CV Editor.",
                    "/whatsapp",
                  )
                }
                className="group inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Try AI CV Editor
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>

            <div className="order-1 mx-auto w-full max-w-sm lg:order-2 lg:mx-0">
              <KeywordCard />
            </div>
          </div>
        </section>

        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="mb-14 text-center">
              <h2 className="mb-3 text-3xl font-bold tracking-tight text-slate-900">
                How it works
              </h2>
              <p className="text-sm text-slate-400">
                Three steps. Less than 20 seconds.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Upload your CV",
                  desc: "PDF or DOCX. We parse every byte.",
                  icon: UploadCloud,
                },
                {
                  step: "02",
                  title: "Add a job description",
                  desc: "Paste the JD from any job board.",
                  icon: Target,
                },
                {
                  step: "03",
                  title: "Get your score",
                  desc: "Instant ATS report + AI suggestions.",
                  icon: Zap,
                },
              ].map((s) => (
                <div
                  key={s.step}
                  className="relative rounded-3xl border border-slate-100 bg-white p-6 transition-shadow hover:shadow-sm"
                >
                  <span className="mb-4 block text-[11px] font-bold tracking-widest text-slate-200">
                    {s.step}
                  </span>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50">
                    <s.icon className="h-5 w-5 text-slate-400" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-slate-800">
                    {s.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-400">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-100 px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 lg:text-5xl">
              Don't guess.
              <br />
              <span className="text-[#28A8DF]">Confirm.</span>
            </h2>
            <p className="mb-8 text-base leading-relaxed text-slate-400">
              Upload your resume for a comprehensive AI scan. It takes less than
              20 seconds to see exactly what recruiter software thinks of your
              profile.
            </p>
            <button
              onClick={() =>
                triggerGatedAction(
                  "Start AI Scan",
                  "Sign in to upload your CV and receive instant insights.",
                  "/whatsapp",
                )
              }
              className="inline-flex items-center gap-2 rounded-2xl bg-[#28A8DF] px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-sky-100 transition-colors hover:bg-sky-500"
            >
              <UploadCloud className="h-4 w-4" />
              Start My Free Scan
            </button>
            <p className="mt-4 text-xs text-slate-300">
              No credit card required {"\u00b7"} Results in &lt;20 seconds
            </p>
          </div>
        </section>
      </main>

      <AuthInterceptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={authConfig.title}
        description={authConfig.description}
        redirectUrl={authConfig.redirectUrl}
      />
    </div>
  );
}
