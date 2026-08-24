'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useLocale } from 'next-intl';
import { ArrowRight, BookOpen, Eye, EyeOff, Lock, LogIn, X } from 'lucide-react';
import { AppLocale, localizePath } from '@/lib/i18n';
import {
  EMPLOYERS_DEMO_PATH,
  getEmployerPortalLoginUrl,
  getEmployerPortalOrigin,
  getTryFreeLoginApiUrl,
} from '@/lib/employers/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type LoginErrorKind = 'invalid' | 'trial_expired' | 'other';

function classifyLoginError(
  status: number,
  message: string,
  code?: string
): LoginErrorKind {
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

export function TryFreeLoginClient() {
  const locale = useLocale() as AppLocale;
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);

  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const identifier = loginId.trim();
    const pass = password;
    if (!identifier || !pass) {
      setError('Enter your login ID (or email) and password.');
      return;
    }

    setLoading(true);
    try {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      const res = await fetch(getTryFreeLoginApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: isEmail ? identifier.toLowerCase() : undefined,
          loginId: isEmail ? undefined : identifier,
          password: pass,
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
        // Send them to Phase 2 login to complete session takeover UX
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

      // Always hand off to absolute /login (never append onto ?redirect=…/leads).
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

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)]">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#28A8DF]">
          <LogIn className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900">Try it free</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Sign in with the credentials HQ emailed after your demo was approved. Access lasts for the
          trial days set by HQ.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="try-free-login">Login ID or email</Label>
            <Input
              id="try-free-login"
              autoComplete="username"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. you_abc@trial or work email from HQ"
              className="h-11"
            />
          </div>
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
                onClick={() => setShowPassword((v) => !v)}
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
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don&apos;t have access yet?{' '}
          <Link href={demoHref} className="font-semibold text-[#28A8DF] hover:underline">
            Request a demo
          </Link>
        </p>
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
              Request a demo first
            </h2>
            <p className="mb-8 text-center text-[15px] font-medium leading-relaxed text-slate-500">
              These credentials are not valid for try-free access. Request a demo and HQ will email
              you login details when access is granted.
            </p>
            <div className="space-y-3">
              <Link
                href={demoHref}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8DF] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1f97cb]"
              >
                Go to Request Demo
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-[15px] font-semibold text-slate-600 transition-all hover:bg-slate-50"
              >
                Try again
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
              <Link
                href={demoHref}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8DF] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1f97cb]"
              >
                Request a demo
                <ArrowRight className="h-5 w-5" />
              </Link>
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
    </div>
  );
}
