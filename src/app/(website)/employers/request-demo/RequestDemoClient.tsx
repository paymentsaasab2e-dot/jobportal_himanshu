"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { ChevronRight, Mail, RotateCcw, ShieldCheck, X } from "lucide-react";
import { ALL_COUNTRY_CODES } from "@/lib/country-codes";
import {
  resendEmployerDemoOtp,
  sendEmployerDemoOtp,
  verifyEmployerDemoOtp,
  type EmployerDemoFormPayload,
} from "@/lib/api/employerDemoApi";
import { AppLocale, localizePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelectField } from "./CountrySelectField";

const COMPANY_SIZES = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "501–1,000 employees",
  "1,000+ employees",
] as const;

const HIGHLIGHTS = [
  "Reply within 1 business day",
  "Built around your goals",
  "Your time zone",
] as const;

function DemoSuccessCheckIcon() {
  return (
    <motion.div
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 18 }}
      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
      aria-hidden
    >
      <svg className="h-9 w-9" viewBox="0 0 52 52">
        <motion.circle
          cx="26"
          cy="26"
          r="23"
          fill="none"
          stroke="#059669"
          strokeWidth="3"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
        <motion.path
          fill="none"
          stroke="#059669"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 27l8 8 16-16"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.4, ease: "easeOut" }}
        />
      </svg>
    </motion.div>
  );
}

type FormState = {
  fullName: string;
  email: string;
  countryCode: string;
  dialCode: string;
  phoneNumber: string;
  companySize: string;
  organizationName: string;
  outcome: string;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  countryCode: "",
  dialCode: "",
  phoneNumber: "",
  companySize: "",
  organizationName: "",
  outcome: "",
};

const fieldClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15";

const selectClass =
  "h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

export function RequestDemoClient() {
  const locale = useLocale() as AppLocale;
  const [form, setForm] = useState<FormState>(initialForm);
  const [requestId, setRequestId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpPreview, setOtpPreview] = useState("");
  const [formError, setFormError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const verifyInFlight = useRef(false);

  const countries = useMemo(
    () => ALL_COUNTRY_CODES.map((c) => ({ code: c.code, name: c.name, dialCode: c.dialCode })),
    [],
  );

  const dialCodeOptions = useMemo(() => {
    const seen = new Set<string>();
    return ALL_COUNTRY_CODES.filter((c) => {
      if (seen.has(c.dialCode)) return false;
      seen.add(c.dialCode);
      return true;
    }).map((c) => ({ dialCode: c.dialCode, label: `${c.dialCode} (${c.name})` }));
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError("");
  };

  const handleCountryChange = (isoCode: string) => {
    const country = countries.find((c) => c.code === isoCode);
    setForm((prev) => ({
      ...prev,
      countryCode: isoCode,
      dialCode: country?.dialCode ?? prev.dialCode,
    }));
    setFormError("");
  };

  const buildPayload = (): EmployerDemoFormPayload | null => {
    const email = form.email.trim();
    if (!EMAIL_REGEX.test(email)) {
      setFormError("Please enter a valid email address.");
      return null;
    }
    if (!form.fullName.trim()) {
      setFormError("Full name is required.");
      return null;
    }
    if (!form.countryCode) {
      setFormError("Country is required.");
      return null;
    }
    if (!form.dialCode) {
      setFormError("Phone country code is required.");
      return null;
    }
    if (!form.phoneNumber.replace(/\D/g, "").trim()) {
      setFormError("Phone number is required.");
      return null;
    }
    if (!form.companySize) {
      setFormError("Company size is required.");
      return null;
    }
    if (!form.organizationName.trim()) {
      setFormError("Organization name is required.");
      return null;
    }

    return {
      email,
      fullName: form.fullName.trim(),
      countryCode: form.countryCode,
      dialCode: form.dialCode,
      phoneNumber: form.phoneNumber.replace(/\D/g, ""),
      companySize: form.companySize,
      organizationName: form.organizationName.trim(),
      outcome: form.outcome.trim() || undefined,
    };
  };

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload = buildPayload();
    if (!payload) return;

    setIsSendingOtp(true);
    setFormError("");

    try {
      const result = await sendEmployerDemoOtp(payload);
      setRequestId(result.data?.requestId || "");
      setOtpPreview(result.data?.otp || "");
      setOtp("");
      setOtpError("");
      setResendTimer(30);
      setOtpModalOpen(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!requestId || !form.email.trim() || resendTimer > 0) return;

    setIsSendingOtp(true);
    setOtpError("");

    try {
      const result = await resendEmployerDemoOtp(requestId, form.email.trim());
      setOtpPreview(result.data?.otp || "");
      setResendTimer(30);
      setOtp("");
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to resend verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const submitOtpVerification = useCallback(
    async (code: string) => {
      if (!requestId || code.length !== 6 || verifyInFlight.current) return;

      verifyInFlight.current = true;
      setIsVerifying(true);
      setOtpError("");

      try {
        await verifyEmployerDemoOtp(requestId, form.email.trim(), code);
        setOtpModalOpen(false);
        setSuccessModalOpen(true);
      } catch (err) {
        setOtpError(err instanceof Error ? err.message : "Invalid verification code.");
      } finally {
        setIsVerifying(false);
        verifyInFlight.current = false;
      }
    },
    [form.email, requestId],
  );

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requestId) {
      setOtpError("Please submit the form again to receive a new code.");
      return;
    }
    if (otp.trim().length !== 6) {
      setOtpError("Please enter the 6-digit verification code.");
      return;
    }
    await submitOtpVerification(otp.trim());
  };

  useEffect(() => {
    if (!otpModalOpen || otp.length !== 6 || isVerifying) return;
    void submitOtpVerification(otp);
  }, [otp, otpModalOpen, isVerifying, submitOtpVerification]);

  const closeOtpModal = () => {
    if (isVerifying) return;
    setOtpModalOpen(false);
    setOtp("");
    setOtpError("");
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pt-24 pb-16 text-slate-900">
      {otpModalOpen ? (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={closeOtpModal}
            aria-hidden
          />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:p-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-otp-title"
          >
            <button
              type="button"
              onClick={closeOtpModal}
              disabled={isVerifying}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 pr-8">
              <h2 id="demo-otp-title" className="text-xl font-bold tracking-tight text-slate-900">
                Verify your email
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                We sent a 6-digit code to{" "}
                <strong className="text-slate-700">{form.email}</strong>. Enter it below to confirm
                your demo request.
              </p>
            </div>

            {otpError ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {otpError}
              </div>
            ) : null}

            <form onSubmit={handleVerifyOtp} className="space-y-5">
              {otpPreview ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Dev fallback code: <strong className="font-mono">{otpPreview}</strong>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-semibold text-slate-900">
                  Verification code <RequiredMark />
                </Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="6-digit code"
                  className={`${fieldClass} text-center text-lg font-mono tracking-[0.35em]`}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                    setOtpError("");
                  }}
                />
              </div>

              <Button
                type="submit"
                disabled={isVerifying || otp.length !== 6}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700"
              >
                {isVerifying ? "Verifying…" : "Verify & schedule demo"}
                {!isVerifying ? <ShieldCheck className="ml-2 h-4 w-4" /> : null}
              </Button>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={closeOtpModal}
                  disabled={isVerifying}
                  className="font-medium text-slate-600 transition-colors hover:text-slate-900 disabled:opacity-50"
                >
                  ← Edit details
                </button>
                <button
                  type="button"
                  onClick={() => void handleResendOtp()}
                  disabled={isSendingOtp || resendTimer > 0 || isVerifying}
                  className="inline-flex items-center gap-1.5 font-medium text-violet-600 transition-colors hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : isSendingOtp ? "Sending…" : "Resend code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {successModalOpen ? (
        <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" aria-hidden />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-200/80 bg-white p-6 text-center shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-success-title"
          >
            <DemoSuccessCheckIcon />
            <h2 id="demo-success-title" className="text-xl font-bold text-emerald-900">
              Demo request scheduled
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-800">
              Thanks — your email is verified and your request for{" "}
              <strong>{form.organizationName}</strong> is with our team. A specialist will reach
              out within one business day to schedule your tailored demo.
            </p>
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href={localizePath("/", locale)} className="transition-colors hover:text-slate-800">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-medium text-slate-700">Request a Demo</span>
        </nav>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-16">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex rounded-full border border-violet-200/80 bg-violet-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700">
              Request a demo
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
              Tell us what you need — we&apos;ll{" "}
              <span className="bg-gradient-to-r from-violet-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
                tailor
              </span>{" "}
              a demo to it.
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Not ready to pick a slot? Send us your requirements and a specialist will design a
              demo around your priorities and reach out to schedule.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {HIGHLIGHTS.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Request your tailored demo
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                The more you tell us, the more focused your demo. Any valid email address works —
                we&apos;ll send a verification code before submitting.
              </p>
            </div>

            {formError ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {formError}
              </div>
            ) : null}

            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-semibold text-slate-900">
                    Full name <RequiredMark />
                  </Label>
                  <Input
                    id="fullName"
                    required
                    placeholder="Jane Doe"
                    className={fieldClass}
                    value={form.fullName}
                    onChange={(e) => updateField("fullName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-slate-900">
                    Email <RequiredMark />
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    placeholder="you@any-domain.com"
                    className={fieldClass}
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sm font-semibold text-slate-900">
                  Country <RequiredMark />
                </Label>
                <CountrySelectField
                  id="country"
                  value={form.countryCode}
                  onChange={handleCountryChange}
                  countries={countries}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-[140px_minmax(0,1fr)]">
                <div className="space-y-2">
                  <Label htmlFor="dialCode" className="text-sm font-semibold text-slate-900">
                    Code <RequiredMark />
                  </Label>
                  <select
                    id="dialCode"
                    required
                    value={form.dialCode}
                    onChange={(e) => updateField("dialCode", e.target.value)}
                    className={selectClass}
                  >
                    <option value="">— Code —</option>
                    {dialCodeOptions.map((option) => (
                      <option key={option.dialCode} value={option.dialCode}>
                        {option.dialCode}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-semibold text-slate-900">
                    Phone number <RequiredMark />
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    required
                    placeholder="Phone number"
                    className={fieldClass}
                    value={form.phoneNumber}
                    onChange={(e) => updateField("phoneNumber", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companySize" className="text-sm font-semibold text-slate-900">
                  Company size <RequiredMark />
                </Label>
                <select
                  id="companySize"
                  required
                  value={form.companySize}
                  onChange={(e) => updateField("companySize", e.target.value)}
                  className={selectClass}
                >
                  <option value="">— Company size —</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationName" className="text-sm font-semibold text-slate-900">
                  Organization name <RequiredMark />
                </Label>
                <Input
                  id="organizationName"
                  required
                  placeholder="Company Inc."
                  className={fieldClass}
                  value={form.organizationName}
                  onChange={(e) => updateField("organizationName", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outcome" className="text-sm font-semibold text-slate-900">
                  What outcome are you trying to achieve?
                </Label>
                <textarea
                  id="outcome"
                  rows={4}
                  placeholder="e.g. Reduce time-to-hire, unify HR and payroll, automate onboarding…"
                  className={`${fieldClass} min-h-[120px] resize-y py-3`}
                  value={form.outcome}
                  onChange={(e) => updateField("outcome", e.target.value)}
                />
              </div>

              <Button
                type="submit"
                disabled={isSendingOtp}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700"
              >
                {isSendingOtp ? "Submitting…" : "Submit for demo"}
                {!isSendingOtp ? <Mail className="ml-2 h-4 w-4" /> : null}
              </Button>
            </form>

            <p className="mt-4 text-center text-xs text-slate-400">
              Prefer the employers landing page?{" "}
              <Link
                href={localizePath("/employers", locale)}
                className="font-medium text-violet-600 hover:text-violet-700"
              >
                Back to employers
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
