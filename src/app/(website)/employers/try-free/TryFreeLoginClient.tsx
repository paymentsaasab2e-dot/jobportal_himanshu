'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  Sparkles,
  X,
} from 'lucide-react';
import { AppLocale, localizePath } from '@/lib/i18n';
import { ALL_COUNTRY_CODES, getCountryCodeForTimeZone } from '@/lib/country-codes';
import {
  resendEmployerDemoOtp,
  sendEmployerDemoOtp,
  verifyEmployerDemoOtp,
} from '@/lib/api/employerDemoApi';
import {
  EMPLOYERS_DEMO_PATH,
  TRIAL_DURATION_DAYS,
  getEmployerPortalLoginUrl,
  getEmployerPortalOrigin,
  getTryFreeLoginApiUrl,
} from '@/lib/employers/constants';
import {
  OrganizationTypeField,
  type OrganizationType,
} from '@/components/employers/OrganizationTypeField';
import { CountrySelectField } from '../request-demo/CountrySelectField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginErrorKind = 'invalid' | 'trial_expired' | 'other';
type View = 'signup' | 'login' | 'success';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COMPANY_SIZES = [
  '1–10 employees',
  '11–50 employees',
  '51–200 employees',
  '201–500 employees',
  '501–1,000 employees',
  '1,000+ employees',
] as const;

function classifyLoginError(status: number, message: string, code?: string): LoginErrorKind {
  const lowered = message.toLowerCase();
  const codeLower = String(code || '').toLowerCase();
  if (
    status === 403 ||
    codeLower === 'trial_expired' ||
    lowered.includes('trial_expired') ||
    lowered.includes('trial has ended') ||
    lowered.includes('trial expired')
  ) {
    return 'trial_expired';
  }
  if (
    status === 401 ||
    lowered.includes('invalid') ||
    lowered.includes('credentials') ||
    lowered.includes('password')
  ) {
    return 'invalid';
  }
  return 'other';
}

function extractRegionFromLocale(localeTag: string): string | null {
  const normalized = String(localeTag || '').trim().replace(/_/g, '-');
  if (!normalized) return null;
  const parts = normalized.split('-');
  for (let i = parts.length - 1; i >= 0; i -= 1) {
    const part = parts[i];
    if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
  }
  return null;
}

function detectBrowserCountryCode(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fromTz = getCountryCodeForTimeZone(tz);
    if (fromTz) return fromTz;
  } catch {
    // fall through
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

function looksLikeEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function TryFreeLoginClient() {
  const locale = useLocale() as AppLocale;
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);

  const [view, setView] = useState<View>('signup');
  const [accessMode, setAccessMode] = useState(false);

  const [organizationType, setOrganizationType] = useState<OrganizationType | ''>('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dialCode, setDialCode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [outcome, setOutcome] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestId, setRequestId] = useState('');
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpPreview, setOtpPreview] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const verifyInFlight = useRef(false);

  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [trialReady, setTrialReady] = useState(false);
  const [issuedTenantDbName, setIssuedTenantDbName] = useState('');
  const [issuedTrialEndsAt, setIssuedTrialEndsAt] = useState('');
  const [credentialEmailSent, setCredentialEmailSent] = useState(false);

  const dialCodeOptions = useMemo(() => {
    const seen = new Set<string>();
    return ALL_COUNTRY_CODES.filter((c) => {
      if (!c.dialCode || seen.has(c.dialCode)) return false;
      seen.add(c.dialCode);
      return true;
    });
  }, []);

  useEffect(() => {
    const detected = detectBrowserCountryCode();
    if (!detected) return;
    const match = ALL_COUNTRY_CODES.find((c) => c.code === detected);
    if (!match) return;
    setCountryCode((prev) => prev || match.code);
    setDialCode((prev) => prev || match.dialCode);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const timer = window.setTimeout(() => setResendTimer((t) => t - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendTimer]);

  const buildFormPayload = (requestKind: 'trial' | 'demo') => ({
    email: email.trim().toLowerCase(),
    fullName: fullName.trim() || email.trim().split('@')[0] || 'Employer',
    countryCode,
    dialCode,
    phoneNumber: phoneNumber.replace(/\D/g, ''),
    companySize: companySize || '1–10 employees',
    organizationName: organizationName.trim() || 'Trial company',
    organizationType: (organizationType || 'agency') as OrganizationType,
    requestKind,
    outcome:
      outcome.trim() ||
      (requestKind === 'trial'
        ? `Auto try-free (${TRIAL_DURATION_DAYS} days)`
        : 'Trial expired — request further access'),
  });

  const validateSignupForm = (forAccessRequest = false): string | null => {
    if (!organizationType) return 'Please choose Agency or Standalone workspace type.';
    if (!fullName.trim()) return 'Full name is required.';
    if (!looksLikeEmail(email.trim())) return 'Please enter a valid email address.';
    if (!countryCode) return 'Country is required.';
    if (!dialCode) return 'Phone country code is required.';
    if (phoneNumber.replace(/\D/g, '').length < 6) return 'Please enter a valid phone number.';
    if (!companySize) return 'Company size is required.';
    if (!organizationName.trim()) return 'Organization name is required.';
    if (!forAccessRequest && !outcome.trim()) {
      // outcome optional for trial signup — user asked for the field but not always required
    }
    return null;
  };

  const handleSignupSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validateSignupForm(false);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const result = await sendEmployerDemoOtp(buildFormPayload(accessMode ? 'demo' : 'trial'));
      setRequestId(result.data?.requestId || '');
      setOtpPreview(result.data?.otp || '');
      setOtp('');
      setOtpError('');
      setResendTimer(30);
      setOtpModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start try-free signup.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!requestId || !email.trim() || resendTimer > 0) return;
    setLoading(true);
    setOtpError('');
    try {
      const result = await resendEmployerDemoOtp(requestId, email.trim().toLowerCase());
      setOtpPreview(result.data?.otp || '');
      setResendTimer(30);
      setOtp('');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtpVerification = async (code: string) => {
    if (!requestId || code.length !== 6 || verifyInFlight.current) return;
    verifyInFlight.current = true;
    setIsVerifying(true);
    setOtpError('');
    try {
      const result = await verifyEmployerDemoOtp(requestId, email.trim().toLowerCase(), code);
      const data = result.data || {};
      setOtpModalOpen(false);

      if (accessMode || data.requestKind === 'demo') {
        setAccessMode(false);
        setTrialReady(false);
        setIssuedTenantDbName('');
        setIssuedTrialEndsAt('');
        setCredentialEmailSent(false);
        setView('success');
        return;
      }

      setTrialReady(true);
      setIssuedTenantDbName(String(data.tenantDbName || ''));
      setIssuedTrialEndsAt(String(data.trialEndsAt || ''));
      setCredentialEmailSent(Boolean(data.credentialEmailSent));
      setView('success');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      verifyInFlight.current = false;
      setIsVerifying(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const identifier = email.trim();
    if (!identifier || !password) {
      setError('Enter your user ID / email and password.');
      return;
    }

    setLoading(true);
    try {
      const isEmail = looksLikeEmail(identifier);
      const res = await fetch(getTryFreeLoginApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: isEmail ? identifier.toLowerCase() : undefined,
          loginId: isEmail ? undefined : identifier,
          password,
        }),
      });

      const payload = await res.json().catch(() => ({}));
      const message = String(payload?.message || payload?.error || 'Login failed');
      const code = String(payload?.data?.code || payload?.code || '');

      if (!res.ok) {
        const kind = classifyLoginError(res.status, message, code);
        if (kind === 'trial_expired') {
          setShowExpiredModal(true);
          return;
        }
        setError(message || 'Unable to sign in. Please try again.');
        return;
      }

      const data = payload?.data || {};
      if (data.duplicateSession) {
        window.location.href = getEmployerPortalLoginUrl();
        return;
      }

      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken || '';
      const tenantDbName = data.tenantDbName || '';
      if (!accessToken) {
        setError('Login succeeded but no session token was returned.');
        return;
      }

      const hash = new URLSearchParams();
      hash.set('accessToken', accessToken);
      if (refreshToken) hash.set('refreshToken', refreshToken);
      if (tenantDbName) hash.set('tenantDbName', tenantDbName);
      window.location.href = `${getEmployerPortalOrigin()}/login#tryFreeHandoff=${encodeURIComponent(hash.toString())}`;
    } catch (err) {
      const detail = err instanceof Error ? err.message : '';
      setError(
        detail
          ? `Unable to reach the employer workspace (${detail}). Ensure Phase 2 API is running on port 5001.`
          : 'Unable to reach the employer workspace. Ensure Phase 2 API is running on port 5001.',
      );
    } finally {
      setLoading(false);
    }
  };

  const startAccessRequest = () => {
    setShowExpiredModal(false);
    setAccessMode(true);
    setError('');
    setView('signup');
  };

  const fieldClass =
    'h-11 rounded-xl border-slate-200 bg-white shadow-sm transition focus-visible:border-[#28A8DF] focus-visible:ring-[#28A8DF]/25';
  const labelClass = 'text-sm font-semibold text-slate-800';
  const primaryBtn =
    'h-12 w-full rounded-xl bg-gradient-to-r from-[#28A8DF] to-[#1f8fc4] text-[15px] font-semibold text-white shadow-[0_14px_28px_-14px_rgba(40,168,223,0.9)] transition hover:brightness-105';

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 shadow-[0_28px_80px_-36px_rgba(15,23,42,0.45)] ring-1 ring-slate-200/60 backdrop-blur-xl">
        <div className="border-b border-slate-100 bg-gradient-to-r from-orange-50/80 via-white to-sky-50/80 px-6 py-4 sm:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-orange-700">
              Free trial
            </span>
            <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-700">
              {TRIAL_DURATION_DAYS} days · all modules
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
        {view === 'success' ? (
          <>
            {trialReady ? (
              <>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-[#28A8DF] ring-4 ring-sky-50">
                  <Mail className="h-7 w-7" />
                </div>
                <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">
                  Check your email for login credentials
                </h2>
                <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
                  {credentialEmailSent
                    ? 'We have sent your User ID and password to your email. Kindly check your inbox (and spam folder) to sign in.'
                    : 'Your try-free workspace is ready. If the email is delayed, wait a minute and check spam — or use Sign in below once you receive the credentials.'}
                  {issuedTrialEndsAt ? (
                    <>
                      {' '}
                      Your {TRIAL_DURATION_DAYS}-day access is valid until{' '}
                      <strong className="text-slate-700">{issuedTrialEndsAt}</strong>.
                    </>
                  ) : (
                    <> Your try-free access includes all modules for {TRIAL_DURATION_DAYS} days.</>
                  )}
                </p>
                <a
                  href={getEmployerPortalLoginUrl(issuedTenantDbName || undefined)}
                  className={`mt-6 inline-flex ${primaryBtn} items-center justify-center`}
                >
                  Open Phase 2 login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setError('');
                  }}
                  className="mt-3 w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-800"
                >
                  Or sign in here with emailed credentials
                </button>
              </>
            ) : (
              <>
                <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 ring-4 ring-emerald-50">
                  <Check className="h-7 w-7" strokeWidth={2.5} />
                </div>
                <h2 className="text-center text-2xl font-black tracking-tight text-slate-900">
                  Access request submitted
                </h2>
                <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
                  Thanks — your details are in HQ CRM Leads. The HRyantra team will contact you for
                  further access.
                </p>
                <Button
                  type="button"
                  onClick={() => {
                    setAccessMode(false);
                    setView('signup');
                    setError('');
                  }}
                  className={`mt-8 ${primaryBtn}`}
                >
                  Back to Try it free
                </Button>
              </>
            )}
          </>
        ) : null}

        {view === 'signup' ? (
          <>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-sky-50 text-[#28A8DF] ring-1 ring-sky-100">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900 sm:text-[1.65rem]">
              {accessMode ? 'Request further access' : 'Request your tailored demo'}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              {accessMode
                ? 'Tell us how we can help after your trial. We’ll add this to HQ CRM Leads for the HRyantra team.'
                : `Choose Agency or Standalone. We’ll email a verification code, then create your ${TRIAL_DURATION_DAYS}-day try-free login with all modules.`}
            </p>

            <form onSubmit={handleSignupSubmit} className="mt-7 space-y-4">
              <OrganizationTypeField value={organizationType} onChange={setOrganizationType} />

              <div className="space-y-1.5">
                <Label htmlFor="try-free-name" className={labelClass}>
                  Full name <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="try-free-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="try-free-email" className={labelClass}>
                  Email <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="try-free-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@any-domain.com"
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label className={labelClass}>
                  Country <span className="text-orange-500">*</span>
                </Label>
                <CountrySelectField
                  value={countryCode}
                  onChange={(code) => {
                    setCountryCode(code);
                    const match = ALL_COUNTRY_CODES.find((c) => c.code === code);
                    if (match?.dialCode) setDialCode(match.dialCode);
                  }}
                  countries={ALL_COUNTRY_CODES.map((c) => ({ code: c.code, name: c.name }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="try-free-phone" className={labelClass}>
                  Phone number <span className="text-orange-500">*</span>
                </Label>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <select
                    id="try-free-dial"
                    value={dialCode}
                    onChange={(e) => {
                      const nextDial = e.target.value;
                      setDialCode(nextDial);
                      const match = ALL_COUNTRY_CODES.find((c) => c.dialCode === nextDial);
                      if (match) setCountryCode(match.code);
                    }}
                    className={`${fieldClass} px-2 text-sm`}
                  >
                    <option value="">Code</option>
                    {dialCodeOptions.map((option) => (
                      <option key={option.dialCode} value={option.dialCode}>
                        {option.dialCode}
                      </option>
                    ))}
                  </select>
                  <Input
                    id="try-free-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone number"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="try-free-size" className={labelClass}>
                  Company size <span className="text-orange-500">*</span>
                </Label>
                <select
                  id="try-free-size"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className={`${fieldClass} w-full px-3 text-sm`}
                >
                  <option value="">— Company size —</option>
                  {COMPANY_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="try-free-org" className={labelClass}>
                  Organization name <span className="text-orange-500">*</span>
                </Label>
                <Input
                  id="try-free-org"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Company Inc."
                  className={fieldClass}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="try-free-outcome" className={labelClass}>
                  What outcome are you trying to achieve?
                </Label>
                <textarea
                  id="try-free-outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  rows={3}
                  placeholder="e.g. Hire faster for multiple clients"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm transition focus-visible:border-[#28A8DF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#28A8DF]/25"
                />
              </div>

              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

              <Button type="submit" disabled={loading} className={primaryBtn}>
                {loading
                  ? 'Sending code…'
                  : accessMode
                    ? 'Verify & request access'
                    : `Start ${TRIAL_DURATION_DAYS}-day free trial`}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-7 flex flex-col items-center gap-2 border-t border-slate-100 pt-5 text-sm text-slate-500">
              <button
                type="button"
                onClick={() => {
                  setAccessMode(false);
                  setError('');
                  setView('login');
                }}
                className="font-semibold text-[#28A8DF] hover:underline"
              >
                Already have try-free credentials? Sign in
              </button>
              <p>
                Prefer a live walkthrough?{' '}
                <Link href={demoHref} className="font-semibold text-orange-600 hover:underline">
                  Book a demo
                </Link>
              </p>
            </div>
          </>
        ) : null}

        {view === 'login' ? (
          <>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-sky-50 text-[#28A8DF] ring-1 ring-sky-100">
              <LogIn className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Sign in to try free</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Use the User ID and password from your trial email.
            </p>
            <form onSubmit={handleLogin} className="mt-7 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="try-free-login-id" className={labelClass}>
                  User ID or email
                </Label>
                <Input
                  id="try-free-login-id"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name_xx@trial"
                  className={fieldClass}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="try-free-password" className={labelClass}>
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="try-free-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className={`${fieldClass} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

              <Button type="submit" disabled={loading} className={primaryBtn}>
                {loading ? 'Signing in…' : 'Sign in to Phase 2'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={() => {
                  setAccessMode(false);
                  setError('');
                  setView('signup');
                }}
                className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to signup
              </button>
            </form>
          </>
        ) : null}
        </div>
      </div>

      {showExpiredModal ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setShowExpiredModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="try-free-expired-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowExpiredModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Lock className="h-7 w-7" />
            </div>
            <h2
              id="try-free-expired-title"
              className="mb-3 text-center text-2xl font-bold tracking-tight text-slate-900"
            >
              Trial has ended
            </h2>
            <p className="mb-8 text-center text-[15px] font-medium leading-relaxed text-slate-500">
              Kindly contact the HRyantra team for further access.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={startAccessRequest}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8DF] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1f97cb]"
              >
                Request access
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowExpiredModal(false)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-[15px] font-semibold text-slate-600 transition-all hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {otpModalOpen ? (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <div
            className="relative w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="try-free-otp-title"
          >
            <button
              type="button"
              onClick={() => setOtpModalOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-[#28A8DF]">
              <Mail className="h-7 w-7" />
            </div>
            <h2
              id="try-free-otp-title"
              className="mb-2 text-center text-2xl font-bold tracking-tight text-slate-900"
            >
              Verify your email
            </h2>
            <p className="mb-6 text-center text-sm text-slate-500">
              Enter the 6-digit code sent to <strong className="text-slate-700">{email.trim()}</strong>
            </p>
            <Input
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => {
                const next = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(next);
                if (next.length === 6) void submitOtpVerification(next);
              }}
              placeholder="••••••"
              className="h-12 text-center text-lg tracking-[0.35em]"
            />
            {otpPreview ? (
              <p className="mt-2 text-center text-xs text-amber-700">
                Dev fallback code: <strong>{otpPreview}</strong>
              </p>
            ) : null}
            {otpError ? <p className="mt-2 text-center text-sm font-medium text-rose-600">{otpError}</p> : null}
            <Button
              type="button"
              disabled={isVerifying || otp.length !== 6}
              onClick={() => void submitOtpVerification(otp)}
              className="mt-5 h-11 w-full bg-[#28A8DF] text-white hover:bg-[#1f97cb]"
            >
              {isVerifying ? 'Verifying…' : accessMode ? 'Confirm access request' : 'Create try-free account'}
            </Button>
            <button
              type="button"
              disabled={resendTimer > 0 || loading}
              onClick={() => void handleResendOtp()}
              className="mt-3 w-full text-center text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50"
            >
              {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
