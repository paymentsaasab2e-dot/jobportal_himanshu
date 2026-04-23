'use client';

import { useState } from 'react';
import ProfileDrawer from '../ui/ProfileDrawer';

interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryText: string;
  onSummaryChange: (text: string) => void;
  onSave: () => void;
}

import { API_BASE_URL } from '@/lib/api-base';

export default function SummaryModal({
  isOpen,
  onClose,
  summaryText,
  onSummaryChange,
  onSave,
}: SummaryModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateWithAI = async () => {
    const candidateId = sessionStorage.getItem('candidateId');
    if (!candidateId) {
      alert('Candidate ID not found. Please refresh the page.');
      return;
    }

    try {
      setIsGenerating(true);
      console.log('🚀 Calling API:', `${API_BASE_URL}/profile/generate-summary/${candidateId}`);
      
      const response = await fetch(`${API_BASE_URL}/profile/generate-summary/${candidateId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.data?.summary) {
        // Update the summary text with AI-generated content
        onSummaryChange(result.data.summary);
      } else {
        alert(result.message || 'Failed to generate summary. Please try again.');
      }
    } catch (error) {
      console.error('Error generating summary with AI:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error generating summary: ${errorMessage}. Please try again.`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ProfileDrawer
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Professional Summary"
      subtitle="Write a strong summary to improve recruiter visibility"
      widthClassName="w-full md:w-[50vw] md:max-w-[50vw]"
      footer={(
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={!summaryText.trim()}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Summary
          </button>
        </div>
      )}
    >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left */}
              <div className="space-y-6 lg:col-span-8">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Professional Summary <span className="text-amber-600">*</span>
                  </label>
                  <textarea
                    value={summaryText}
                    onChange={(e) => onSummaryChange(e.target.value)}
                    rows={8}
                    className={`min-h-[180px] w-full resize-none rounded-xl border px-4 py-3 text-sm text-gray-900 transition-all duration-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${!summaryText.trim() ? 'border-amber-200 bg-amber-50/50 focus:border-amber-500 focus:ring-amber-500' : 'border-gray-200'}`}
                    placeholder="Briefly describe your experience, key skills, and achievements..."
                    style={{
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  {!summaryText.trim() && (
                    <p className="mt-1 text-xs text-amber-600">Summary text is required</p>
                  )}
                  <p className="text-right text-xs text-gray-400">
                    {summaryText.length} / 500 characters
                  </p>
                  <p className="text-xs text-gray-500">
                    Tip: Keep it concise and impact-driven (3–5 lines)
                  </p>
                  {!summaryText.trim() && (
                    <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                      Start writing your professional summary or use AI
                    </p>
                  )}
                </div>

                <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-800">✨ Enhance with AI</p>
                  <p className="text-sm text-blue-700">
                    Generate a professional summary based on your profile
                  </p>
                  <button
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      'Generate with AI'
                    )}
                  </button>
                </div>
              </div>

              {/* Right */}
              <div className="space-y-6 lg:col-span-4">
                <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900">Writing Guide</h3>
                  <div className="space-y-2">
                    {[
                      'Role / expertise',
                      'Years of experience',
                      'Core skills',
                      'Industry focus',
                      'Achievements',
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                      >
                        <span className="mt-0.5 text-blue-600">✔</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
                  <h4 className="text-sm font-semibold text-gray-900">Example</h4>
                  <p className="text-xs italic text-gray-500">
                    Frontend Developer with 2+ years experience in React, TypeScript, and modern UI systems, delivering performant web apps and improving user engagement through accessible, responsive design.
                  </p>
                </div>
              </div>
            </div>
    </ProfileDrawer>
  );
}
