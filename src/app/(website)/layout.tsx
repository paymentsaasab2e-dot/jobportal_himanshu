"use client";

import Navbar from "./_components/Navbar";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import Header from "@/components/common/Header";

export default function WebsiteSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const isExploreJobs = pathname?.includes("/explore-jobs");
  const isServicesPage = pathname === "/services";

  return (
    <div className="flex flex-col min-h-screen selection:bg-[#28A8DF] selection:text-white">
      {isServicesPage && isAuthenticated && user ? (
        <Header />
      ) : (
        !isExploreJobs && <Navbar />
      )}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
