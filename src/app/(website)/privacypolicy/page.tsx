"use client";

import Footer from "../_components/Footer";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8FBFD] text-slate-800">
      <section className="mx-auto max-w-[980px] px-6 pb-20 pt-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
            Legal
          </p>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="mb-8 text-sm font-medium text-slate-500">
            Last updated: April 9, 2026
          </p>

          <div className="space-y-6 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">1. What We Collect</h2>
              <p>
                We collect account data (name, email, phone), profile and resume details,
                job preferences, application activity, and communication settings required
                to deliver job matching and recruitment services.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">2. Google OAuth Data</h2>
              <p>
                When you connect Google, we request OAuth authorization to enable Gmail
                and Calendar features. Depending on your selection, we may access:
              </p>
              <ul className="list-disc pl-5">
                <li>Basic profile and email identity</li>
                <li>Gmail send/read access for communication workflows</li>
                <li>Google Calendar event access for interview scheduling</li>
              </ul>
              <p className="mt-2">
                We store OAuth tokens securely and use them only to perform features you
                explicitly enable inside the platform.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">3. Other OAuth Providers</h2>
              <p>
                If you connect LinkedIn, Zoom, Twitter/X, Facebook, Microsoft, or other
                providers, we store the minimum required tokens and account metadata to
                support integration status, publishing, messaging, or meeting workflows.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">4. How We Use Data</h2>
              <p>
                We use your data to provide candidate onboarding, job recommendations,
                communication tools, application tracking, and account security.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">5. Data Security</h2>
              <p>
                We apply access controls, encrypted credentials/tokens, and role-based
                authorization to protect personal and integration data.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">6. Your Controls</h2>
              <p>
                You can disconnect OAuth providers, update profile information, and request
                account-related privacy actions by contacting support.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">7. Contact</h2>
              <p>
                For privacy requests, email:{" "}
                <a
                  href="mailto:privacy@hryantra.com"
                  className="font-semibold text-sky-600 hover:underline"
                >
                  privacy@hryantra.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

