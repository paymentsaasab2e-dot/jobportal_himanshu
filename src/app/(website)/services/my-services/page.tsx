'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Inbox, LayoutList } from 'lucide-react';
import { type MyServiceStatus } from '../data/my-services-mock';
import { useServices } from '../context/ServicesContext';
import MyServicesSummaryStats from '../components/MyServicesSummaryStats';
import MyServiceCard from '../components/MyServiceCard';
import MyServiceDetailsModal from '../components/MyServiceDetailsModal';
import { type MyServiceItem } from '../data/my-services-mock';
import { SVC_PRIMARY_BTN } from '../constants';

type TabKey = 'All' | 'Ongoing' | 'Scheduled' | 'Completed' | 'Drafts';

const TABS: { key: TabKey, label: string }[] = [
  { key: 'All', label: 'All Requests' },
  { key: 'Ongoing', label: 'Ongoing' },
  { key: 'Scheduled', label: 'Scheduled' },
  { key: 'Completed', label: 'Completed' },
  { key: 'Drafts', label: 'Drafts' },
];

export default function MyServicesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('All');
  const { requests } = useServices();
  const [selectedItem, setSelectedItem] = useState<MyServiceItem | null>(null);
  
  const filteredItems = useMemo(() => {
    switch (activeTab) {
      case 'Ongoing':
        return requests.filter(i => ['Requested', 'In Review', 'In Progress'].includes(i.status));
      case 'Scheduled':
        return requests.filter(i => i.status === 'Scheduled');
      case 'Completed':
        return requests.filter(i => i.status === 'Completed');
      case 'Drafts':
        return requests.filter(i => i.status === 'Not Started');
      default:
        return requests;
    }
  }, [activeTab, requests]);

  return (
    <div className="space-y-8 pb-32">
      {/* 1. Header & Navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav aria-label="Breadcrumb" className="mb-2">
            <Link 
              href="/services" 
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all services
            </Link>
          </nav>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            My Services
          </h1>
          <p className="text-base text-gray-500 font-normal mt-1">
            Track and manage your requested career services.
          </p>
        </div>
        <Link href="/services" className={SVC_PRIMARY_BTN}>
          Explore new services
        </Link>
      </div>

      {/* 2. Summary Stats */}
      <MyServicesSummaryStats services={requests} />

      {/* 3. Main Content Area */}
      <div className="space-y-6">
        
        {/* Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] border-b border-gray-200">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-semibold transition-all duration-200 border-b-2 -mb-[1px] ${
                  isActive
                    ? 'border-[#28A8E1] text-[#28A8E1]'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* List or Empty State */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl border border-dashed border-gray-300 bg-white shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-50 mb-4 border border-gray-100">
              <Inbox className="h-7 w-7 text-gray-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No services found</h3>
            <p className="text-sm text-gray-500 font-normal max-w-sm mb-6">
              You don't have any services matching the "{activeTab}" status.
            </p>
            {activeTab !== 'All' && (
              <button 
                onClick={() => setActiveTab('All')}
                className="text-[#28A8E1] text-sm font-semibold hover:underline"
              >
                View all items
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map(item => (
              <MyServiceCard 
                key={item.id} 
                item={item} 
                onClickAction={() => setSelectedItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 4. Upcoming Actions / Info Sidebar equivalent */}
      <section className="rounded-2xl bg-slate-800 text-white p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/10 border border-white/20">
          <LayoutList className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold mb-1">Keep your profile updated</h3>
          <p className="text-slate-300 text-sm font-normal">
            Services are most effective when your core profile is complete. Make sure your education, 
            experience, and skills are up to date before requesting advanced services.
          </p>
        </div>
        <div className="shrink-0">
          <Link href="/profile" className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors border border-white/10">
            Update Profile
          </Link>
        </div>
      </section>

      <MyServiceDetailsModal 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
        item={selectedItem} 
      />

    </div>
  );
}
