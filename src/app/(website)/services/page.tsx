'use client';

import { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import ServicesHero from './components/ServicesHero';
import ServicesStatsStrip from './components/ServicesStatsStrip';
import RecommendedServicesSection from './components/RecommendedServicesSection';
import ServicesFilterBar from './components/ServicesFilterBar';
import ServicesGrid from './components/ServicesGrid';
import FeaturedServicesBanner from './components/FeaturedServicesBanner';
import ServicesHowItWorks from './components/ServicesHowItWorks';
import ServicesFaqPreview from './components/ServicesFaqPreview';
import ServicesBottomCta from './components/ServicesBottomCta';
import ServiceRequestModal from './components/ServiceRequestModal';
import { SERVICES, type ServiceCategory, type ServiceDefinition } from './data/services';

export default function ServicesLandingPage() {
  const [activeTab, setActiveTab] = useState<ServiceCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevant');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceDefinition | null>(null);

  // Filter & Sort Logic
  const filteredServices = useMemo(() => {
    let result = SERVICES;

    // Filter by Category
    if (activeTab !== 'all') {
      result = result.filter(s => s.category === activeTab);
    }

    // Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) || 
        s.shortDescription.toLowerCase().includes(q) ||
        s.previewDeliverables.some(d => d.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (sortBy === 'az') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'popular') {
      const popularIds = ['svc-1', 'svc-6'];
      result = [...result].sort((a, b) => {
        const aPop = popularIds.includes(a.id) ? 1 : 0;
        const bPop = popularIds.includes(b.id) ? 1 : 0;
        return bPop - aPop;
      });
    }

    return result;
  }, [activeTab, searchQuery, sortBy]);

  const handleRequestService = (service: ServiceDefinition) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setActiveTab('all');
    setSearchQuery('');
    setSortBy('relevant');
  };

  return (
    <div className="min-h-screen font-sans bg-white flex flex-col selection:bg-sky-100 selection:text-sky-900 overflow-hidden">
      <main className="flex-1">
        {/* 1. Cinematic Multi-Layer Hero */}
        <div className="relative pt-44 pb-20">
          {/* Background decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-sky-50 to-transparent rounded-full blur-[120px] opacity-40 pointer-events-none" />
          <ServicesHero />
        </div>

        {/* 2. Professional Stats Strip */}
        <div className="border-y border-slate-100 bg-slate-50/30">
          <ServicesStatsStrip />
        </div>

        {/* 3. Personalized Intelligence Section */}
        <section className="py-24 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-100/20 rounded-full blur-[100px] -mr-40 pointer-events-none" />
           <div className="mx-auto max-w-[1240px] px-6">
              <RecommendedServicesSection />
           </div>
        </section>

        {/* 4. Interactive Services Control Center (Filters + Grid) */}
        <section id="services-grid" className="py-24 bg-[#FCFDFE]">
          <div className="mx-auto max-w-[1240px] px-6">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-full px-5 py-2 mb-6">
                  <Sparkles className="w-4 h-4 text-[#28A8DF]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#28A8DF]">Global Service Catalog</span>
                </div>
                <h2 className="text-4xl lg:text-5xl font-black text-slate-950 tracking-tight leading-tight">
                  Choose your next <br/>
                  <span className="text-[#28A8DF]">career milestone.</span>
                </h2>
                <p className="text-slate-500 font-medium mt-6 text-lg">
                  Access specialized AI intelligence and human expertise to unlock your professional potential.
                </p>
              </div>

              <div className="shrink-0">
                <ServicesFilterBar 
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                />
              </div>
            </div>
            
            <div className="relative animate-in fade-in slide-in-from-bottom-8 duration-700">
              <ServicesGrid 
                services={filteredServices} 
                onRequestService={handleRequestService} 
                onResetFilters={handleResetFilters}
              />
            </div>
          </div>
        </section>

        {/* 5. Social Proof / Featured Banner */}
        <div className="py-12">
          <FeaturedServicesBanner />
        </div>

        {/* 6. Learning Continuity / How It Works */}
        <section className="py-24 bg-slate-950 text-white rounded-[60px] mx-4 sm:mx-6 my-24 overflow-hidden relative shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(40,168,223,0.1),transparent_50%)]" />
          <ServicesHowItWorks />
        </section>

        {/* 7. Knowledge Access (FAQ) */}
        <section className="py-32">
          <ServicesFaqPreview />
        </section>

        {/* 8. High-Conversion Final CTA */}
        <section className="py-32 bg-slate-50 rounded-t-[60px] border-t border-slate-100">
          <div className="mx-auto max-w-[1240px] px-6">
            <ServicesBottomCta />
          </div>
        </section>
      </main>

      {/* Unified Access Gateway */}
      <ServiceRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        service={selectedService} 
      />
    </div>
  );
}
