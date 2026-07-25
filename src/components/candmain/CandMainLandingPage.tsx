'use client';

import { usePathname } from 'next/navigation';
import { useLandingSmoothScroll } from '@/hooks/useLandingSmoothScroll';
import '@/app/candmain/candmain-landing.css';
import WebsiteNavbar from '@/app/(website)/_components/Navbar';
import { PortalSearchHero } from '@/app/(website)/_components/PortalSearchHero';
import Footer from '@candmain/components/shared/Footer';
import { stripLocaleFromPathname } from '@/lib/i18n';
import CommandCenter from '@candmain/components/command-center/CommandCenter';
import ActivityStream from '@candmain/components/activity-stream/ActivityStream';
import HiringHierarchy from '@candmain/components/hiring-hierarchy/HiringHierarchy';
import ExperienceTimeline from '@candmain/components/experience-timeline/ExperienceTimeline';

export function CandMainLandingPage() {
  const pathname = usePathname();
  const normalizedPath = stripLocaleFromPathname(pathname || '/');
  const isHome = normalizedPath === '/';

  useLandingSmoothScroll();

  return (
    <div className="relative min-h-screen bg-[#FCFDFE] text-text-primary antialiased">
      <WebsiteNavbar />
      <PortalSearchHero />
      <div className="candmain-landing relative">
        <main className="relative">
          <CommandCenter />
          <ActivityStream />
          <HiringHierarchy />
          <ExperienceTimeline />
          {!isHome && <Footer />}
        </main>
      </div>
    </div>
  );
}
