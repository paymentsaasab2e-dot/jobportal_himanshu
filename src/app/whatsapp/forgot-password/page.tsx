"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";

import { API_BASE_URL } from "@/lib/api-base";
import { showSuccessToast } from "@/components/common/toast/toast";
import { useAuth } from "@/components/auth/AuthContext";
import { AppLocale, localizePath } from "@/lib/i18n";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPasswordInner />
    </Suspense>
  );
}

function ForgotPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale() as AppLocale;
  const t = useTranslations("whatsapp.forgotPassword");
  const { login } = useAuth();

  const [step, setStep] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(0);
  const [resetContext, setResetContext] = useState<{
    whatsappNumber: string;
    countryCode: string;
    candidateId: string;
  } | null>(null);

  useEffect(() => {
    const prefilled = String(searchParams.get("email") || "").trim().toLowerCase();
    if (prefilled) setEmail(prefilled);
  }, [searchParams]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((prev) => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      setError(t("invalidEmail"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t("requestFailed"));
      }

      setEmail(normalizedEmail);
      setResetContext({
        whatsappNumber: String(data.data?.whatsappNumber || ""),
        countryCode: String(data.data?.countryCode || "+91"),
        candidateId: String(data.data?.candidateId || ""),
      });
      setStep("reset");
      setTimer(29);
      showSuccessToast(t("codeSentTitle"), t("codeSentDescription"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("requestFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (timer > 0 || !resetContext) return;
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          whatsappNumber: resetContext.whatsappNumber,
          countryCode: resetContext.countryCode,
          ...(resetContext.candidateId ? { candidateId: resetContext.candidateId } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || t("requestFailed"));
      }
      setTimer(29);
      showSuccessToast(t("codeSentTitle"), t("codeSentDescription"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("requestFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp || otp.length !== 6) {
      setError(t("invalidOtp"));
      return;
    }
    if (password.length < 8) {
      setError(t("minLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("mismatch"));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
          password,
          confirmPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || t("resetFailed"));
      }

      if (data.data?.token && data.data?.candidateId) {
        login(data.data.token, data.data.candidateId);
      }

      showSuccessToast(t("successTitle"), t("successDescription"));

      const postLoginRedirect = sessionStorage.getItem("postLoginRedirect");
      const skipCv = data.data?.skipCvUpload === true;

      if (!skipCv) {
        router.push(localizePath("/uploadcv", locale));
      } else if (postLoginRedirect) {
        sessionStorage.removeItem("postLoginRedirect");
        router.push(postLoginRedirect);
      } else {
        router.push(localizePath("/candidate-dashboard", locale));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("resetFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFDFE] text-slate-900 flex flex-col relative overflow-hidden font-sans">
      <div className="absolute top-0 right-0 -mr-[10%] -mt-[10%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(40,168,225,0.08)_0,rgba(255,255,255,0)_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-[10%] -mb-[10%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(40,168,225,0.05)_0,rgba(255,255,255,0)_60%)] pointer-events-none" />

      <header className="flex flex-none items-center justify-between px-6 py-6 relative z-10 mx-auto w-full max-w-[1240px]">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => router.push(localizePath("/", locale))}
        >
          <Image src="/SAASA%20Logo.png" alt="SAASA B2E" width={120} height={36} className="h-8 w-auto" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full mb-12">
        <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
          <div className="w-16 h-16 bg-sky-50 rounded-[18px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-sky-100">
            <Lock className="w-7 h-7 text-sky-500" />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-tight">
              {step === "request" ? t("requestHeading") : t("resetHeading")}
            </h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500 leading-relaxed max-w-[320px] mx-auto">
              {step === "request" ? t("requestSubtitle") : t("resetSubtitle", { email })}
            </p>
          </div>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex gap-3 items-start mb-6 text-left">
              <AlertCircle className="w-5 h-5 text-red-500 mt-[-1px] shrink-0" />
              <p className="text-sm font-semibold text-red-700 leading-snug">{error}</p>
            </div>
          ) : null}

          {step === "request" ? (
            <form className="space-y-5" onSubmit={handleRequestCode}>
              <div>
                <label className="block text-[12px] font-black text-slate-700 uppercase tracking-widest mb-2 ml-1">
                  {t("emailLabel")}
                </label>
                <div className="relative rounded-[16px] border border-slate-200 shadow-sm overflow-hidden bg-white focus-within:ring-4 focus-within:ring-sky-100/50 focus-within:border-sky-400 transition-all">
                  <div className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-[56px] pl-[52px] pr-4 bg-transparent outline-none text-slate-900 font-bold text-[16px] placeholder:text-slate-300 placeholder:font-semibold"
                    placeholder={t("emailPlaceholder")}
                    autoComplete="email"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] flex justify-center items-center gap-2 rounded-full bg-linear-to-r from-[#08428c] to-[#28a8e1] hover:brightness-105 active:scale-[0.98] text-white font-bold text-[15px] shadow-[0_8px_22px_rgba(8,66,140,0.32)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t("sending") : t("sendCodeCta")}
                {!isLoading ? <ArrowRight className="w-5 h-5" /> : null}
              </button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleResetPassword}>
              <div>
                <label className="block text-[12px] font-black text-slate-700 uppercase tracking-widest mb-2 ml-1">
                  {t("otpLabel")}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full h-14 rounded-xl border border-slate-200 bg-slate-50 text-center text-[24px] font-mono tracking-[0.45em] font-bold text-slate-900 shadow-inner focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all outline-none"
                  placeholder="••••••"
                />
                <div className="mt-2 text-center text-[12px] font-medium text-slate-500">
                  {timer > 0 ? (
                    <span>{t("resendIn", { time: `00:${String(timer).padStart(2, "0")}` })}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleResendCode()}
                      className="text-sky-600 hover:text-sky-700 font-bold"
                    >
                      {t("resendCode")}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-black text-slate-700 uppercase tracking-widest mb-2 ml-1">
                  {t("newPasswordLabel")}
                </label>
                <div className="relative rounded-[16px] border border-slate-200 shadow-sm overflow-hidden bg-white focus-within:ring-4 focus-within:ring-sky-100/50 focus-within:border-sky-400 transition-all">
                  <div className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-[56px] pl-[52px] pr-12 bg-transparent outline-none text-slate-900 font-bold text-[16px] placeholder:text-slate-300 placeholder:font-semibold"
                    placeholder={t("newPasswordPlaceholder")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-0 bottom-0 flex items-center px-2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-black text-slate-700 uppercase tracking-widest mb-2 ml-1">
                  {t("confirmPasswordLabel")}
                </label>
                <div className="relative rounded-[16px] border border-slate-200 shadow-sm overflow-hidden bg-white focus-within:ring-4 focus-within:ring-sky-100/50 focus-within:border-sky-400 transition-all">
                  <div className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-[56px] pl-[52px] pr-12 bg-transparent outline-none text-slate-900 font-bold text-[16px] placeholder:text-slate-300 placeholder:font-semibold"
                    placeholder={t("confirmPasswordPlaceholder")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-0 bottom-0 flex items-center px-2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] flex justify-center items-center gap-2 rounded-full bg-linear-to-r from-[#08428c] to-[#28a8e1] hover:brightness-105 active:scale-[0.98] text-white font-bold text-[15px] shadow-[0_8px_22px_rgba(8,66,140,0.32)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t("resetting") : t("resetCta")}
                {!isLoading ? <ArrowRight className="w-5 h-5" /> : null}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <Link
              href={`${localizePath("/whatsapp", locale)}?mode=signin`}
              className="inline-flex items-center gap-2 text-[13px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("backToSignIn")}
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
