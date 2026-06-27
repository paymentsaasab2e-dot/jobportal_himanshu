"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Copy, Loader2, ShieldCheck, X } from "lucide-react";
import type { PricingPlan } from "@/components/ui/pricing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ALL_COUNTRY_CODES } from "@/lib/country-codes";
import {
  completeEmployerPurchase,
  resendEmployerDemoOtp,
  sendEmployerDemoOtp,
  verifyEmployerDemoOtp,
} from "@/lib/api/employerDemoApi";
import {
  buildSignupPaymentOrder,
  formatInr,
  qrImageUrl,
  type SignupPaymentOrder,
} from "@/lib/employers/signupPayment";
import { CountrySelectField } from "@/app/(website)/employers/request-demo/CountrySelectField";
import {
  OrganizationTypeField,
  type OrganizationType,
} from "@/components/employers/OrganizationTypeField";

const COMPANY_SIZES = [
  "1–10 employees",
  "11–50 employees",
  "51–200 employees",
  "201–500 employees",
  "501–1,000 employees",
  "1,000+ employees",
] as const;

type FormState = {
  fullName: string;
  email: string;
  countryCode: string;
  dialCode: string;
  phoneNumber: string;
  companySize: string;
  organizationName: string;
  organizationType: OrganizationType | "";
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
};

const fieldClass =
  "h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15";

const selectClass =
  "h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/15";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = "form" | "otp" | "pay" | "success";

type Props = {
  open: boolean;
  plan: PricingPlan | null;
  isMonthly: boolean;
  onClose: () => void;
};

export function EmployerPackageSignupModal({ open, plan, isMonthly, onClose }: Props) {
  const [step, setStep] = useState<Step>("form");
  const [form, setForm] = useState<FormState>(initialForm);
  const [requestId, setRequestId] = useState("");
  const [otp, setOtp] = useState("");
  const [otpPreview, setOtpPreview] = useState("");
  const [formError, setFormError] = useState("");
  const [otpError, setOtpError] = useState("");
  const [payError, setPayError] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [paymentOrder, setPaymentOrder] = useState<SignupPaymentOrder | null>(null);
  const [copied, setCopied] = useState(false);
  const [access, setAccess] = useState<{
    loginUrl?: string;
    loginId?: string;
    devPassword?: string;
    credentialEmailSent?: boolean;
    credentialEmailError?: string;
    planName?: string;
    email?: string;
  } | null>(null);
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
    if (!open) {
      setStep("form");
      setForm(initialForm);
      setRequestId("");
      setOtp("");
      setOtpPreview("");
      setFormError("");
      setOtpError("");
      setPayError("");
      setPaymentOrder(null);
      setAccess(null);
      setCopied(false);
    }
  }, [open]);

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

  const buildPayload = () => {
    const email = form.email.trim();
    if (!EMAIL_REGEX.test(email)) {
      setFormError("Please enter a valid email address.");
      return null;
    }
    if (!form.fullName.trim()) {
      setFormError("Full name is required.");
      return null;
    }
    if (!form.countryCode || !form.dialCode || !form.phoneNumber.replace(/\D/g, "").trim()) {
      setFormError("Phone details are required.");
      return null;
    }
    if (!form.companySize || !form.organizationName.trim()) {
      setFormError("Organization details are required.");
      return null;
    }
    if (!form.organizationType) {
      setFormError("Please choose Agency or Standalone workspace type.");
      return null;
    }
    if (!plan?.packageSlug) {
      setFormError("Selected package is invalid.");
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
      organizationType: form.organizationType,
      requestKind: "purchase" as const,
      packageSlug: plan.packageSlug,
      billingCycle: (isMonthly ? "monthly" : "annual") as "monthly" | "annual",
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
      setStep("otp");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to send verification code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const submitOtpVerification = useCallback(
    async (code: string) => {
      if (!requestId || code.length !== 6 || verifyInFlight.current || !plan) return;

      verifyInFlight.current = true;
      setIsVerifying(true);
      setOtpError("");

      try {
        const result = await verifyEmployerDemoOtp(requestId, form.email.trim(), code);
        if (result.data?.readyForPayment) {
          setPaymentOrder(buildSignupPaymentOrder(plan, isMonthly));
          setStep("pay");
          return;
        }
        throw new Error("Could not continue to payment.");
      } catch (err) {
        setOtpError(err instanceof Error ? err.message : "Invalid verification code.");
      } finally {
        setIsVerifying(false);
        verifyInFlight.current = false;
      }
    },
    [form.email, isMonthly, plan, requestId],
  );

  useEffect(() => {
    if (step !== "otp" || otp.length !== 6 || isVerifying) return;
    void submitOtpVerification(otp);
  }, [otp, step, isVerifying, submitOtpVerification]);

  const copyUpi = async () => {
    if (!paymentOrder?.merchantUpi) return;
    try {
      await navigator.clipboard.writeText(paymentOrder.merchantUpi);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setPayError("Could not copy UPI ID");
    }
  };

  const handleConfirmPayment = async () => {
    if (!paymentOrder || !requestId) return;
    setIsPaying(true);
    setPayError("");
    try {
      const paymentReference = `pay_clone_${paymentOrder.orderId}_${Date.now()}`;
      const result = await completeEmployerPurchase({
        requestId,
        email: form.email.trim(),
        paymentReference,
      });
      setAccess({
        loginUrl: result.data?.loginUrl,
        loginId: result.data?.loginId,
        devPassword: result.data?.devPassword,
        credentialEmailSent: result.data?.credentialEmailSent,
        credentialEmailError: result.data?.credentialEmailError,
        planName: result.data?.subscriptionPlan?.name || plan?.name,
        email: form.email.trim(),
      });
      setStep("success");
    } catch (err) {
      setPayError(err instanceof Error ? err.message : "Payment confirmation failed.");
    } finally {
      setIsPaying(false);
    }
  };

  if (!open || !plan) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-slate-900/55 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-[#072654] px-5 py-4 text-white">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/60">Get started with</p>
            <p className="text-lg font-bold">{plan.name}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6">
          {step === "form" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <p className="text-sm text-slate-600">
                Fill in your details to continue. Choose <strong>Agency</strong> or{" "}
                <strong>Standalone</strong>, then verify email and pay to access Phase 2 with the{" "}
                <strong>{plan.name}</strong> limits.
              </p>
              {formError ? <p className="text-sm text-rose-600">{formError}</p> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <OrganizationTypeField
                  value={form.organizationType}
                  onChange={(organizationType) => updateField("organizationType", organizationType)}
                />
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Full name *</Label>
                  <Input className={fieldClass} value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} required />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Work email *</Label>
                  <Input type="email" className={fieldClass} value={form.email} onChange={(e) => updateField("email", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Country *</Label>
                  <CountrySelectField value={form.countryCode} onChange={handleCountryChange} countries={countries} className={selectClass} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dial code *</Label>
                  <select className={selectClass} value={form.dialCode} onChange={(e) => updateField("dialCode", e.target.value)} required>
                    <option value="">Select</option>
                    {dialCodeOptions.map((opt) => (
                      <option key={opt.dialCode} value={opt.dialCode}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Phone number *</Label>
                  <Input className={fieldClass} value={form.phoneNumber} onChange={(e) => updateField("phoneNumber", e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Company size *</Label>
                  <select className={selectClass} value={form.companySize} onChange={(e) => updateField("companySize", e.target.value)} required>
                    <option value="">Select</option>
                    {COMPANY_SIZES.map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Organization name *</Label>
                  <Input className={fieldClass} value={form.organizationName} onChange={(e) => updateField("organizationName", e.target.value)} required />
                </div>
              </div>
              <Button type="submit" disabled={isSendingOtp} className="h-12 w-full rounded-xl bg-[#2b7fff] text-base font-semibold">
                {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Continue"}
              </Button>
            </form>
          ) : null}

          {step === "otp" ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Enter the 6-digit code sent to <strong>{form.email}</strong>
              </p>
              {otpPreview ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Dev fallback code: <strong className="font-mono">{otpPreview}</strong>
                </div>
              ) : null}
              {otpError ? <p className="text-sm text-rose-600">{otpError}</p> : null}
              <Input
                inputMode="numeric"
                maxLength={6}
                autoFocus
                className={`${fieldClass} text-center text-lg font-mono tracking-[0.35em]`}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => setStep("form")} className="text-slate-600 hover:text-slate-900">← Edit details</button>
                <button
                  type="button"
                  disabled={resendTimer > 0 || isSendingOtp}
                  onClick={async () => {
                    if (!requestId) return;
                    setIsSendingOtp(true);
                    try {
                      const result = await resendEmployerDemoOtp(requestId, form.email.trim());
                      setOtpPreview(result.data?.otp || "");
                      setResendTimer(30);
                    } catch (err) {
                      setOtpError(err instanceof Error ? err.message : "Failed to resend code.");
                    } finally {
                      setIsSendingOtp(false);
                    }
                  }}
                  className="font-medium text-violet-600 disabled:opacity-50"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend code"}
                </button>
              </div>
            </div>
          ) : null}

          {step === "pay" && paymentOrder ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Amount due</p>
                <p className="mt-1 text-3xl font-bold text-slate-900">{formatInr(paymentOrder.amountInr)}</p>
                <p className="mt-1 text-sm text-slate-600">{paymentOrder.description}</p>
              </div>

              <p className="text-center text-sm font-medium text-slate-700">Scan QR with any UPI app</p>
              <div className="mx-auto w-fit rounded-2xl border-2 border-slate-100 bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrImageUrl(paymentOrder.upiPayLink)} alt="UPI QR code" width={220} height={220} className="rounded-lg" />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">UPI ID</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold">{paymentOrder.merchantUpi}</p>
                  <button type="button" onClick={() => void copyUpi()} className="inline-flex items-center gap-1 rounded-lg border bg-white px-2.5 py-1.5 text-xs font-semibold">
                    <Copy className="h-3.5 w-3.5" /> {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              {payError ? <p className="text-sm text-rose-600">{payError}</p> : null}

              <Button
                type="button"
                disabled={isPaying}
                onClick={() => void handleConfirmPayment()}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2b7fff] text-base font-semibold"
              >
                {isPaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {isPaying ? "Activating workspace…" : "Pay & activate workspace"}
              </Button>
            </div>
          ) : null}

          {step === "success" ? (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <p className="mt-3 text-xl font-bold text-slate-900">Workspace ready</p>
              <p className="mt-1 text-sm text-slate-600">
                Your <strong>{access?.planName || plan.name}</strong>{" "}
                {form.organizationType === "agency" ? "Agency" : "Standalone"} workspace is active on Phase 2.
              </p>
              {access?.credentialEmailSent ? (
                <div className="mx-auto mt-5 max-w-md rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Login credentials were sent to{" "}
                  <strong>{access.email || form.email}</strong>. Check your inbox (and spam folder) to sign in.
                </div>
              ) : access?.credentialEmailError ? (
                <div className="mx-auto mt-5 max-w-md rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  We could not email your login details. Use the button below or contact support.
                </div>
              ) : null}
              {access?.loginUrl ? (
                <a
                  href={access.loginUrl}
                  className="mt-5 inline-flex h-12 items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white"
                >
                  Open employer login
                </a>
              ) : null}
              {!access?.credentialEmailSent && access?.loginId ? (
                <p className="mt-4 text-xs text-slate-500">
                  Login ID: <span className="font-mono font-semibold text-slate-700">{access.loginId}</span>
                </p>
              ) : null}
              {access?.devPassword ? (
                <p className="mt-1 text-xs text-amber-700">
                  Dev password: <span className="font-mono font-semibold">{access.devPassword}</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
