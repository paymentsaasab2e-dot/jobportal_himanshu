'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale } from 'next-intl';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
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
  getEmployerPortalLoginUrl,
  getEmployerPortalOrigin,
  getTryFreeInterestApiUrl,
  getTryFreeLoginApiUrl,
} from '@/lib/employers/constants';
import {
  OrganizationTypeField,
  type OrganizationType,
} from '@/components/employers/OrganizationTypeField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginErrorKind = 'invalid' | 'trial_expired' | 'other';
type View = 'contact' | 'password' | 'demo' | 'success';

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

function looksLikeEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function TryFreeLoginClient() {
  const locale = useLocale() as AppLocale;
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);

  const [view, setView] = useState<View>('contact');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dialCode, setDialCode] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [organizationType, setOrganizationType] = useState<OrganizationType | ''>('');
  const [requestId, setRequestId] = useState('');
  const [otp, setOtp] = useState('');
  const [otpPreview, setOtpPreview] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const verifyInFlight = useRef(false);
  const hasAutoDetectedCountry = useRef(false);

  const dialCodeOptions = useMemo(() => {
    const seen = new Set<string>();
    return ALL_COUNTRY_CODES.filter((c) => {
      if (seen.has(c.dialCode)) return false;
      seen.add(c.dialCode);
      return true;
    }).map((c) => ({ dialCode: c.dialCode, label: `${c.dialCode} (${c.name})` }));
  }, []);

  useEffect(() => {
    if (hasAutoDetectedCountry.current) return;
    hasAutoDetectedCountry.current = true;
    const detectedCode = detectBrowserCountryCode();
    const match =
      (detectedCode && ALL_COUNTRY_CODES.find((c) => c.code === detectedCode)) ||
      ALL_COUNTRY_CODES.find((c) => c.code === 'IN') ||
      ALL_COUNTRY_CODES[0];
    if (!match) return;
    setCountryCode((prev) => prev || match.code);
    setDialCode((prev) => prev || match.dialCode);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return undefined;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const demoPageHref = useMemo(() => {
    const params = new URLSearchParams();
    if (email.trim()) params.set('email', email.trim());
    if (phoneNumber.trim()) params.set('phone', phoneNumber.replace(/\D/g, ''));
    if (dialCode) params.set('dialCode', dialCode);
    if (countryCode) params.set('country', countryCode);
    const query = params.toString();
    return query ? `${demoHref}?${query}` : demoHref;
  }, [demoHref, email, phoneNumber, dialCode, countryCode]);

  const captureInterest = async () => {
    const identifier = email.trim();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const res = await fetch(getTryFreeInterestApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: identifier.toLowerCase(),
        phoneNumber: cleanPhone,
        dialCode,
        countryCode,
      }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || payload?.success === false) {
      throw new Error(String(payload?.message || 'Unable to save your details. Please try again.'));
    }
  };

  const handleContactNext = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const identifier = email.trim();
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (!identifier) {
      setError('Enter your email address.');
      return;
    }
    if (!looksLikeEmail(identifier) && !identifier.endsWith('@trial') && !identifier.endsWith('@saasa')) {
      setError('Enter a valid email address.');
      return;
    }
    if (cleanPhone.length < 6) {
      setError('Enter a valid mobile number.');
      return;
    }
    if (!dialCode) {
      setError('Select your phone country code.');
      return;
    }

    setLoading(true);
    try {
      await captureInterest();
      setView('password');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save your details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const identifier = email.trim();
    if (!identifier || !password) {
      setError('Enter your password to continue.');
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
        if (kind === 'invalid') {
          setShowDemoModal(true);
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

  const openDemoForm = () => {
    setShowDemoModal(false);
    setShowExpiredModal(false);
    setError('');
    setView('demo');
  };

  const handleDemoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!organizationType) {
      setError('Please choose Agency or Standalone workspace type.');
      return;
    }
    if (!fullName.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!looksLikeEmail(email.trim())) {
      setError('Please enter a valid work email so HQ can follow up.');
      return;
    }
    if (!organizationName.trim()) {
      setError('Organization name is required.');
      return;
    }
    if (!companySize) {
      setError('Company size is required.');
      return;
    }
    if (!countryCode) {
      setError('Country is required.');
      return;
    }

    setLoading(true);
    try {
      const result = await sendEmployerDemoOtp({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        countryCode,
        dialCode,
        phoneNumber: phoneNumber.replace(/\D/g, ''),
        companySize,
        organizationName: organizationName.trim(),
        organizationType: organizationType as OrganizationType,
        requestKind: 'demo',
        outcome: 'Requested a demo from Try it free',
      });
      setRequestId(result.data?.requestId || '');
      setOtpPreview(result.data?.otp || '');
      setOtp('');
      setOtpError('');
      setResendTimer(30);
      setOtpModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit demo request.');
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
      await verifyEmployerDemoOtp(requestId, email.trim().toLowerCase(), code);
      setOtpModalOpen(false);
      setView('success');
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      verifyInFlight.current = false;
      setIsVerifying(false);
    }
  };

  const cardClass =
    view === 'demo'
      ? 'mx-auto w-full max-w-lg'
      : 'mx-auto w-full max-w-md';

  return (
    <div className={cardClass}>
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)]">
        {view === 'success' ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="h-7 w-7" strokeWidth={2.5} />
            </div>
            <h1 className="text-center text-2xl font-black tracking-tight text-slate-900">
              Demo request submitted
            </h1>
            <p className="mt-3 text-center text-sm leading-relaxed text-slate-500">
              Thanks — HQ has your details and will follow up shortly.
            </p>
            <Button
              type="button"
              onClick={() => {
                setView('contact');
                setPassword('');
                setError('');
              }}
              className="mt-8 h-11 w-full bg-[#28A8DF] text-white hover:bg-[#1f97cb]"
            >
              Back to Try it free
            </Button>
          </>
        ) : null}

        {view === 'contact' ? (
          <>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#28A8DF]">
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Try it free</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Enter your email and mobile number to continue. If you already have HQ-granted access, you
              can sign in on the next screen.
            </p>
            <form onSubmit={handleContactNext} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="try-free-email">Email</Label>
                <Input
                  id="try-free-email"
                  type="text"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="try-free-phone">Mobile number</Label>
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
                    className="h-11 rounded-md border border-input bg-transparent px-2 text-sm"
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
                    placeholder="Mobile number"
                    className="h-11"
                  />
                </div>
              </div>

              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-[#28A8DF] text-white hover:bg-[#1f97cb]"
              >
                {loading ? 'Saving…' : 'Next'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </>
        ) : null}

        {view === 'password' ? (
          <>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#28A8DF]">
              <Lock className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Enter your password</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Use the password HQ emailed after your demo was approved.
            </p>
            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="try-free-password">Password</Label>
                <div className="relative">
                  <Input
                    id="try-free-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password from email"
                    className="h-11 pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => v !== true)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-[#28A8DF] text-white hover:bg-[#1f97cb]"
              >
                {loading ? 'Signing in…' : 'Sign in to try free'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('contact');
                }}
                className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </form>
          </>
        ) : null}

        {view === 'demo' ? (
          <>
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#28A8DF]">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Request a Demo</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Share a few details and HQ will follow up with you.
            </p>
            <form onSubmit={handleDemoSubmit} className="mt-6 space-y-4">
              <OrganizationTypeField value={organizationType} onChange={setOrganizationType} />
              <div className="space-y-1.5">
                <Label htmlFor="demo-name">Full name</Label>
                <Input
                  id="demo-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-org">Organization name</Label>
                <Input
                  id="demo-org"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Company Inc."
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-size">Company size</Label>
                <select
                  id="demo-size"
                  value={companySize}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
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
                <Label htmlFor="demo-email">Email</Label>
                <Input
                  id="demo-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="demo-phone">Mobile number</Label>
                <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
                  <select
                    value={dialCode}
                    onChange={(e) => setDialCode(e.target.value)}
                    className="h-11 rounded-md border border-input bg-transparent px-2 text-sm"
                  >
                    {dialCodeOptions.map((option) => (
                      <option key={option.dialCode} value={option.dialCode}>
                        {option.dialCode}
                      </option>
                    ))}
                  </select>
                  <Input
                    id="demo-phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full bg-[#28A8DF] text-white hover:bg-[#1f97cb]"
              >
                {loading ? 'Submitting…' : 'Submit request'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setView('password');
                }}
                className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </form>
          </>
        ) : null}

        {view !== 'success' && view !== 'demo' ? (
          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have access yet?{' '}
            <Link href={demoPageHref} className="font-semibold text-[#28A8DF] hover:underline">
              Request a demo
            </Link>
          </p>
        ) : null}
      </div>

      {showDemoModal ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => setShowDemoModal(false)}
        >
          <div
            className="relative w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="try-free-demo-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowDemoModal(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <BookOpen className="h-7 w-7" />
            </div>
            <h2
              id="try-free-demo-title"
              className="mb-3 text-center text-2xl font-bold tracking-tight text-slate-900"
            >
              Invalid details
            </h2>
            <p className="mb-8 text-center text-[15px] font-medium leading-relaxed text-slate-500">
              Invalid details. Would you like to Request a Demo?
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={openDemoForm}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8DF] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1f97cb]"
              >
                Request a Demo
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-[15px] font-semibold text-slate-600 transition-all hover:bg-slate-50"
              >
                No thanks
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
              Your try-free period is over. Request a new demo or contact HQ to continue with a paid
              plan.
            </p>
            <div className="space-y-3">
              <button
                type="button"
                onClick={openDemoForm}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8DF] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1f97cb]"
              >
                Request a Demo
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
              placeholder="000000"
              className="h-12 text-center text-lg tracking-[0.4em]"
            />
            {otpPreview ? (
              <p className="mt-3 text-center text-xs text-slate-400">Dev code: {otpPreview}</p>
            ) : null}
            {otpError ? <p className="mt-3 text-center text-sm font-medium text-rose-600">{otpError}</p> : null}
            <div className="mt-6 space-y-3">
              <Button
                type="button"
                disabled={isVerifying || otp.length !== 6}
                onClick={() => void submitOtpVerification(otp)}
                className="h-11 w-full bg-[#28A8DF] text-white hover:bg-[#1f97cb]"
              >
                {isVerifying ? 'Verifying…' : 'Verify and submit'}
              </Button>
              <button
                type="button"
                disabled={resendTimer > 0 || loading}
                onClick={() => void handleResendOtp()}
                className="w-full text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50"
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
