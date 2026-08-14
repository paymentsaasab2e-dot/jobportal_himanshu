'use client';

import React from 'react';
import { EmployersHeroSection } from './EmployersHeroSection';
import { EmployersServicesStyleBody } from './sections/EmployersServicesStyleBody';

export default function EmployerLandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fcfcfd] font-sans text-[#111827] antialiased selection:bg-[#28A8E1]/20 selection:text-[#0F5A7A]">
      <main>
        <EmployersHeroSection />
        <EmployersServicesStyleBody />
      </main>
    </div>
  );
}
