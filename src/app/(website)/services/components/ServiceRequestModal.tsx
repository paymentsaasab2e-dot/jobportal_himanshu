'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronRight, ChevronLeft, Upload, FileText, CheckCircle2 } from 'lucide-react';
import type { ServiceDefinition } from '../data/services';
import { SVC_PRIMARY_BTN } from '../constants';
import ServiceRequestSuccess from './ServiceRequestSuccess';
import { showSuccessToast } from '@/components/common/toast/toast';

import { useServices } from '../context/ServicesContext';
import { type MyServiceStatus } from '../data/my-services-mock';

interface ServiceRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ServiceDefinition | null;
}

export default function ServiceRequestModal({ isOpen, onClose, service }: ServiceRequestModalProps) {
  const router = useRouter();
  const { addServiceRequest } = useServices();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Generic form state for dynamic inputs
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({});
      setNotes('');
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen, service]);

  if (!isOpen || !service) return null;

  const totalSteps = 4; // 1: Confirm, 2: Inputs, 3: Notes, 4: Review

  const handleNext = () => setStep((s) => Math.min(s + 1, totalSteps));
  const handleBack = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      let status: MyServiceStatus = 'Requested';
      let nextStep = 'Your request is being processed';
      let action = 'View Request';

      if (service.slug === 'ai-resume-review') {
        status = 'In Review';
        nextStep = 'Analysis in progress';
      } else if (service.slug === 'resume-writing-upgrade') {
        status = 'Requested';
        nextStep = 'Waiting for resume review';
      } else if (service.slug === 'job-specific-cv-optimization') {
        status = 'Requested';
        nextStep = 'JD matching in progress';
      } else if (service.slug === 'linkedin-profile-optimization') {
        status = 'Requested';
        nextStep = 'Profile review pending';
      } else if (service.slug === 'skill-assessment') {
        status = 'Not Started';
        nextStep = 'Begin your assessment';
        action = 'Start Assessment';
      } else if (service.slug === 'mock-interview') {
        status = 'Scheduled';
        nextStep = 'Awaiting session confirmation';
        action = 'View Schedule';
      } else if (service.slug === 'upskilling-certification') {
        status = 'In Progress';
        nextStep = 'Learning path being prepared';
        action = 'View Plan';
      }

      addServiceRequest({
        id: `ms-new-${Date.now()}`,
        serviceSlug: service.slug,
        serviceName: service.title,
        requestDate: new Date().toISOString().split('T')[0],
        status,
        nextStep,
        action,
      });

      setIsSubmitting(false);
      setIsSuccess(true);
      showSuccessToast('Service request submitted', service.title);
    }, 1500);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 relative">
            <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">Confirm Service</h3>
            <div className={`rounded-xl border border-${service.badgeColor}-100 bg-${service.badgeColor}-50/50 p-5`}>
              <h4 className="font-bold text-gray-900 mb-1">{service.title}</h4>
              <p className="text-sm text-gray-600 mb-4">{service.subtitle}</p>
              
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">What you'll get:</p>
                <ul className="space-y-1.5 list-disc list-inside text-sm text-gray-700">
                  {service.previewDeliverables.map(d => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">Required Details</h3>
            <div className="space-y-4">
              {service.requiredInputs.map((inputLabel, i) => {
                const isUpload = inputLabel.toLowerCase().includes('upload');
                const isLongText = inputLabel.toLowerCase().includes('description') || inputLabel.toLowerCase().includes('summary');
                
                if (isUpload) {
                  return (
                    <div key={i} className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 block">{inputLabel}</label>
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                          <div className="flex flex-col items-center justify-center py-5">
                            <Upload className="w-6 h-6 mb-2 text-slate-500" />
                            <p className="text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                            <p className="text-xs text-slate-400 mt-1">PDF, DOCX (Max 5MB)</p>
                          </div>
                          <input type="file" className="hidden" />
                        </label>
                      </div>
                    </div>
                  );
                }

                if (isLongText) {
                  return (
                    <div key={i} className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 block">{inputLabel}</label>
                      <textarea
                        value={formData[inputLabel] || ''}
                        onChange={(e) => handleInputChange(inputLabel, e.target.value)}
                        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#28A8E1] focus:ring-1 focus:ring-[#28A8E1] outline-none transition-all min-h-[100px]"
                        placeholder={`Enter ${inputLabel.toLowerCase()}...`}
                      />
                    </div>
                  );
                }

                return (
                  <div key={i} className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 block">{inputLabel}</label>
                    <input
                      type="text"
                      value={formData[inputLabel] || ''}
                      onChange={(e) => handleInputChange(inputLabel, e.target.value)}
                      className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-[#28A8E1] focus:ring-1 focus:ring-[#28A8E1] outline-none transition-all"
                      placeholder={`Enter ${inputLabel.toLowerCase()}...`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">Preferences & Notes</h3>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 block">
                Additional Notes (Optional)
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Any specific areas you want us to focus on? Give us context to help you better.
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#28A8E1] focus:ring-1 focus:ring-[#28A8E1] outline-none transition-all min-h-[140px]"
                placeholder="E.g., I'm transitioning from marketing to product management..."
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">Review Request</h3>
            
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Service</p>
                <p className="text-sm font-semibold text-gray-900">{service.title}</p>
              </div>
              
              {Object.entries(formData).length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Provided Info</p>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    {Object.entries(formData).map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-xs text-gray-500 truncate">{k}</dt>
                        <dd className="text-sm font-medium text-gray-900 truncate">
                          {v || <span className="text-gray-400 italic">Not provided</span>}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              {notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-gray-700 italic line-clamp-3">"{notes}"</p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 flex gap-3 items-start">
              <FileText className="h-5 w-5 text-blue-600 shrink-0" />
              <p className="text-xs text-blue-800 leading-relaxed">
                By submitting this request, you agree that we will use the provided information 
                to generate insights and recommendations. Your data is kept secure.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={isSuccess || isSubmitting ? undefined : onClose}
      />
      
      {/* Modal panel */}
      <div className="relative z-10 w-full max-w-[520px] rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {isSuccess ? (
          <ServiceRequestSuccess 
            service={service}
            onClose={onClose}
            onGoToMyServices={() => {
              onClose();
              router.push('/services/my-services');
            }}
          />
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Request Service</h2>
                <div className="flex items-center gap-1 mt-1">
                  {[...Array(totalSteps)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i + 1 === step ? 'w-6 bg-[#28A8E1]' : i + 1 < step ? 'w-2 bg-[#28A8E1]/40' : 'w-2 bg-gray-200'
                      }`} 
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="px-6 py-6 overflow-y-auto">
              {renderStepContent()}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4 flex items-center justify-between shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-xl bg-white border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Back
                </button>
              ) : (
                <div /> // Placeholder to keep Next button on the right
              )}

              {step < totalSteps ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className={SVC_PRIMARY_BTN}
                >
                  Continue
                  <ChevronRight className="ml-1 h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={SVC_PRIMARY_BTN + " min-w-[120px]"}
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Submit Request
                      <CheckCircle2 className="ml-1.5 h-4 w-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
