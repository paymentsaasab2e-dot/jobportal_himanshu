'use client';

import WebsiteNavbar from '@/app/(website)/_components/Navbar';
import Footer from '@/components/common/Footer';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <WebsiteNavbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-10 pt-28 w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Help Center</h1>
        <p className="text-gray-700 mb-6">
          Need assistance? Reach out to support and we will help you with profile setup, job applications,
          and account-related issues.
        </p>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Email:</span> support@hryantra.com
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">Response time:</span> Usually within 24 hours
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}

