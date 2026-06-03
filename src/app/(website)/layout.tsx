"use client";

import Navbar from "./_components/Navbar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import Header from "@/components/common/Header";
import { stripLocaleFromPathname } from "@/lib/i18n";

export default function WebsiteSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const normalizedPath = stripLocaleFromPathname(pathname || "/");
  const { isAuthenticated, user } = useAuth();

  // Pages under (website) that must always show the marketing Navbar
  // (the same one used on /employers) — regardless of auth state. Without
  // this, an authenticated user landing on `/` would get the old Header
  // ("Jobseeker / Courses / Services / For Employers / Log In / Sign Up")
  // overlapping the marketing nav.
  const marketingNavbarPaths = new Set<string>([
    "/",
    "/employers",
    "/services",
    "/aboutus",
    "/contact",
    "/privacypolicy",
    "/terms",
    "/trust-safety",
    "/help",
    "/ats-check",
  ]);

  const usesMarketingNavbar =
    marketingNavbarPaths.has(normalizedPath) ||
    normalizedPath.startsWith("/employers/") ||
    normalizedPath.startsWith("/services/");

  return (
    <div className="flex flex-col min-h-screen selection:bg-[#28A8DF] selection:text-white">
      {isAuthenticated && user && !usesMarketingNavbar ? (
        <Header />
      ) : (
        <Navbar />
      )}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
