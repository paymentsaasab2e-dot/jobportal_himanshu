"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  RotateCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { ALL_COUNTRY_CODES, getCountryCodeForTimeZone } from "@/lib/country-codes";
import {
  resendEmployerDemoOtp,
  sendEmployerDemoOtp,
  verifyEmployerDemoOtp,
  type EmployerDemoFormPayload,
} from "@/lib/api/employerDemoApi";
import { AppLocale, localizePath } from "@/lib/i18n";
import { TRIAL_DURATION_DAYS } from "@/lib/employers/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CountrySelectField } from "./CountrySelectField";
import {
  OrganizationTypeField,
  type OrganizationType,
} from "@/components/employers/OrganizationTypeField";
import {
  buildCalendarCells,
  composeDemoOutcome,
  formatLongDate,
  formatMonthYear,
  getAvailableSlotsForDate,
  isDateAvailable,
  isPastDate,
  isWeekend,
  markSlotBooked,
  parseIsoDate,
  readBookedSlots,
  toIsoDate,
  type BookedSlotsMap,
} from "./demoBooking";

const COMPANY_SIZES = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "501–1,000 employees",
  "1,000+ employees",
] as const;

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const;

const DEMO_STEPS = [
  { id: 1, label: "Basic Information" },
  { id: 2, label: "Calendar" },
  { id: 3, label: "Available Times" },
  { id: 4, label: "Confirm Booking" },
] as const;

const HIGHLIGHTS = [
  "Pick a live time slot",
  "Reply within 1 business day",
  "Built around your goals",
] as const;

function extractRegionFromLocale(localeTag: string): string | null {
  const normalized = String(localeTag || "").trim().replace(/_/g, "-");
  if (!normalized) return null;
  const parts = normalized.split("-");
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const part = parts[i];
    if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
  }
  return null;
}

/** Detect visitor country from timezone, then browser locale (same approach as WhatsApp login). */
function detectBrowserCountryCode(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fromTz = getCountryCodeForTimeZone(tz);
    if (fromTz) return fromTz;
  } catch {
    // fall through to locale
  }

  const locales =
    Array.isArray(window.navigator.languages) && window.navigator.languages.length
      ? window.navigator.languages
      : [window.navigator.language];

  for (const localeTag of locales) {
    const region = extractRegionFromLocale(localeTag);
    if (region && ALL_COUNTRY_CODES.some((c) => c.code === region)) return region;
  }

  return null;
}

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
  organizationType: OrganizationType | "";
  outcome: string;
  preferredDate: string;
  preferredTime: string;
};

const initialForm: FormState = {
  fullName: "",
  email: "",
  countryCode: "",
  dialCode: "",
  phoneNumber: "",
  companySize: "",
  organizationName: "",
  organizationType: "",
  outcome: "",
  preferredDate: "",
  preferredTime: "",
};

const fieldClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15";

const selectClass =
  "h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <ol className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
      {DEMO_STEPS.map((step, index) => {
        const done = currentStep > step.id;
        const active = currentStep === step.id;
        return (
          <li key={step.id} className="flex min-w-0 flex-1 items-center gap-2 sm:flex-col sm:items-stretch sm:gap-2">
            <div className="flex items-center gap-2 sm:w-full">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-violet-600 text-white"
                    : active
                      ? "bg-violet-100 text-violet-700 ring-2 ring-violet-500/30"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? <Check className="h-4 w-4" /> : step.id}
              </span>
              <span
                className={`text-xs font-semibold sm:hidden ${
                  active ? "text-slate-900" : done ? "text-violet-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
              {index < DEMO_STEPS.length - 1 ? (
                <span
                  className={`ml-1 hidden h-px flex-1 sm:block ${done ? "bg-violet-400" : "bg-slate-200"}`}
                  aria-hidden
                />
              ) : null}
            </div>
            <span
              className={`hidden text-[11px] font-semibold leading-tight sm:block ${
                active ? "text-slate-900" : done ? "text-violet-700" : "text-slate-400"
              }`}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function RequestDemoClient({ intent = "demo" }: { intent?: "demo" | "trial" }) {
  const locale = useLocale() as AppLocale;
  const isTrial = intent === "trial";
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [bookedSlots, setBookedSlots] = useState<BookedSlotsMap>({});
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
  const [trialAccess, setTrialAccess] = useState<{
    loginUrl?: string;
    loginId?: string;
    trialEndsAt?: string;
    devPassword?: string;
    credentialEmailSent?: boolean;
  } | null>(null);
  const verifyInFlight = useRef(false);
  const hasAutoDetectedCountry = useRef(false);

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

  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);

  const availableTimes = useMemo(
    () => (form.preferredDate ? getAvailableSlotsForDate(form.preferredDate, bookedSlots) : []),
    [form.preferredDate, bookedSlots],
  );

  useEffect(() => {
    setBookedSlots(readBookedSlots());
  }, []);

  useEffect(() => {
    if (hasAutoDetectedCountry.current || !countries.length) return;
    hasAutoDetectedCountry.current = true;

    setForm((prev) => {
      if (prev.countryCode && prev.dialCode) return prev;

      const detectedCode = detectBrowserCountryCode();
      const match =
        (detectedCode && countries.find((c) => c.code === detectedCode)) ||
        countries.find((c) => c.code === "IN") ||
        countries[0];

      if (!match) return prev;
      return {
        ...prev,
        countryCode: prev.countryCode || match.code,
        dialCode: prev.dialCode || match.dialCode,
      };
    });
  }, [countries]);

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

  const validateStep1 = (): boolean => {
    const email = form.email.trim();
    if (!form.organizationType) {
      setFormError("Please choose Agency or Standalone workspace type.");
      return false;
    }
    if (!form.fullName.trim()) {
      setFormError("Full name is required.");
      return false;
    }
    if (!EMAIL_REGEX.test(email)) {
      setFormError("Please enter a valid email address.");
      return false;
    }
    if (!form.countryCode) {
      setFormError("Country is required.");
      return false;
    }
    if (!form.dialCode) {
      setFormError("Phone country code is required.");
      return false;
    }
    if (!form.phoneNumber.replace(/\D/g, "").trim()) {
      setFormError("Phone number is required.");
      return false;
    }
    if (!form.companySize) {
      setFormError("Company size is required.");
      return false;
    }
    if (!form.organizationName.trim()) {
      setFormError("Organization name is required.");
      return false;
    }
    setFormError("");
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!form.preferredDate) {
      setFormError("Please select an available date.");
      return false;
    }
    if (!isDateAvailable(parseIsoDate(form.preferredDate))) {
      setFormError("That date is no longer available. Please choose another.");
      return false;
    }
    const openSlots = getAvailableSlotsForDate(form.preferredDate, bookedSlots);
    if (openSlots.length === 0) {
      setFormError("No open time slots on that date. Please choose another day.");
      return false;
    }
    setFormError("");
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!form.preferredTime) {
      setFormError("Please select an available time slot.");
      return false;
    }
    if (!availableTimes.includes(form.preferredTime as (typeof availableTimes)[number])) {
      setFormError("That time slot was just taken. Please choose another.");
      return false;
    }
    setFormError("");
    return true;
  };

  const goNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((s) => Math.min(4, s + 1));
  };

  const goBack = () => {
    setFormError("");
    setStep((s) => Math.max(1, s - 1));
  };

  const buildPayload = (): EmployerDemoFormPayload | null => {
    if (!validateStep1()) return null;
    if (!isTrial) {
      if (!validateStep2()) return null;
      if (!validateStep3()) return null;
    }

    const email = form.email.trim();
    const outcome = isTrial
      ? form.outcome.trim() || undefined
      : composeDemoOutcome({
          outcome: form.outcome,
          preferredDate: form.preferredDate,
          preferredTime: form.preferredTime,
        }) || undefined;

    return {
      email,
      fullName: form.fullName.trim(),
      countryCode: form.countryCode,
      dialCode: form.dialCode,
      phoneNumber: form.phoneNumber.replace(/\D/g, ""),
      companySize: form.companySize,
      organizationName: form.organizationName.trim(),
      organizationType: form.organizationType as OrganizationType,
      outcome,
      requestKind: isTrial ? "trial" : "demo",
    };
  };

  const handleSendOtp = async (event?: React.FormEvent) => {
    event?.preventDefault();
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
        const result = await verifyEmployerDemoOtp(requestId, form.email.trim(), code);
        if (!isTrial && form.preferredDate && form.preferredTime) {
          markSlotBooked(form.preferredDate, form.preferredTime);
          setBookedSlots(readBookedSlots());
        }
        setOtpModalOpen(false);
        if (isTrial) {
          setTrialAccess({
            loginUrl: result.data?.loginUrl,
            loginId: result.data?.loginId,
            trialEndsAt: result.data?.trialEndsAt,
            devPassword: result.data?.devPassword,
            credentialEmailSent: result.data?.credentialEmailSent,
          });
        }
        setSuccessModalOpen(true);
      } catch (err) {
        setOtpError(err instanceof Error ? err.message : "Invalid verification code.");
      } finally {
        setIsVerifying(false);
        verifyInFlight.current = false;
      }
    },
    [form.email, form.preferredDate, form.preferredTime, requestId, isTrial],
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

  const selectDate = (date: Date) => {
    if (!isDateAvailable(date)) return;
    const iso = toIsoDate(date);
    setForm((prev) => ({
      ...prev,
      preferredDate: iso,
      preferredTime: prev.preferredDate === iso ? prev.preferredTime : "",
    }));
    setFormError("");
  };

  const shiftMonth = (delta: number) => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const renderBasicFields = () => (
    <>
      <OrganizationTypeField
        value={form.organizationType}
        onChange={(organizationType) => updateField("organizationType", organizationType)}
      />

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
    </>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fc] pt-24 pb-16 text-slate-900">
      {otpModalOpen ? (
        <div className="fixed inset-0 z-10050 flex items-center justify-center p-4">
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
                your {isTrial ? "trial" : "demo"} request.
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
                className="h-12 w-full rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700"
              >
                {isVerifying ? "Verifying…" : isTrial ? "Verify & start trial" : "Verify & schedule demo"}
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
        <div className="fixed inset-0 z-10050 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" aria-hidden />
          <div
            className="relative z-10 w-full max-w-md rounded-2xl border border-emerald-200/80 bg-white p-6 text-center shadow-[0_24px_64px_rgba(15,23,42,0.18)] sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-success-title"
          >
            <DemoSuccessCheckIcon />
            <h2 id="demo-success-title" className="text-xl font-bold text-emerald-900">
              {isTrial ? `Your ${TRIAL_DURATION_DAYS}-day trial is ready` : "Demo request scheduled"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-emerald-800">
              {isTrial ? (
                <>
                  Thanks — your email is verified and a{" "}
                  <strong>{form.organizationType === "agency" ? "Agency" : "Standalone"}</strong> workspace for{" "}
                  <strong>{form.organizationName}</strong> is live for {TRIAL_DURATION_DAYS} days.
                  {trialAccess?.credentialEmailSent
                    ? " We emailed your login details."
                    : " Use the button below to sign in."}
                </>
              ) : (
                <>
                  Thanks — your email is verified. Your{" "}
                  <strong>{form.organizationType === "agency" ? "Agency" : "Standalone"}</strong> demo for{" "}
                  <strong>{form.organizationName}</strong>
                  {form.preferredDate && form.preferredTime ? (
                    <>
                      {" "}
                      is booked for{" "}
                      <strong>
                        {formatLongDate(form.preferredDate)} at {form.preferredTime}
                      </strong>
                      .
                    </>
                  ) : (
                    "."
                  )}{" "}
                  A specialist will confirm within one business day.
                </>
              )}
            </p>
            {isTrial && trialAccess?.loginUrl ? (
              <div className="mt-5 space-y-3 text-left text-sm text-slate-700">
                {trialAccess.loginId ? (
                  <p>
                    <span className="font-semibold text-slate-900">Login ID:</span>{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">{trialAccess.loginId}</code>
                  </p>
                ) : null}
                {trialAccess.trialEndsAt ? (
                  <p>
                    <span className="font-semibold text-slate-900">Trial ends:</span> {trialAccess.trialEndsAt}
                  </p>
                ) : null}
                {trialAccess.devPassword ? (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                    Dev password: <strong className="font-mono">{trialAccess.devPassword}</strong>
                  </p>
                ) : null}
                <a
                  href={trialAccess.loginUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700"
                >
                  Open employer workspace
                </a>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500">
          <Link href={localizePath("/", locale)} className="transition-colors hover:text-slate-800">
            Home
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          <Link
            href={localizePath("/employers", locale)}
            className="transition-colors hover:text-slate-800"
          >
            Employers
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          <span className="font-medium text-slate-700">
            {isTrial ? "Try it free" : "Request a Demo"}
          </span>
        </nav>

        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:gap-16">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex rounded-full border border-violet-200/80 bg-violet-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-700">
              {isTrial ? `Try it free · ${TRIAL_DURATION_DAYS} days` : "Recommended demo booking"}
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl">
              {isTrial ? (
                <>
                  Get{" "}
                  <span className="bg-linear-to-r from-violet-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
                    HQ-approved try-free
                  </span>{" "}
                  access on SAASA B2E.
                </>
              ) : (
                <>
                  Book a{" "}
                  <span className="bg-linear-to-r from-violet-600 via-indigo-500 to-sky-500 bg-clip-text text-transparent">
                    tailored demo
                  </span>{" "}
                  in four steps.
                </>
              )}
            </h1>

            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              {isTrial
                ? "Request access and HQ will email try-free credentials when your demo is approved. Sign in on the Try it free page."
                : "Share your basics, pick an open date and time, then confirm your booking."}
            </p>

            {!isTrial ? (
              <ul className="mt-8 space-y-3 text-sm text-slate-600">
                {DEMO_STEPS.map((s) => (
                  <li key={s.id} className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        step === s.id
                          ? "bg-violet-600 text-white"
                          : step > s.id
                            ? "bg-violet-100 text-violet-700"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {step > s.id ? <Check className="h-3.5 w-3.5" /> : s.id}
                    </span>
                    <span className={step === s.id ? "font-semibold text-slate-900" : ""}>
                      {s.label}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
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
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
            {isTrial ? (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    Start your free trial
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    We provision a dedicated workspace for {TRIAL_DURATION_DAYS} days after email
                    verification. Choose Agency or Standalone, then login details are emailed to you.
                  </p>
                </div>

                {formError ? (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}

                <form onSubmit={(e) => void handleSendOtp(e)} className="space-y-5">
                  {renderBasicFields()}
                  <Button
                    type="submit"
                    disabled={isSendingOtp}
                    className="h-12 w-full rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 text-base font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700"
                  >
                    {isSendingOtp ? "Submitting…" : "Start free trial"}
                    {!isSendingOtp ? <Mail className="ml-2 h-4 w-4" /> : null}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <StepIndicator currentStep={step} />

                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                    {step === 1 && "Request your tailored demo"}
                    {step === 2 && "Choose a date"}
                    {step === 3 && "Available times"}
                    {step === 4 && "Confirm your booking"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {step === 1 &&
                      "Tell us whether you need an Agency or Standalone workspace. Any valid email works — we'll send a verification code before submitting."}
                    {step === 2 &&
                      "Select an available weekday. Weekends are disabled; only open dates can be chosen."}
                    {step === 3 &&
                      `Pick a time for ${form.preferredDate ? formatLongDate(form.preferredDate) : "your date"}. Booked slots are hidden.`}
                    {step === 4 &&
                      "Review your details below, then verify your email to lock in this demo slot."}
                  </p>
                </div>

                {formError ? (
                  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                ) : null}

                <div className="space-y-5">
                  {step === 1 ? renderBasicFields() : null}

                  {step === 2 ? (
                    <div className="w-full space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => shiftMonth(-1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                          aria-label="Previous month"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <div className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                          <CalendarDays className="h-4 w-4 text-violet-600" />
                          {formatMonthYear(calendarMonth)}
                        </div>
                        <button
                          type="button"
                          onClick={() => shiftMonth(1)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-600 transition hover:bg-slate-50"
                          aria-label="Next month"
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {WEEKDAYS.map((day) => (
                          <div key={day} className="py-1">
                            {day}
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-7 gap-1">
                        {calendarCells.map((cell, index) => {
                          if (!cell) {
                            return <div key={`empty-${index}`} className="h-10" />;
                          }
                          const iso = toIsoDate(cell);
                          const available = isDateAvailable(cell);
                          const selected = form.preferredDate === iso;
                          const disabled = !available;
                          const weekend = isWeekend(cell);
                          const past = isPastDate(cell);

                          return (
                            <button
                              key={iso}
                              type="button"
                              disabled={disabled}
                              onClick={() => selectDate(cell)}
                              className={`flex h-10 w-full items-center justify-center rounded-md text-sm font-semibold transition ${
                                selected
                                  ? "bg-violet-600 text-white shadow-sm shadow-violet-500/25"
                                  : disabled
                                    ? past || weekend
                                      ? "cursor-not-allowed text-slate-300"
                                      : "cursor-not-allowed text-slate-300"
                                    : "text-slate-800 hover:bg-violet-50 hover:text-violet-700"
                              }`}
                              aria-pressed={selected}
                              aria-label={iso}
                            >
                              {cell.getDate()}
                            </button>
                          );
                        })}
                      </div>

                      {form.preferredDate ? (
                        <p className="rounded-lg border border-violet-100 bg-violet-50 px-3 py-2 text-sm text-violet-800">
                          Selected: <strong>{formatLongDate(form.preferredDate)}</strong>
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {step === 3 ? (
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Clock className="h-4 w-4 text-violet-600" />
                        Available times
                      </div>
                      {availableTimes.length === 0 ? (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                          No open slots left on this date. Go back and pick another day.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {availableTimes.map((slot) => {
                            const selected = form.preferredTime === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => updateField("preferredTime", slot)}
                                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                                  selected
                                    ? "border-violet-500 bg-violet-50 text-violet-800 ring-2 ring-violet-500/20"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50/50"
                                }`}
                              >
                                {slot}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {step === 4 ? (
                    <div className="space-y-5">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-center">
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                          <Check className="h-6 w-6" strokeWidth={2.5} />
                        </div>
                        <h3 className="text-lg font-bold text-emerald-900">Booking ready to confirm</h3>
                        <p className="mt-1 text-sm text-emerald-800">
                          Verify your email on the next screen to lock this slot.
                        </p>
                      </div>

                      <dl className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-slate-500">Date</dt>
                          <dd className="text-right font-semibold text-slate-900">
                            {form.preferredDate ? formatLongDate(form.preferredDate) : "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-slate-500">Time</dt>
                          <dd className="text-right font-semibold text-slate-900">
                            {form.preferredTime || "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-slate-500">Workspace</dt>
                          <dd className="text-right font-semibold text-slate-900">
                            {form.organizationType === "agency"
                              ? "Agency"
                              : form.organizationType === "standalone"
                                ? "Standalone"
                                : "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-slate-500">Organization</dt>
                          <dd className="text-right font-semibold text-slate-900">
                            {form.organizationName || "—"}
                          </dd>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <dt className="text-slate-500">Contact</dt>
                          <dd className="text-right font-semibold text-slate-900">
                            {form.fullName}
                            <span className="mt-0.5 block font-normal text-slate-500">
                              {form.email}
                            </span>
                          </dd>
                        </div>
                        {form.outcome.trim() ? (
                          <div className="border-t border-slate-200 pt-3">
                            <dt className="mb-1 text-slate-500">Desired outcome</dt>
                            <dd className="font-medium text-slate-800">{form.outcome.trim()}</dd>
                          </div>
                        ) : null}
                      </dl>
                    </div>
                  ) : null}

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                    {step > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goBack}
                        className="h-11 rounded-xl border-slate-200"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                    ) : (
                      <span />
                    )}

                    {step < 4 ? (
                      <Button
                        type="button"
                        onClick={goNext}
                        className="h-11 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700 sm:min-w-[140px]"
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        disabled={isSendingOtp}
                        onClick={() => void handleSendOtp()}
                        className="h-11 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 font-semibold text-white shadow-lg shadow-violet-500/25 hover:from-violet-700 hover:to-indigo-700 sm:min-w-[200px]"
                      >
                        {isSendingOtp ? "Confirming…" : "Confirm booking"}
                        {!isSendingOtp ? <ShieldCheck className="ml-2 h-4 w-4" /> : null}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}

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
