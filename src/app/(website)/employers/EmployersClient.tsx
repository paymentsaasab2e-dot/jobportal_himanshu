'use client';

import React from 'react';
import { EmployersHeroSection } from './EmployersHeroSection';
import { CinematicBodyPartA } from './sections/cinematic/CinematicBodyA';
import { CinematicBodyPartB } from './sections/cinematic/CinematicBodyB';
import { useLandingMetrics } from './sections/cinematic/useLandingMetrics';

export default function EmployerLandingPage() {
  const { data } = useLandingMetrics();

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] font-sans text-slate-900 antialiased selection:bg-indigo-500/20 selection:text-indigo-900">
      <main>
        {/* Original hero restored — light cinematic body below */}
        <EmployersHeroSection />
        <CinematicBodyPartA data={data} />
        <CinematicBodyPartB data={data} />
      </main>
    </div>
  );
}
