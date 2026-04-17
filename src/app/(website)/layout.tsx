"use client";

import Navbar from "./_components/Navbar";
import { usePathname } from "next/navigation";

export default function WebsiteSiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isExploreJobs = pathname?.includes("/explore-jobs");

  return (
    <div className="flex flex-col min-h-screen selection:bg-[#28A8DF] selection:text-white">
      {!isExploreJobs && <Navbar />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
