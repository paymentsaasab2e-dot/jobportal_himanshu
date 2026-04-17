'use client';

import { X, Calendar, CheckCircle2, Circle, Clock, Download, ExternalLink, CalendarDays } from 'lucide-react';
import type { MyServiceItem } from '../data/my-services-mock';
import { SVC_PRIMARY_BTN, SVC_SECONDARY_BTN } from '../constants';
import { useServices } from '../context/ServicesContext';
import { showSuccessToast } from '@/components/common/toast/toast';

interface MyServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MyServiceItem | null;
}

const TIMELINE_STAGES = [
  'Requested',
  'In Review',
  'Scheduled',
  'In Progress',
  'Completed',
];

export default function MyServiceDetailsModal({ isOpen, onClose, item }: MyServiceDetailsModalProps) {
  const { updateServiceStatus } = useServices();

  if (!isOpen || !item) return null;

  const currentIndex = TIMELINE_STAGES.indexOf(item.status);
  
  // Custom logic for canceled items
  const isCanceled = item.status === 'Cancelled';
  const isNotStarted = item.status === 'Not Started';

  const handleSimulateProgress = () => {
    if (currentIndex >= 0 && currentIndex < TIMELINE_STAGES.length - 1) {
      const nextStatus = TIMELINE_STAGES[currentIndex + 1];
      updateServiceStatus(item.id, nextStatus as any);
      showSuccessToast('Service status updated', nextStatus);
    } else if (isNotStarted) {
      updateServiceStatus(item.id, 'Requested');
      showSuccessToast('Service request started');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-[600px] rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Service Details</h2>
            <p className="text-xs text-gray-500 font-medium">Request ID: {item.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="px-6 py-6 overflow-y-auto space-y-8">
          
          {/* Top Info */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{item.serviceName}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                Requested: {new Date(item.requestDate).toLocaleDateString()}
              </span>
              <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                Status: {item.status}
              </span>
            </div>
          </div>

          {/* Timeline Progress */}
          {!isCanceled && !isNotStarted && (
            <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-bold text-gray-900 mb-4">Progress</h4>
              <div className="relative">
                {/* Connecting line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-100" />
                
                <div className="space-y-6">
                  {TIMELINE_STAGES.map((stage, idx) => {
                    const isCompleted = idx < currentIndex || item.status === 'Completed';
                    const isCurrent = idx === currentIndex;
                    const isUpcoming = idx > currentIndex;

                    let icon = <Circle className="h-4 w-4 text-gray-300 fill-white relative z-10" />;
                    let textColor = 'text-gray-400';

                    if (isCompleted) {
                      icon = <CheckCircle2 className="h-8 w-8 text-emerald-500 -ml-2 bg-white relative z-10" />;
                      textColor = 'text-gray-700 font-medium';
                    } else if (isCurrent) {
                      icon = <Clock className="h-6 w-6 text-blue-500 -ml-1 bg-white relative z-10 animate-pulse" />;
                      textColor = 'text-blue-700 font-bold';
                    }

                    return (
                      <div key={stage} className="flex items-start gap-4">
                        <div className="w-8 flex justify-center shrink-0 items-center h-5">
                          {icon}
                        </div>
                        <div className="min-w-0 pt-0.5">
                          <p className={`text-sm ${textColor}`}>{stage}</p>
                          {isCurrent && (
                            <p className="text-xs text-blue-600/80 mt-1 mb-2">
                              {item.nextStep}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {isCanceled && (
            <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
              <p className="text-sm text-rose-800 font-medium">This request was canceled.</p>
              <p className="text-xs text-rose-600 mt-1">You can submit a new request anytime from the corresponding service page.</p>
            </div>
          )}

          {isNotStarted && (
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
              <p className="text-sm text-amber-800 font-medium">Please finish submitting your details.</p>
              <p className="text-xs text-amber-600 mt-1">{item.nextStep}</p>
            </div>
          )}

          {/* Action Context Box */}
          <div className="rounded-xl border border-gray-200 bg-slate-50 p-5">
            <h4 className="text-sm font-bold text-gray-900 mb-3">Available Actions</h4>
            
            <div className="flex flex-col gap-3">
              {item.status === 'Completed' && (
                <button className="flex items-center justify-between w-full p-3 rounded-lg bg-white border border-gray-200 hover:border-[#28A8E1] hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 rounded-md text-emerald-600">
                      <Download className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">Download Report</p>
                      <p className="text-xs text-gray-500">Get your detailed analysis in PDF format</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-[#28A8E1]" />
                </button>
              )}

              {item.status === 'Scheduled' && (
                <button className="flex items-center justify-between w-full p-3 rounded-lg bg-white border border-gray-200 hover:border-[#28A8E1] hover:shadow-sm transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-50 rounded-md text-violet-600">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-gray-900">Join Session / Reschedule</p>
                      <p className="text-xs text-gray-500">Manage your upcoming appointment</p>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-300 group-hover:text-[#28A8E1]" />
                </button>
              )}

              <button 
                onClick={handleSimulateProgress}
                className={SVC_SECONDARY_BTN + " w-full bg-white"}
              >
                {item.status === 'Completed' ? 'Provide Feedback' : 'Simulate Progress (Demo)'}
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-white px-6 py-4 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={SVC_PRIMARY_BTN}
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
