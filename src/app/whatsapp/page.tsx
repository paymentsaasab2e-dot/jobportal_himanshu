"use client";

import { useState, useEffect, useRef, useMemo, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck, Mail, AlertCircle, Sparkles, TrendingUp, CheckCircle2, Star, Lock, Eye, EyeOff, UserRoundCheck } from "lucide-react";

import { API_BASE_URL } from '@/lib/api-base';
import { showSuccessToast, showErrorToast } from '@/components/common/toast/toast';
import { useAuth } from '@/components/auth/AuthContext';

import {
  getCountryCodesForLocale,
  getCountryCodeForTimeZone,
  countryCodeToFlag,
  type LocalizedCountryCodeOption,
} from '@/lib/country-codes';
import {
  MathCaptcha,
  validateMathCaptchaAnswer,
  type MathCaptchaChallenge,
} from '@/components/auth/MathCaptcha';
import { AppLocale, localizePath } from "@/lib/i18n";

/** Accept personal and company emails (Gmail, Outlook, Live, corporate domains, etc.) */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function extractRegionFromLocale(localeTag: string): string | null {
  const normalized = String(localeTag || "").trim().replace(/_/g, "-");
  if (!normalized) return null;

  // Handles values like en-US, fr-CM, en-Latn-US.
  const parts = normalized.split("-");
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const part = parts[i];
    if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
  }

  return null;
}

function detectBrowserCountryCode(): string | null {
  if (typeof window === "undefined") return null;

  // Timezone is usually the strongest signal of the user's current location.
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const countryFromTz = getCountryCodeForTimeZone(tz);
    if (countryFromTz) return countryFromTz;
  } catch {
    // no-op: fallback to locale hints
  }

  const navigatorLocales = Array.isArray(window.navigator.languages) && window.navigator.languages.length
    ? window.navigator.languages
    : [window.navigator.language];

  for (const localeTag of navigatorLocales) {
    const region = extractRegionFromLocale(localeTag);
    if (region) return region;
  }

  return null;
}

type AuthMode = "signin" | "signup";
type SignInMethod = "password" | "otp";
type SignInContact = "whatsapp" | "email";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function WhatsAppLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale() as AppLocale;
  const t = useTranslations();
  const { login } = useAuth();
  const countryOptions = useMemo(() => getCountryCodesForLocale(locale), [locale]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("");
  const selectedCountry = useMemo(
    () => countryOptions.find((c) => c.code === selectedCountryCode) ?? countryOptions[0],
    [countryOptions, selectedCountryCode],
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [whatsappNumberValue, setWhatsappNumberValue] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [signInMethod, setSignInMethod] = useState<SignInMethod>("password");
  const [signInContact, setSignInContact] = useState<SignInContact>("whatsapp");
  const [showAccountNotFound, setShowAccountNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaChallenge, setCaptchaChallenge] = useState<MathCaptchaChallenge | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [signInOtpSent, setSignInOtpSent] = useState(false);
  const [otpResendTimer, setOtpResendTimer] = useState(0);
  const [signInOtpContext, setSignInOtpContext] = useState<{
    whatsappNumber: string;
    countryCode: string;
    email: string;
    candidateId?: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownPanelRef = useRef<HTMLDivElement>(null);
  const hasAutoDetectedCountry = useRef(false);

  const isSignIn = authMode === "signin";
  const isOtpSignIn = isSignIn && signInMethod === "otp";
  const showCaptcha = !isSignIn;
  const showSignInWhatsApp = isSignIn && signInContact === "whatsapp";

  useEffect(() => {
    if (otpResendTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpResendTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [otpResendTimer]);

  const resetSignInOtpFlow = () => {
    setOtpValue("");
    setSignInOtpSent(false);
    setOtpResendTimer(0);
    setSignInOtpContext(null);
  };

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup" || mode === "create") {
      setAuthMode("signup");
    } else if (mode === "signin" || mode === "login") {
      setAuthMode("signin");
    }
  }, [searchParams]);

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setError("");
    setCaptchaError("");
    resetSignInOtpFlow();
    setShowAccountNotFound(false);
    setPasswordValue("");
    if (mode === "signin") {
      setSignInMethod("password");
      setSignInContact("whatsapp");
    }
    const path = localizePath("/whatsapp", locale);
    router.replace(`${path}?mode=${mode}`, { scroll: false });
  };

  const handleCountrySelect = (country: LocalizedCountryCodeOption) => {
    setSelectedCountryCode(country.code);
    setIsDropdownOpen(false);
    setCountrySearch("");
    setWhatsappNumberValue(""); // Clear number when country changes
  };

  const toggleCountryDropdown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsDropdownOpen((open) => !open);
  };

  // Auto-detect browser country once and preselect the matching dial code.
  useEffect(() => {
    if (hasAutoDetectedCountry.current || !countryOptions.length) return;
    hasAutoDetectedCountry.current = true;

    const detectedCode = detectBrowserCountryCode();
    if (detectedCode && countryOptions.some((c) => c.code === detectedCode)) {
      setSelectedCountryCode(detectedCode);
      return;
    }

    // Fallback to first sorted option when no browser hint is available.
    setSelectedCountryCode(countryOptions[0].code);
  }, [countryOptions]);

  const filteredCountries = countryOptions
    .filter((country) => {
      const query = countrySearch.trim().toLowerCase();
      if (!query) return true;
      const cleanQuery = query.replace(/\s/g, "");
      return (
        country.displayName.toLowerCase().includes(query) ||
        country.name.toLowerCase().includes(query) ||
        country.code.toLowerCase().includes(query) ||
        country.dialCode.includes(cleanQuery) ||
        country.dialCode.replace(/\+/g, "").includes(cleanQuery)
      );
    })
    .sort((a, b) => {
      const query = countrySearch.trim().toLowerCase().replace(/\s/g, "");
      if (!query) return 0;
      
      // Check for exact dial code match (priority 1)
      const aDialExact = a.dialCode === `+${query}` || a.dialCode === query;
      const bDialExact = b.dialCode === `+${query}` || b.dialCode === query;
      
      if (aDialExact && !bDialExact) return -1;
      if (bDialExact && !aDialExact) return 1;
      
      // Check for dial code starts with (priority 2)
      const aDialStart = a.dialCode.replace(/\+/g, "").startsWith(query);
      const bDialStart = b.dialCode.replace(/\+/g, "").startsWith(query);
      
      if (aDialStart && !bDialStart) return -1;
      if (bDialStart && !aDialStart) return 1;
      
      // Check for name starts with (priority 3)
      const aNameStart =
        a.displayName.toLowerCase().startsWith(query) ||
        a.name.toLowerCase().startsWith(query);
      const bNameStart =
        b.displayName.toLowerCase().startsWith(query) ||
        b.name.toLowerCase().startsWith(query);
      
      if (aNameStart && !bNameStart) return -1;
      if (bNameStart && !aNameStart) return 1;
      
      // Check for country code starts with (priority 4)
      const aCodeStart = a.code.toLowerCase().startsWith(query);
      const bCodeStart = b.code.toLowerCase().startsWith(query);
      
      if (aCodeStart && !bCodeStart) return -1;
      if (bCodeStart && !aCodeStart) return 1;
      
      return 0;
    });

  const countryDropdownPanel = isDropdownOpen ? (
    <div
      ref={dropdownPanelRef}
      className="absolute top-[calc(100%+8px)] left-0 right-0 z-[120] max-h-[min(280px,42vh)] overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.16)]"
      onMouseDown={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setIsDropdownOpen(false);
          setCountrySearch("");
        }
      }}
    >
      <div className="sticky top-0 z-10 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <div className="flex flex-1 items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
            <span className="shrink-0 whitespace-nowrap text-xs text-slate-400">{t("whatsapp.searchLabel")}</span>
            <input
              ref={searchInputRef}
              type="text"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder={t("whatsapp.typeCountryOrCode")}
              className="flex-1 bg-transparent text-[13px] font-semibold text-slate-700 outline-none placeholder:text-slate-400"
            />
            {countrySearch ? (
              <button
                type="button"
                onClick={() => {
                  setCountrySearch("");
                  searchInputRef.current?.focus();
                }}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>
        {countrySearch ? (
          <div className="px-3 pb-2 text-[11px] text-slate-500">
            {t("whatsapp.foundResults", { count: filteredCountries.length })}
          </div>
        ) : null}
      </div>
      <div className="py-1">
        {filteredCountries.map((country) => (
          <button
            key={`${country.code}-${country.dialCode}`}
            type="button"
            className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleCountrySelect(country)}
          >
            <span className="shrink-0 text-[20px] leading-none">{countryCodeToFlag(country.code)}</span>
            <span className="min-w-16 shrink-0 whitespace-nowrap text-[14px] font-bold tabular-nums text-slate-800">
              {country.dialCode}
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-slate-600">
              {country.displayName}
            </span>
          </button>
        ))}
        {filteredCountries.length === 0 ? (
          <div className="px-4 py-4 text-center">
            <p className="text-[13px] font-medium text-slate-500">{t("whatsapp.noCountryFound")}</p>
            <button
              type="button"
              onClick={() => setCountrySearch("")}
              className="mt-2 text-[12px] font-semibold text-sky-600 hover:text-sky-700"
            >
              {t("whatsapp.clearSearch")}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  ) : null;

  // Close dropdown when clicking outside + auto-focus search when opened
  useEffect(() => {
    if (!isDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target) || dropdownPanelRef.current?.contains(target)) {
        return;
      }
      setIsDropdownOpen(false);
      setCountrySearch("");
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setCountrySearch("");
      }
    };

    const timer = window.setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCaptchaError("");
    setShowAccountNotFound(false);

    const intent = isOtpSignIn ? "login" : "signup";
    let normalizedEmail = emailValue.trim().toLowerCase();
    const cleanNumber = whatsappNumberValue.replace(/\D/g, "");

    // Sign-in via mobile OTP not available yet
    if (intent === "login" && signInContact === "whatsapp") {
      setError(t("whatsapp.mobileOtpComingSoon"));
      return;
    }

    if (intent === "signup") {
      if (!whatsappNumberValue.trim() || cleanNumber.length !== selectedCountry.phoneLength) {
        setError(
          !whatsappNumberValue.trim()
            ? t("whatsapp.enterWhatsappNumber")
            : t("whatsapp.exactDigitsWhatsapp", { count: selectedCountry.phoneLength }),
        );
        return;
      }
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        setError(
          !normalizedEmail
            ? t("whatsapp.enterMailAddress")
            : t("whatsapp.enterValidMailAddress"),
        );
        return;
      }
      if (!captchaChallenge || !validateMathCaptchaAnswer(captchaChallenge, captchaAnswer)) {
        setCaptchaError(t("whatsapp.solveMathQuestion"));
        return;
      }

      // Contextual duplication check — credentials only on this page
      const {
        checkCredentialDuplication,
        alertDuplicationFindings,
      } = await import('@/lib/duplication-check');
      const dup = await checkCredentialDuplication({
        context: 'auth.signup',
        email: normalizedEmail,
        phone: cleanNumber,
        countryCode: selectedCountry.dialCode || selectedCountry.code,
      });
      if (!dup.ok) {
        alertDuplicationFindings(dup, { title: 'Account already exists' });
        setError(dup.findings[0]?.message || t("whatsapp.accountExists"));
        setAuthMode("signin");
        return;
      }
    } else if (signInContact === "email") {
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        setError(
          !normalizedEmail
            ? t("whatsapp.enterMailAddress")
            : t("whatsapp.enterValidMailAddress"),
        );
        return;
      }
    } else {
      if (!whatsappNumberValue.trim()) {
        setError(t("whatsapp.enterWhatsappNumber"));
        return;
      }
      if (cleanNumber.length !== selectedCountry.phoneLength) {
        setError(t("whatsapp.exactDigitsWhatsapp", { count: selectedCountry.phoneLength }));
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          intent === "login" && signInContact === "email"
            ? { email: normalizedEmail, intent }
            : {
                whatsappNumber: cleanNumber,
                countryCode: selectedCountry.dialCode,
                ...(normalizedEmail ? { email: normalizedEmail } : {}),
                intent,
              },
        ),
      });

      const data = await response.json();

      if (data.code === "ACCOUNT_NOT_FOUND" || response.status === 404) {
        setShowAccountNotFound(true);
        return;
      }

      if (!response.ok || !data.success) {
        if (data.code === "ACCOUNT_EXISTS" || response.status === 409) {
          showErrorToast(t("whatsapp.accountExists"));
          switchMode("signin");
          setSignInMethod("password");
          return;
        }
        throw new Error(data.message || t("whatsapp.failedToSendOtp"));
      }

      const resolvedEmail = String(data.data?.email || normalizedEmail || "").toLowerCase();
      if (!resolvedEmail) {
        throw new Error(t("whatsapp.enterMailAddress"));
      }

      const resolvedFull = String(data.data?.whatsappNumber || `${selectedCountry.dialCode}${cleanNumber}`);
      const resolvedCountry = String(data.data?.countryCode || selectedCountry.dialCode);
      const dialDigits = resolvedCountry.replace(/\D/g, "");
      const fullDigits = resolvedFull.replace(/\D/g, "");
      const resolvedLocal =
        dialDigits && fullDigits.startsWith(dialDigits)
          ? fullDigits.slice(dialDigits.length)
          : cleanNumber || fullDigits;

      sessionStorage.setItem("whatsappNumber", resolvedLocal);
      sessionStorage.setItem("countryCode", resolvedCountry);
      sessionStorage.setItem("fullWhatsAppNumber", resolvedFull.startsWith("+") ? resolvedFull : `${resolvedCountry}${resolvedLocal}`);
      sessionStorage.setItem("otpEmail", resolvedEmail);
      sessionStorage.setItem("authFlow", intent);
      if (intent === "signup") {
        sessionStorage.setItem("signupOnboarding", "true");
      }
      if (data.data?.candidateId) {
        sessionStorage.setItem("candidateId", data.data.candidateId);
      }

      sessionStorage.removeItem("otpPreview");

      if (isOtpSignIn) {
        setSignInOtpContext({
          whatsappNumber: resolvedLocal,
          countryCode: resolvedCountry,
          email: resolvedEmail,
          candidateId: data.data?.candidateId ? String(data.data.candidateId) : undefined,
        });
        setSignInOtpSent(true);
        setOtpResendTimer(29);
        setOtpValue("");
        showSuccessToast(t("whatsapp.otpSent"), t("whatsapp.checkEmailForCode"));
        return;
      }

      showSuccessToast(t("whatsapp.otpSent"), t("whatsapp.checkEmailForCode"));
      router.push(localizePath("/whatsapp/verify", locale));
    } catch (err: unknown) {
      const isNetworkFail =
        err instanceof TypeError &&
        (err.message === "Failed to fetch" || err.message.includes("fetch"));
      setError(
        isNetworkFail
          ? t("whatsapp.cannotReachApi", { apiBaseUrl: API_BASE_URL })
          : err instanceof Error
            ? err.message
            : t("whatsapp.somethingWentWrong"),
      );
      console.error("Error sending OTP:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendSignInOtp = async () => {
    if (otpResendTimer > 0 || !signInOtpContext) return;
    setError("");
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: signInOtpContext.whatsappNumber,
          countryCode: signInOtpContext.countryCode,
          email: signInOtpContext.email,
          ...(signInOtpContext.candidateId ? { candidateId: signInOtpContext.candidateId } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || t("whatsapp.verify.failedToResendOtp"));
      }
      setOtpResendTimer(29);
      showSuccessToast(t("whatsapp.verify.otpResentTitle"), t("whatsapp.verify.otpResentDescription"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("whatsapp.verify.failedToResendOtp"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySignInOtp = async () => {
    setError("");
    setShowAccountNotFound(false);

    if (!otpValue || otpValue.length !== 6) {
      setError(t("whatsapp.verify.enterValidOtp"));
      return;
    }

    const ctx = signInOtpContext;
    if (!ctx) {
      setError(t("whatsapp.signInOtpSendFirst"));
      return;
    }

    setIsLoading(true);
    try {
      const geo = await import("@/lib/login-geo").then((m) => m.collectLoginGeoPayload());
      try {
        sessionStorage.setItem("saasa:login-geo", JSON.stringify(geo));
      } catch {
        /* ignore */
      }

      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsappNumber: ctx.whatsappNumber,
          countryCode: ctx.countryCode,
          email: ctx.email,
          otp: otpValue,
          ...(ctx.candidateId ? { candidateId: ctx.candidateId } : {}),
          ...geo,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || t("whatsapp.verify.invalidOtp"));
      }

      if (data.data?.token && data.data?.candidateId) {
        login(data.data.token, data.data.candidateId);
      }

      const needsPassword = data.data?.needsPassword === true;
      const skipCv = data.data?.skipCvUpload === true;
      resetSignInOtpFlow();

      if (needsPassword) {
        sessionStorage.setItem("skipCvUpload", skipCv ? "true" : "false");
        showSuccessToast(t("whatsapp.verify.setPasswordNextTitle"), t("whatsapp.verify.setPasswordNextDescription"));
        router.push(localizePath("/whatsapp/set-password", locale));
        return;
      }

      const postLoginRedirect = sessionStorage.getItem("postLoginRedirect");
      showSuccessToast(t("whatsapp.verify.loginSuccessfulTitle"), t("whatsapp.verify.loginSuccessfulDescription"));

      if (!skipCv) {
        router.push(localizePath("/uploadcv", locale));
      } else if (postLoginRedirect) {
        sessionStorage.removeItem("postLoginRedirect");
        router.push(postLoginRedirect);
      } else {
        router.push(localizePath("/candidate-dashboard", locale));
      }
    } catch (err: unknown) {
      const isNetworkFail =
        err instanceof TypeError &&
        (err.message === "Failed to fetch" || err.message.includes("fetch"));
      setError(
        isNetworkFail
          ? t("whatsapp.cannotReachApi", { apiBaseUrl: API_BASE_URL })
          : err instanceof Error
            ? err.message
            : t("whatsapp.verify.verificationFailed"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signInMethod === "otp") {
      if (signInContact === "whatsapp") {
        setError(t("whatsapp.mobileOtpComingSoon"));
        setShowAccountNotFound(false);
        return;
      }
      if (signInOtpSent) {
        await handleVerifySignInOtp();
        return;
      }
      await handleSendOTP(e);
      return;
    }

    setError("");
    setShowAccountNotFound(false);

    const normalizedEmail = emailValue.trim().toLowerCase();
    const cleanNumber = whatsappNumberValue.replace(/\D/g, "");

    if (signInContact === "email") {
      if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
        setError(
          !normalizedEmail
            ? t("whatsapp.enterMailAddress")
            : t("whatsapp.enterValidMailAddress"),
        );
        return;
      }
    } else {
      if (!whatsappNumberValue.trim()) {
        setError(t("whatsapp.enterWhatsappNumber"));
        return;
      }
      if (cleanNumber.length !== selectedCountry.phoneLength) {
        setError(t("whatsapp.exactDigitsWhatsapp", { count: selectedCountry.phoneLength }));
        return;
      }
    }

    if (!passwordValue) {
      setError(t("whatsapp.enterPassword"));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(signInContact === "email"
            ? { email: normalizedEmail, password: passwordValue }
            : {
                whatsappNumber: cleanNumber,
                countryCode: selectedCountry.dialCode || "+91",
                password: passwordValue,
              }),
          ...(await import("@/lib/login-geo").then((m) => m.collectLoginGeoPayload()).then((geo) => {
            try {
              sessionStorage.setItem("saasa:login-geo", JSON.stringify(geo));
            } catch {
              /* ignore */
            }
            return geo;
          })),
        }),
      });

      const data = await response.json();

      if (data.code === "ACCOUNT_NOT_FOUND" || response.status === 404) {
        setShowAccountNotFound(true);
        return;
      }

      if (data.code === "PASSWORD_NOT_SET") {
        setError(t("whatsapp.passwordNotSet"));
        if (signInContact === "email") {
          setSignInMethod("otp");
        }
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || t("whatsapp.invalidCredentials"));
      }

      if (data.data?.token && data.data?.candidateId) {
        login(data.data.token, data.data.candidateId);
      }

      showSuccessToast(t("whatsapp.verify.loginSuccessfulTitle"), t("whatsapp.verify.loginSuccessfulDescription"));

      const skipCv = data.data?.skipCvUpload === true;
      const postLoginRedirect = sessionStorage.getItem("postLoginRedirect");

      if (!skipCv) {
        router.push(localizePath("/uploadcv", locale));
      } else if (postLoginRedirect) {
        sessionStorage.removeItem("postLoginRedirect");
        router.push(postLoginRedirect);
      } else {
        router.push(localizePath("/candidate-dashboard", locale));
      }
    } catch (err: unknown) {
      const isNetworkFail =
        err instanceof TypeError &&
        (err.message === "Failed to fetch" || err.message.includes("fetch"));
      setError(
        isNetworkFail
          ? t("whatsapp.cannotReachApi", { apiBaseUrl: API_BASE_URL })
          : err instanceof Error
            ? err.message
            : t("whatsapp.somethingWentWrong"),
      );
      console.error("Error signing in:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const ctaLabel = isSignIn
    ? signInMethod === "otp"
      ? signInOtpSent
        ? t("whatsapp.signInOtpVerifyCta")
        : t("whatsapp.continue")
      : t("whatsapp.signInCta")
    : t("whatsapp.continue");
  const ctaLoadingLabel = isSignIn
    ? signInMethod === "otp"
      ? signInOtpSent
        ? t("whatsapp.verify.verifying")
        : t("whatsapp.sendingCode")
      : t("whatsapp.signingIn")
    : t("whatsapp.sendingCode");

  return (
    <div className={`min-h-dvh lg:h-dvh lg:max-h-dvh bg-[#F4F8FC] text-slate-900 flex flex-col relative font-sans ${isDropdownOpen ? "overflow-visible" : "overflow-x-hidden lg:overflow-hidden"}`}>
      
      {/* Background Atmosphere */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-12%] right-[-8%] w-[1000px] h-[1000px] bg-[radial-gradient(ellipse_at_center,rgba(8,66,140,0.14)_0%,rgba(255,255,255,0)_68%)]" />
        <div className="absolute bottom-[-14%] left-[-10%] w-[900px] h-[900px] bg-[radial-gradient(ellipse_at_center,rgba(40,168,225,0.12)_0%,rgba(255,255,255,0)_70%)]" />
        <div className="absolute top-[40%] left-[45%] w-[520px] h-[520px] bg-[radial-gradient(ellipse_at_center,rgba(252,150,32,0.06)_0%,rgba(255,255,255,0)_70%)]" />
      </div>

      {/* Header */}
      <header className="flex flex-none items-center justify-between px-5 lg:px-8 py-2.5 lg:py-3 relative z-10 w-full max-w-[1520px] mx-auto">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push(localizePath('/', locale))}>
          <Image
            src="/SAASA%20Logo.png"
            alt="SAASA B2E"
            width={110}
            height={32}
            className="h-7 w-auto hover:opacity-90 transition-opacity"
          />
        </div>
      </header>

      {/* Main content grid */}
      <main className="flex-1 min-h-0 flex flex-col lg:flex-row items-center justify-center relative z-10 w-full max-w-[1520px] px-4 lg:px-6 xl:px-10 py-2 lg:py-3 mx-auto gap-5 lg:gap-6 xl:gap-8">
        
        {/* LEFT: form card stays centered so width grows left + right */}
        <div className="w-full lg:flex-1 flex justify-center items-center z-10 min-w-0">
          <motion.div
            className="w-full flex flex-col items-center"
            initial={false}
            animate={{ maxWidth: isSignIn ? 520 : 620 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
          
          <div className={`w-full bg-white/95 backdrop-blur-xl rounded-[28px] shadow-[0_28px_70px_rgba(8,66,140,0.10)] border border-[#08428c]/10 relative overflow-visible ${isSignIn ? "px-7 py-5 sm:px-8 sm:py-6" : "px-6 py-4 sm:px-8 sm:py-5"}`}>
            <div className="absolute inset-x-0 top-0 h-1 rounded-t-[28px] bg-linear-to-r from-[#08428c] via-[#28a8e1] to-[#FC9620]" />
            
            <div className={`${isSignIn ? "mb-4" : "mb-2.5"} relative flex p-1 rounded-full bg-[#08428c]/06 border border-[#08428c]/10`}>
              <button
                type="button"
                onClick={() => switchMode("signin")}
                className={`relative z-10 flex-1 h-9 sm:h-10 rounded-full text-[13px] font-bold tracking-tight transition-colors duration-500 ${
                  isSignIn ? "text-white" : "text-slate-500 hover:text-[#08428c]"
                }`}
              >
                {isSignIn && (
                  <motion.span
                    layoutId="auth-mode-pill"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-[#08428c] to-[#28a8e1] shadow-[0_8px_22px_rgba(8,66,140,0.35)]"
                    transition={{ type: "spring", stiffness: 280, damping: 32, mass: 0.85 }}
                  />
                )}
                <span className="relative z-10">{t("whatsapp.modeSignIn")}</span>
              </button>
              <button
                type="button"
                onClick={() => switchMode("signup")}
                className={`relative z-10 flex-1 h-9 sm:h-10 rounded-full text-[13px] font-bold tracking-tight transition-colors duration-500 ${
                  !isSignIn ? "text-white" : "text-slate-500 hover:text-[#08428c]"
                }`}
              >
                {!isSignIn && (
                  <motion.span
                    layoutId="auth-mode-pill"
                    className="absolute inset-0 rounded-full bg-linear-to-r from-[#08428c] to-[#28a8e1] shadow-[0_8px_22px_rgba(8,66,140,0.35)]"
                    transition={{ type: "spring", stiffness: 280, damping: 32, mass: 0.85 }}
                  />
                )}
                <span className="relative z-10">{t("whatsapp.modeCreateAccount")}</span>
              </button>
            </div>

            <div className={`${isSignIn ? "mb-4" : "mb-2.5"} text-center`}>
              <h1 className={`font-black text-[#0B1F3A] tracking-tight leading-tight ${isSignIn ? "text-[23px] sm:text-[25px]" : "text-[20px] sm:text-[22px]"}`}>
                {isSignIn ? t("whatsapp.signInHeading") : t("whatsapp.createAccount")}
              </h1>
              <p className="mt-1 text-[12px] sm:text-[13px] font-medium text-slate-500 leading-snug px-1">
                {isSignIn ? t("whatsapp.signInSubtitle") : t("whatsapp.enterContactDetails")}
              </p>
            </div>

            <form className={`${isSignIn ? "space-y-3" : "space-y-2"}`} onSubmit={isSignIn ? handleSignIn : handleSendOTP}>
              
              {/* SIGN IN: WhatsApp | Email icon toggle */}
              {isSignIn && (
                <div className={isDropdownOpen ? "relative z-50" : "relative"}>
                  <div className="flex items-center justify-between mb-1.5 ml-1 gap-2">
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest">
                      {signInContact === "whatsapp" ? t("whatsapp.whatsappNumber") : t("whatsapp.mailAddress")}
                    </label>
                    <div className="relative flex p-0.5 rounded-full bg-slate-100 border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => {
                          setSignInContact("whatsapp");
                          setError("");
                          resetSignInOtpFlow();
                          setShowAccountNotFound(false);
                        }}
                        className={`relative z-10 flex h-8 w-9 items-center justify-center rounded-full transition-colors duration-500 ${
                          signInContact === "whatsapp" ? "text-white" : "text-slate-500 hover:text-[#25D366]"
                        }`}
                        aria-label={t("whatsapp.whatsappNumber")}
                        title={t("whatsapp.whatsappNumber")}
                      >
                        {signInContact === "whatsapp" && (
                          <motion.span
                            layoutId="signin-contact-pill"
                            className="absolute inset-0 rounded-full bg-linear-to-r from-[#08428c] to-[#28a8e1] shadow-[0_4px_10px_rgba(8,66,140,0.28)]"
                            transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
                          />
                        )}
                        <WhatsAppIcon className="relative z-10 h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSignInContact("email");
                          setError("");
                          resetSignInOtpFlow();
                          setShowAccountNotFound(false);
                        }}
                        className={`relative z-10 flex h-8 w-9 items-center justify-center rounded-full transition-colors duration-500 ${
                          signInContact === "email" ? "text-white" : "text-slate-500 hover:text-[#08428c]"
                        }`}
                        aria-label={t("whatsapp.mailAddress")}
                        title={t("whatsapp.mailAddress")}
                      >
                        {signInContact === "email" && (
                          <motion.span
                            layoutId="signin-contact-pill"
                            className="absolute inset-0 rounded-full bg-linear-to-r from-[#08428c] to-[#28a8e1] shadow-[0_4px_10px_rgba(8,66,140,0.28)]"
                            transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
                          />
                        )}
                        <Mail className="relative z-10 h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {showSignInWhatsApp ? (
                      <motion.div
                        key="signin-whatsapp"
                        initial={{ opacity: 0, height: 0, y: 6 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -4 }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        className={isDropdownOpen ? "relative z-50 overflow-visible" : "overflow-hidden"}
                        style={isDropdownOpen ? { overflow: "visible" } : undefined}
                      >
                        <div className="relative z-50" ref={dropdownRef}>
                          <div className="flex rounded-[14px] border border-slate-200 shadow-sm overflow-visible bg-white focus-within:ring-4 focus-within:ring-[#28a8e1]/15 focus-within:border-[#28a8e1] transition-all">
                            <div className="relative shrink-0">
                              <button
                                type="button"
                                aria-expanded={isDropdownOpen}
                                aria-haspopup="listbox"
                                className="flex h-[50px] px-3.5 items-center gap-2 hover:bg-slate-50 transition-colors rounded-l-[14px] text-slate-700 font-medium text-[14px]"
                                onClick={toggleCountryDropdown}
                              >
                                <span className="text-[20px] leading-none">{countryCodeToFlag(selectedCountry.code)}</span>
                                <span className="text-slate-400 text-[10px] ml-0.5">▼</span>
                              </button>
                            </div>

                            <div className="w-px h-7 bg-slate-200 my-auto" />

                            <div className="flex-1 relative">
                              <div className="absolute left-3 top-0 bottom-0 flex items-center text-slate-400 pointer-events-none font-semibold text-[14px]">
                                {selectedCountry.dialCode}
                              </div>
                              <input
                                type="tel"
                                value={whatsappNumberValue}
                                onChange={(e) => setWhatsappNumberValue(e.target.value.replace(/\D/g, "").slice(0, selectedCountry.phoneLength))}
                                maxLength={selectedCountry.phoneLength}
                                inputMode="numeric"
                                className="w-full h-[50px] pl-[52px] pr-4 bg-transparent outline-none text-slate-900 font-bold text-[15px] placeholder:text-slate-300 placeholder:font-semibold rounded-r-[14px]"
                                placeholder={`${selectedCountry.phoneLength} digits`}
                              />
                            </div>
                          </div>
                          {countryDropdownPanel}
                        </div>
                        <div className="flex items-center justify-between mt-1 px-1">
                          <p className="text-[10px] font-bold text-slate-400">
                            {t("whatsapp.digitsRequired", { country: selectedCountry.displayName, count: selectedCountry.phoneLength })}
                          </p>
                          <p className={`text-[10px] font-bold ${whatsappNumberValue.length === selectedCountry.phoneLength ? "text-emerald-500" : "text-slate-400"}`}>
                            {whatsappNumberValue.length}/{selectedCountry.phoneLength}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signin-email"
                        initial={{ opacity: 0, height: 0, y: 6 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -4 }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="relative rounded-[14px] border border-slate-200 shadow-sm overflow-hidden bg-white focus-within:ring-4 focus-within:ring-[#28a8e1]/15 focus-within:border-[#28a8e1] transition-all">
                          <div className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none">
                            <Mail className="h-5 w-5 text-slate-400" />
                          </div>
                          <input
                            type="email"
                            value={emailValue}
                            onChange={(e) => {
                              setEmailValue(e.target.value);
                              if (signInOtpSent) resetSignInOtpFlow();
                            }}
                            className="w-full h-[50px] pl-[48px] pr-4 bg-transparent outline-none text-slate-900 font-bold text-[15px] placeholder:text-slate-300 placeholder:font-semibold"
                            placeholder="name@company.com"
                            autoComplete="email"
                          />
                        </div>
                        <p className="mt-1 px-1 text-[10px] font-bold text-slate-400">
                          {signInMethod === "otp"
                            ? t("whatsapp.emailHint")
                            : t("whatsapp.emailPasswordHint")}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* CREATE ACCOUNT: WhatsApp + Email fields restored (both visible) */}
              {!isSignIn && (
                <>
                  <div className={isDropdownOpen ? "relative z-50" : "relative"}>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1.5 ml-1">{t("whatsapp.whatsappNumber")}</label>
                    <div className={`relative ${isDropdownOpen ? "z-50" : "z-30"}`} ref={dropdownRef}>
                      <div className="flex rounded-[14px] border border-slate-200 shadow-sm overflow-visible bg-white focus-within:ring-4 focus-within:ring-[#28a8e1]/15 focus-within:border-[#28a8e1] transition-all">
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            aria-expanded={isDropdownOpen}
                            aria-haspopup="listbox"
                            className="flex h-[50px] px-3.5 items-center gap-2 hover:bg-slate-50 transition-colors rounded-l-[14px] text-slate-700 font-medium text-[14px]"
                            onClick={toggleCountryDropdown}
                          >
                            <span className="text-[20px] leading-none">{countryCodeToFlag(selectedCountry.code)}</span>
                            <span className="text-slate-400 text-[10px] ml-0.5">▼</span>
                          </button>
                        </div>

                        <div className="w-px h-7 bg-slate-200 my-auto" />

                        <div className="flex-1 relative">
                          <div className="absolute left-3 top-0 bottom-0 flex items-center text-slate-400 pointer-events-none font-semibold text-[14px]">
                            {selectedCountry.dialCode}
                          </div>
                          <input
                            type="tel"
                            value={whatsappNumberValue}
                            onChange={(e) => setWhatsappNumberValue(e.target.value.replace(/\D/g, "").slice(0, selectedCountry.phoneLength))}
                            maxLength={selectedCountry.phoneLength}
                            inputMode="numeric"
                            className="w-full h-[50px] pl-[52px] pr-4 bg-transparent outline-none text-slate-900 font-bold text-[15px] placeholder:text-slate-300 placeholder:font-semibold rounded-r-[14px]"
                            placeholder={`${selectedCountry.phoneLength} digits`}
                          />
                        </div>
                      </div>
                      {countryDropdownPanel}
                    </div>
                    <div className="flex items-center justify-between mt-1 px-1">
                      <p className="text-[10px] font-bold text-slate-400">{t("whatsapp.whatsappHint")}</p>
                      <p className={`text-[10px] font-bold ${whatsappNumberValue.length === selectedCountry.phoneLength ? "text-emerald-500" : "text-slate-400"}`}>
                        {whatsappNumberValue.length}/{selectedCountry.phoneLength}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest mb-1.5 ml-1">{t("whatsapp.mailAddress")}</label>
                    <div className="relative rounded-[14px] border border-slate-200 shadow-sm overflow-hidden bg-white focus-within:ring-4 focus-within:ring-[#28a8e1]/15 focus-within:border-[#28a8e1] transition-all">
                      <div className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        type="email"
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        className="w-full h-[50px] pl-[48px] pr-4 bg-transparent outline-none text-slate-900 font-bold text-[15px] placeholder:text-slate-300 placeholder:font-semibold"
                        placeholder="name@company.com"
                        autoComplete="email"
                      />
                    </div>
                    <p className="mt-1 px-1 text-[10px] font-bold text-slate-400">
                      {t("whatsapp.emailHint")}
                    </p>
                  </div>
                </>
              )}

              {isSignIn && (
                <div className="relative z-0">
                  <div className="flex items-center justify-between mb-1.5 ml-1">
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-widest">
                      {signInMethod === "password" ? t("whatsapp.passwordLabel") : t("whatsapp.methodOtp")}
                    </label>
                    {/* Compact Password / OTP toggle with sliding pill */}
                    <div className="relative flex p-0.5 rounded-full bg-slate-100 border border-slate-200/80 text-[11px] font-bold">
                      <button
                        type="button"
                        onClick={() => {
                          setSignInMethod("password");
                          setError("");
                          resetSignInOtpFlow();
                          setShowAccountNotFound(false);
                        }}
                        className={`relative z-10 px-3 h-7 rounded-full transition-colors duration-500 ${
                          signInMethod === "password" ? "text-white" : "text-slate-500 hover:text-[#08428c]"
                        }`}
                      >
                        {signInMethod === "password" && (
                          <motion.span
                            layoutId="auth-method-pill"
                            className="absolute inset-0 rounded-full bg-linear-to-r from-[#08428c] to-[#28a8e1] shadow-[0_4px_10px_rgba(8,66,140,0.28)]"
                            transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
                          />
                        )}
                        <span className="relative z-10">{t("whatsapp.methodPassword")}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSignInMethod("otp");
                          setError("");
                          setPasswordValue("");
                          resetSignInOtpFlow();
                          setShowAccountNotFound(false);
                        }}
                        className={`relative z-10 px-3 h-7 rounded-full transition-colors duration-500 ${
                          signInMethod === "otp" ? "text-white" : "text-slate-500 hover:text-[#08428c]"
                        }`}
                      >
                        {signInMethod === "otp" && (
                          <motion.span
                            layoutId="auth-method-pill"
                            className="absolute inset-0 rounded-full bg-linear-to-r from-[#08428c] to-[#28a8e1] shadow-[0_4px_10px_rgba(8,66,140,0.28)]"
                            transition={{ type: "spring", stiffness: 260, damping: 30, mass: 0.9 }}
                          />
                        )}
                        <span className="relative z-10">{t("whatsapp.methodOtp")}</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative z-0 overflow-hidden">
                    <AnimatePresence mode="wait" initial={false}>
                      {signInMethod === "password" ? (
                        <motion.div
                          key="password-field"
                          initial={{ opacity: 0, height: 0, y: 6 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="relative rounded-[14px] border border-slate-200 shadow-sm overflow-hidden bg-white focus-within:ring-4 focus-within:ring-[#28a8e1]/15 focus-within:border-[#28a8e1] transition-all">
                            <div className="absolute left-4 top-0 bottom-0 flex items-center pointer-events-none">
                              <Lock className="h-4 w-4 text-slate-400" />
                            </div>
                            <input
                              type={showPassword ? "text" : "password"}
                              value={passwordValue}
                              onChange={(e) => setPasswordValue(e.target.value)}
                              className="w-full h-[50px] pl-[48px] pr-12 bg-transparent outline-none text-slate-900 font-bold text-[15px] placeholder:text-slate-300 placeholder:font-semibold"
                              placeholder={t("whatsapp.passwordPlaceholder")}
                              autoComplete="current-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-3 top-0 bottom-0 flex items-center px-2 text-slate-400 hover:text-slate-600"
                              aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          <div className="mt-2 flex justify-end px-1">
                            <Link
                              href={`${localizePath("/whatsapp/forgot-password", locale)}${
                                signInContact === "email" && emailValue.trim()
                                  ? `?email=${encodeURIComponent(emailValue.trim().toLowerCase())}`
                                  : ""
                              }`}
                              className="text-[11px] font-bold text-[#08428c] hover:text-[#28a8e1] transition-colors"
                            >
                              {t("whatsapp.forgotPasswordLink")}
                            </Link>
                          </div>
                        </motion.div>
                      ) : signInContact === "whatsapp" ? (
                        <motion.div
                          key="otp-mobile-soon"
                          initial={{ opacity: 0, height: 0, y: 6 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-3"
                        >
                          <p className="text-[12px] font-semibold leading-relaxed text-amber-900">
                            {t("whatsapp.mobileOtpComingSoon")}
                          </p>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="otp-email-field"
                          initial={{ opacity: 0, height: 0, y: 6 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -4 }}
                          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden space-y-2"
                        >
                          <p className="text-[12px] font-medium text-slate-500 leading-relaxed px-1">
                            {signInOtpSent
                              ? t("whatsapp.signInOtpEnterCode", {
                                  email: signInOtpContext?.email || emailValue.trim().toLowerCase(),
                                })
                              : t("whatsapp.signInOtpSubtitle")}
                          </p>
                          <div className="relative rounded-[14px] border border-slate-200 shadow-sm overflow-hidden bg-white focus-within:ring-4 focus-within:ring-[#28a8e1]/15 focus-within:border-[#28a8e1] transition-all">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={otpValue}
                              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
                              disabled={!signInOtpSent || isLoading}
                              className="w-full h-[50px] px-4 bg-transparent outline-none text-slate-900 font-bold text-[20px] text-center tracking-[0.45em] placeholder:text-slate-300 placeholder:font-semibold placeholder:tracking-[0.35em] disabled:cursor-not-allowed disabled:bg-slate-50/80"
                              placeholder={t("whatsapp.signInOtpPlaceholder")}
                              autoComplete="one-time-code"
                            />
                          </div>
                          {signInOtpSent ? (
                            <div className="flex items-center justify-between px-1">
                              <button
                                type="button"
                                onClick={() => {
                                  resetSignInOtpFlow();
                                  setError("");
                                }}
                                className="text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
                              >
                                {t("whatsapp.signInOtpChangeEmail")}
                              </button>
                              {otpResendTimer > 0 ? (
                                <span className="text-[11px] font-medium text-slate-400">
                                  {t("whatsapp.verify.resendIn", {
                                    time: `00:${String(otpResendTimer).padStart(2, "0")}`,
                                  })}
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => void handleResendSignInOtp()}
                                  disabled={isLoading}
                                  className="text-[11px] font-bold text-[#08428c] hover:text-[#28a8e1] transition-colors disabled:opacity-50"
                                >
                                  {t("whatsapp.verify.resendCode")}
                                </button>
                              )}
                            </div>
                          ) : null}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {showCaptcha && (
                <MathCaptcha
                  value={captchaAnswer}
                  onChange={(v) => {
                    setCaptchaAnswer(v);
                    if (captchaError) setCaptchaError("");
                  }}
                  onChallengeChange={setCaptchaChallenge}
                  disabled={isLoading}
                  error={captchaError}
                  compact
                />
              )}

              {/* Errors */}
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3 items-start mt-4">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-[13px] font-bold text-red-700 leading-snug pt-0.5">{error}</p>
                </div>
              )}

              {showAccountNotFound && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 mt-2 text-left space-y-3">
                  <div className="flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[14px] font-black text-amber-900">{t("whatsapp.accountNotFoundTitle")}</p>
                      <p className="mt-1 text-[13px] font-medium text-amber-800 leading-snug">
                        {t("whatsapp.accountNotFoundMessage")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className="w-full h-11 rounded-full bg-linear-to-r from-[#E8770E] to-[#FC9620] hover:brightness-105 text-white text-[13px] font-bold transition-all shadow-[0_8px_18px_rgba(252,150,32,0.28)]"
                  >
                    {t("whatsapp.accountNotFoundCta")}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={
                  isLoading ||
                  (isOtpSignIn && signInOtpSent && otpValue.length !== 6)
                }
                className={`w-full flex justify-center items-center gap-2 rounded-full bg-linear-to-r from-[#08428c] to-[#28a8e1] hover:brightness-105 active:brightness-95 text-white font-bold text-[14px] shadow-[0_10px_24px_rgba(8,66,140,0.32)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transform ${isSignIn ? "h-[48px] mt-5" : "h-[46px] mt-3.5"}`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {ctaLoadingLabel}
                  </>
                ) : (
                  <>
                    {ctaLabel}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>

            {/* Trust + legal inside card so nothing clips below the fold */}
            <div className={`${isSignIn ? "mt-4 pt-3.5" : "mt-3 pt-2.5"} border-t border-slate-100 flex flex-col items-center gap-1`}>
              <div className="flex items-center justify-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <p className="text-[11px] font-bold text-slate-500 tracking-tight">
                  {isSignIn ? t("whatsapp.signInTrust") : t("whatsapp.securePasswordlessEntry")}
                </p>
              </div>
              <p className="text-[11px] font-medium text-slate-500 text-center">
                {isSignIn ? t("whatsapp.switchToSignUpPrompt") : t("whatsapp.switchToSignInPrompt")}{" "}
                <button
                  type="button"
                  onClick={() => switchMode(isSignIn ? "signup" : "signin")}
                  className="font-bold text-[#08428c] hover:text-[#28a8e1] transition-colors"
                >
                  {isSignIn ? t("whatsapp.switchToSignUpAction") : t("whatsapp.switchToSignInAction")}
                </button>
              </p>
              <p className="mt-0.5 text-center text-[10px] font-medium text-slate-400 leading-snug max-w-[460px]">
                {t("whatsapp.byContinuing")}{" "}
                <Link href={localizePath("/terms", locale)} className="text-slate-600 hover:text-[#08428c] transition-colors font-bold">
                  {t("footer.termsOfService")}
                </Link>{" "}
                {t("whatsapp.and")}{" "}
                <Link href={localizePath("/privacypolicy", locale)} className="text-slate-600 hover:text-[#08428c] transition-colors font-bold">
                  {t("footer.privacyPolicy")}
                </Link>
                .{" "}
                <Link href={localizePath("/help", locale)} className="text-[#08428c] hover:text-[#28a8e1] font-bold">
                  {t("whatsapp.needHelpEntering")}
                </Link>
              </p>
            </div>

          </div>
        </motion.div>
        </div>

        {/* RIGHT: same card design — simple relevant copy per mode */}
        <div className="hidden lg:flex flex-1 flex-col justify-center items-start relative pl-1 xl:pl-3 pr-1 z-10 min-w-0">
          <div className={`w-full relative transition-[max-width] duration-500 ease-out ${isSignIn ? "max-w-[500px]" : "max-w-[460px]"}`}>
            <div className="absolute top-[30%] left-[20%] w-[300px] h-[300px] bg-[#28a8e1]/20 blur-[100px] rounded-full pointer-events-none" />

            <h2 className="text-[26px] xl:text-[30px] font-black text-[#0B1F3A] tracking-tight leading-[1.12] mb-1.5 relative z-10">
              {isSignIn ? (
                <>
                  {t("whatsapp.signInPanelA")}{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-[#08428c] to-[#28a8e1]">
                    {t("whatsapp.signInPanelHighlight")}
                  </span>{" "}
                  {t("whatsapp.signInPanelB")}
                </>
              ) : (
                <>
                  {t("whatsapp.enterThe")}{" "}
                  <span className="text-transparent bg-clip-text bg-linear-to-r from-[#08428c] to-[#28a8e1]">
                    {t("whatsapp.intelligentEra")}
                  </span>
                  {t("whatsapp.ofHiring")}
                </>
              )}
            </h2>
            <p className="text-[13px] font-medium text-slate-500 leading-snug mb-4 relative z-10 max-w-[420px]">
              {isSignIn ? t("whatsapp.signInPanelSubtitle") : t("whatsapp.aiProfileSubtitle")}
            </p>

            <div className="relative z-10 grid grid-cols-2 gap-3">
              {/* Dark metric card */}
              <div className="col-span-1 bg-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.22)] rounded-[22px] p-4 text-white border border-slate-700/50">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest uppercase bg-white/10 px-2.5 py-1 rounded-full text-slate-300">
                    {isSignIn ? t("whatsapp.atsMatch") : t("whatsapp.panelCardSignUpMetricLabel")}
                  </span>
                </div>
                <p className="text-[34px] font-black leading-none mb-1 tracking-tighter">
                  {isSignIn ? (
                    <>
                      94<span className="text-[17px] text-slate-400 font-bold ml-0.5">%</span>
                    </>
                  ) : (
                    <>
                      60<span className="text-[17px] text-slate-400 font-bold ml-0.5">s</span>
                    </>
                  )}
                </p>
                <p className="text-[12px] font-semibold text-slate-300">
                  {isSignIn ? t("whatsapp.panelCardSignInMetricSub") : t("whatsapp.panelCardSignUpMetricSub")}
                </p>
              </div>

              {/* Mid white card */}
              <div className="col-span-1 bg-white/95 backdrop-blur-xl border border-slate-100 shadow-[0_20px_40px_rgba(0,0,0,0.06)] rounded-[22px] p-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-10 h-10 bg-sky-50 rounded-2xl flex items-center justify-center border border-sky-100">
                    {isSignIn ? (
                      <UserRoundCheck className="w-5 h-5 text-[#28a8e1]" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-[#28a8e1]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                      {isSignIn ? t("whatsapp.panelCardSignInMidEyebrow") : t("whatsapp.panelCardSignUpMidEyebrow")}
                    </p>
                    <p className="text-[13px] font-black text-slate-800 tracking-tight leading-snug">
                      {isSignIn ? t("whatsapp.panelCardSignInMidTitle") : t("whatsapp.panelCardSignUpMidTitle")}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] font-medium text-slate-500 leading-snug">
                  {isSignIn ? t("whatsapp.panelCardSignInMidHint") : t("whatsapp.panelCardSignUpMidHint")}
                </p>
              </div>

              {/* Bottom bar card */}
              <div className="col-span-2 bg-white/95 backdrop-blur-xl border border-white shadow-[0_16px_36px_rgba(0,0,0,0.07)] rounded-[20px] p-3.5 flex items-center gap-3.5">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shrink-0">
                  {isSignIn ? (
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="text-[13px] font-black text-slate-800 tracking-tight truncate">
                      {isSignIn ? t("whatsapp.panelCardSignInBottomTitle") : t("whatsapp.panelCardSignUpBottomTitle")}
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                      {isSignIn ? t("whatsapp.strong") : t("whatsapp.panelCardSignUpBottomBadge")}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 leading-snug mb-1.5">
                    {isSignIn ? t("whatsapp.panelCardSignInBottomHint") : t("whatsapp.panelCardSignUpBottomHint")}
                  </p>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-linear-to-r from-emerald-400 to-emerald-500 w-[92%] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}

export default function WhatsAppLogin() {
  return (
    <Suspense fallback={null}>
      <WhatsAppLoginInner />
    </Suspense>
  );
}
