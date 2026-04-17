'use client';

import { use, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2, 
  Users, 
  FileInput, 
  Target, 
  Lightbulb,
  Sparkles,
  Zap
} from 'lucide-react';
import { getServiceBySlug, getRelatedServices, type ServiceDefinition } from '../data/services';
import { SVC_PRIMARY_BTN, SVC_SECONDARY_BTN, SVC_CARD_CLASS } from '../constants';
import ServiceIcon from '../components/ServiceIcon';
import ServiceCard from '../components/ServiceCard';
import ServiceRequestModal from '../components/ServiceRequestModal';

const BADGE_STYLES: Record<string, string> = {
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
  sky: 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const service = getServiceBySlug(resolvedParams.slug);

  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!service) {
    notFound();
  }

  const related = getRelatedServices(service.slug);
  const badgeStyle = BADGE_STYLES[service.badgeColor] || BADGE_STYLES.blue;

  return (
    <>
    <div className="min-h-screen font-sans bg-white flex flex-col selection:bg-sky-100 selection:text-sky-900 pb-24">
      <main className="flex-1">
        {/* 1. Cinematic Breadcrumb Back Nav */}
        <div className="mx-auto max-w-[1240px] px-6 pt-36">
          <Link 
            href="/services" 
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-[#28A8DF] transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Catalog
          </Link>
        </div>

        {/* 2. High-Fidelity Hero Section */}
        <section className="relative pt-20 pb-24 overflow-hidden">
          <div className={`absolute top-0 right-0 w-[600px] h-[600px] bg-${service.badgeColor}-400/5 blur-[120px] rounded-full pointer-events-none translate-x-1/2 -translate-y-1/2`} />
          
          <div className="mx-auto max-w-[1240px] px-6 relative z-10">
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-16 items-center">
              <div>
                <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-8 ${badgeStyle}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-widest">{service.badge}</span>
                </div>
                
                <h1 className="text-5xl lg:text-[68px] font-black text-slate-950 mb-8 tracking-tight leading-[1.05]">
                  {service.title.split(' ').map((word, i) => (
                    <span key={i} className={i === service.title.split(' ').length - 1 ? `text-${service.badgeColor}-600` : ''}>
                      {word}{' '}
                    </span>
                  ))}
                </h1>
                
                <p className="text-xl text-slate-500 leading-relaxed font-medium mb-12 max-w-2xl">
                  {service.subtitle}
                </p>

                <div className="flex flex-wrap gap-5">
                  <button 
                    onClick={() => router.push('/whatsapp')}
                    className={`bg-${service.badgeColor}-600 text-white font-black px-12 py-5 rounded-2xl hover:brightness-110 transition-all shadow-2xl shadow-${service.badgeColor}-500/20 active:scale-95 text-[17px] flex items-center gap-3`}
                  >
                    Get Started Now <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="hidden lg:block relative">
                 <div className={`aspect-square rounded-[48px] bg-${service.badgeColor}-50 border border-${service.badgeColor}-100 flex items-center justify-center p-20 relative overflow-hidden group`}>
                    <div className={`absolute inset-0 bg-gradient-to-br from-${service.badgeColor}-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <ServiceIcon iconKey={service.iconKey} className={`h-40 w-40 text-${service.badgeColor}-600 relative z-10 drop-shadow-2xl transition-transform group-hover:scale-110 duration-700`} />
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Deep Dive Layout */}
        <div className="mx-auto max-w-[1240px] px-6">
          <div className="grid lg:grid-cols-[1fr_400px] gap-16">
            
            {/* Main Content Area */}
            <div className="space-y-24">
              {/* Overview Section */}
              <section>
                <div className="flex items-center gap-3 mb-8">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center`}>
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-950 tracking-tight transition-colors">Strategic Overview</h2>
                </div>
                <div className={`p-10 rounded-[40px] bg-white border border-slate-100 shadow-sm relative overflow-hidden group`}>
                   <div className={`absolute top-0 right-0 w-32 h-32 bg-${service.badgeColor}-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150`} />
                   <p className="text-xl text-slate-600 leading-relaxed font-medium relative z-10">
                    {service.shortDescription}
                   </p>
                </div>
              </section>

              {/* Deliverables Grid */}
              <section>
                <div className="flex items-center gap-3 mb-10">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center`}>
                    <Target className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-950 tracking-tight">Ecosystem Deliverables</h2>
                </div>
                <div className="grid sm:grid-cols-2 gap-6">
                  {service.fullDeliverables.map(item => (
                    <div key={item} className="flex items-center gap-4 p-6 rounded-3xl bg-white border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-slate-700 font-bold text-[17px]">{item}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Execution Workflow */}
              <section>
                <div className="flex items-center gap-3 mb-12">
                  <div className={`w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 flex items-center justify-center`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <h2 className="text-2xl font-black text-slate-950 tracking-tight">Execution Workflow</h2>
                </div>
                <div className="space-y-4">
                  {service.howItWorksSteps.map((step, index) => (
                    <div key={step.step} className="group flex gap-8 p-8 rounded-[32px] bg-slate-50 border border-transparent hover:border-slate-200 hover:bg-white transition-all">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-950 font-black text-xl border border-slate-200 shadow-sm group-hover:bg-slate-950 group-hover:text-white transition-all`}>
                        {step.step}
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-950 mb-2">{step.title}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar Column */}
            <aside className="space-y-8 lg:sticky lg:top-24 h-fit">
              {/* Profile Match Section */}
              <div className="p-8 rounded-[40px] bg-slate-950 text-white shadow-2xl relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 bg-${service.badgeColor}-500/20 rounded-full blur-[60px]`} />
                <h3 className="text-lg font-black mb-6 flex items-center gap-2 relative z-10 text-white">
                  <Users className="w-5 h-5 text-sky-400" /> Target Profile
                </h3>
                <ul className="space-y-4 relative z-10">
                  {service.whoItIsFor.map(item => (
                    <li key={item} className="text-slate-300 font-bold flex items-start gap-3 text-sm leading-relaxed">
                      <div className={`h-1.5 w-1.5 rounded-full bg-${service.badgeColor}-400 mt-2 shrink-0`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Requirement Section */}
              <div className="p-8 rounded-[40px] bg-white border border-slate-200 shadow-sm">
                <h3 className="text-lg font-black text-slate-950 mb-6 flex items-center gap-2">
                  <FileInput className="w-5 h-5 text-slate-400" /> Platform Input
                </h3>
                <ul className="space-y-4">
                  {service.requiredInputs.map(item => (
                    <li key={item} className="text-slate-600 font-medium text-sm flex items-start gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Outcomes Section */}
              <div className={`p-8 rounded-[40px] border border-emerald-100 bg-emerald-50/30`}>
                <h3 className="text-lg font-black text-slate-950 mb-6 underline decoration-emerald-400/30 decoration-4">Strategic Outcomes</h3>
                <ul className="space-y-4">
                  {service.expectedOutcomes.map(item => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-bold text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>

        {/* 4. Cross-Sell / Related Services Section */}
        {related.length > 0 && (
          <section className="mt-32 pt-24 border-t border-slate-100">
            <div className="mx-auto max-w-[1240px] px-6">
              <h2 className="text-3xl lg:text-4xl font-black text-slate-950 mb-12 tracking-tight">Complete your journey.</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {related.map(rel => (
                  <ServiceCard 
                    key={rel.id} 
                    service={rel} 
                    onRequestService={() => {
                      router.push(`/services/${rel.slug}`);
                    }}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Dynamic Action Bar (Sticky Bottom) */}
      <div className="fixed bottom-10 left-0 right-0 z-40 px-6 pointer-events-none">
        <div className="mx-auto max-w-[1240px] flex justify-end">
           <button 
             onClick={() => router.push('/whatsapp')}
             className={`pointer-events-auto bg-white border border-slate-200 text-slate-950 font-black px-10 py-5 rounded-2xl hover:bg-slate-950 hover:text-white transition-all shadow-2xl active:scale-95 text-[17px] flex items-center gap-3`}
           >
              Deploy {service.title} <ArrowRight className="w-5 h-5" />
           </button>
        </div>
      </div>
    </div>

    </>
  );
}
