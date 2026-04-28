"use client";



export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#F8FBFD] text-slate-800">
      <section className="mx-auto max-w-[980px] px-6 pb-20 pt-32">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
            Legal
          </p>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Terms of Service
          </h1>
          <p className="mb-8 text-sm font-medium text-slate-500">
            Last updated: April 20, 2026
          </p>

          <div className="space-y-6 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the HRYANTRA B2E platform, you agree to be bound by these 
                Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">2. User Accounts</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials 
                and for all activities that occur under your account. You agree to provide accurate 
                and complete information when creating your profile.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">3. Job Applications</h2>
              <p>
                By applying for jobs through our platform, you consent to sharing your profile 
                information with potential employers. We do not guarantee employment or interview 
                opportunities.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">4. Prohibited Activities</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5">
                <li>Provide false or misleading information</li>
                <li>Harass other users or employers</li>
                <li>Use the platform for illegal purposes</li>
                <li>Attempt to breach security measures</li>
                <li>Scrape or copy data without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">5. Intellectual Property</h2>
              <p>
                All content on the platform, including logos, text, and software, is the property 
                of HRYANTRA B2E and protected by copyright laws. Users retain ownership of their 
                profile data and resumes.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">6. Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms 
                or engage in fraudulent activities.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">7. Contact</h2>
              <p>
                For questions about these Terms of Service, please contact us at legal@hryantra.com.
              </p>
            </section>
          </div>
        </div>
      </section>

    </div>
  );
}
