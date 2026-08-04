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

  const isCandMainHome = normalizedPath === "/";

  // Always marketing chrome (even when signed in)
  const alwaysMarketingNavbarPaths = new Set<string>([
    "/employers",
    "/events",
    "/services",
    "/ats-check",
    "/courses",
  ]);

  // Guest marketing chrome — signed-in users get the app Header instead
  const guestMarketingNavbarPaths = new Set<string>([
    "/aboutus",
    "/contact",
    "/privacypolicy",
    "/terms",
    "/trust-safety",
    "/help",
    "/faq",
  ]);

  const usesMarketingNavbar =
    alwaysMarketingNavbarPaths.has(normalizedPath) ||
    normalizedPath.startsWith("/employers/") ||
    normalizedPath.startsWith("/events/") ||
    normalizedPath.startsWith("/services/") ||
    (!isAuthenticated && guestMarketingNavbarPaths.has(normalizedPath));

  if (isCandMainHome) {
    return <>{children}</>;
  }

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
