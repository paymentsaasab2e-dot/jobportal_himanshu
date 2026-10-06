"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function WhatsAppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("WhatsApp auth route error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-xl font-black text-slate-900 tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm font-medium text-slate-500 leading-relaxed">
        The sign-in page hit an unexpected error. You can try again or return to
        the login screen.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="h-11 rounded-full bg-[#08428c] px-5 text-sm font-bold text-white shadow-sm hover:bg-[#0a4fa8] transition-colors"
        >
          Try again
        </button>
        <Link
          href="/whatsapp"
          className="h-11 inline-flex items-center rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 hover:border-[#08428c]/30 hover:text-[#08428c] transition-colors"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}
