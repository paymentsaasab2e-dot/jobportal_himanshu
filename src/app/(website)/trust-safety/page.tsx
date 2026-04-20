"use client";

import Footer from "../_components/Footer";

export default function TrustSafetyPage() {
  return (
    <div className="min-h-screen bg-[#F8FBFD] text-slate-800">
      <section className="mx-auto max-w-[980px] px-6 pb-20 pt-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-sky-600">
            Platform
          </p>
          <h1 className="mb-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            Trust & Safety
          </h1>
          <p className="mb-8 text-sm font-medium text-slate-500">
            Your security is our priority
          </p>

          <div className="space-y-6 text-[15px] leading-7 text-slate-700">
            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">Verified Employers</h2>
              <p>
                All employers on our platform undergo a verification process to ensure they are 
                legitimate businesses. We verify company registration, contact information, 
                and employment history before allowing job postings.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">Profile Protection</h2>
              <p>
                Your personal information is encrypted and stored securely. We never share your 
                contact details with employers without your explicit consent. You control what 
                information is visible on your public profile.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">Fraud Prevention</h2>
              <p>
                We actively monitor job listings for suspicious activity. Our AI systems detect 
                potential scam postings, and our team manually reviews flagged content. 
                Report any suspicious job postings immediately.
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">Data Security</h2>
              <p>
                We implement industry-standard security measures including:
              </p>
              <ul className="list-disc pl-5">
                <li>End-to-end encryption for sensitive data</li>
                <li>Regular security audits and penetration testing</li>
                <li>Secure OAuth authentication</li>
                <li>GDPR and data protection compliance</li>
                <li>Two-factor authentication (2FA) support</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">Reporting Issues</h2>
              <p>
                If you encounter any suspicious activity or have safety concerns, please report 
                them immediately. Our support team is available 24/7 to address your concerns.
              </p>
              <p className="mt-2">
                Contact: <a href="mailto:trust@hryantra.com" className="text-sky-600 hover:underline">trust@hryantra.com</a>
              </p>
            </section>

            <section>
              <h2 className="mb-2 text-xl font-bold text-slate-900">Tips for Candidates</h2>
              <ul className="list-disc pl-5">
                <li>Never share passwords or financial information with employers</li>
                <li>Be cautious of job offers that seem too good to be true</li>
                <li>Research employers before accepting interviews</li>
                <li>Use our platform messaging for initial communications</li>
                <li>Report employers requesting payment or sensitive personal data</li>
              </ul>
            </section>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
