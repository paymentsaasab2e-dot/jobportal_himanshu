'use client';

import { useEffect } from 'react';
import Navbar from '@candmain/components/shared/Navbar';
import Footer from '@candmain/components/shared/Footer';
import HeroSection from '@candmain/components/hero/HeroSection';
import CommandCenter from '@candmain/components/command-center/CommandCenter';
import ActivityStream from '@candmain/components/activity-stream/ActivityStream';
import HiringHierarchy from '@candmain/components/hiring-hierarchy/HiringHierarchy';
import ImpactDashboard from '@candmain/components/impact-dashboard/ImpactDashboard';
import CaseStudies from '@candmain/components/case-studies/CaseStudies';
import SkillsNetwork from '@candmain/components/skills-network/SkillsNetwork';
import ExperienceTimeline from '@candmain/components/experience-timeline/ExperienceTimeline';
import WhyHire from '@candmain/components/why-hire/WhyHire';
import CTASection from '@candmain/components/cta/CTASection';

export function CandMainLandingPage() {
  useEffect(() => {
    let lenis: { raf: (time: number) => void; destroy: () => void } | null = null;
    let animId = 0;

    const init = async () => {
      try {
        const { default: Lenis } = await import('lenis');
        lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        });

        const raf = (time: number) => {
          lenis?.raf(time);
          animId = requestAnimationFrame(raf);
        };
        animId = requestAnimationFrame(raf);
      } catch {
        // Lenis optional — page still works without smooth scroll
      }
    };

    void init();
    return () => {
      if (animId) cancelAnimationFrame(animId);
      lenis?.destroy();
    };
  }, []);

  return (
    <div className="candmain-landing relative min-h-screen bg-bg-base text-text-primary antialiased">
      <main className="relative">
        <Navbar />
        <HeroSection />
        <CommandCenter />
        <ActivityStream />
        <HiringHierarchy />
        <ImpactDashboard />
        <CaseStudies />
        <SkillsNetwork />
        <ExperienceTimeline />
        <WhyHire />
        <CTASection />
        <Footer />
      </main>
    </div>
  );
}
