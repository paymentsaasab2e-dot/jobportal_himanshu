"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/components/auth/AuthContext';
import { CheckCircle2, Sparkles, User, Briefcase, GraduationCap } from "lucide-react";

import { API_BASE_URL } from '@/lib/api-base';
import { showSuccessToast } from '@/components/common/toast/toast';
import HryantraLoader from "@/components/loader/CV Parsing Loader Final";

export default function ExtractPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Starting CV analysis...");
  const [isProcessing, setIsProcessing] = useState(true);
  const [minExtractTimerFinished, setMinExtractTimerFinished] = useState(false);
  const completionToastShownRef = useRef(false);
  /** False after unmount — blocks redirects/timeouts that outlive this page */
  const isPageActiveRef = useRef(true);
  const isProcessingRef = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => setMinExtractTimerFinished(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const redirectToDashboard = useCallback(() => {
    if (!isPageActiveRef.current) return;
    // Never redirect after the user has left /extract (e.g. opened /profile).
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/extract")) {
      return;
    }
    router.push("/candidate-dashboard");
  }, [router]);

  useEffect(() => {
    if (authLoading) return;

    isPageActiveRef.current = true;
    isProcessingRef.current = true;
    completionToastShownRef.current = false;

    const pendingTimeouts: ReturnType<typeof setTimeout>[] = [];
    const scheduleTimeout = (fn: () => void, delay: number) => {
      const id = setTimeout(() => {
        if (!isPageActiveRef.current) return;
        fn();
      }, delay);
      pendingTimeouts.push(id);
    };

    const resolvedCandidateId =
      user?.id ||
      localStorage.getItem("candidateId") ||
      sessionStorage.getItem("candidateId");

    if (!resolvedCandidateId) {
      router.push("/uploadcv");
      return () => {
        isPageActiveRef.current = false;
        pendingTimeouts.forEach(clearTimeout);
      };
    }

    const storedCandidateId = resolvedCandidateId;

    const statusMessages = [
      "Parsing PDF document...",
      "Extracting text from CV...",
      "Cleaning and normalizing text...",
      "Sending to AI for analysis...",
      "Extracting personal information...",
      "Analyzing work experience...",
      "Processing education details...",
      "Identifying skills and languages...",
      "Validating extracted data...",
      "Finalizing profile data...",
    ];

    let statusIndex = 0;
    let progressValue = 0;
    let statusInterval: ReturnType<typeof setInterval> | undefined;
    let progressInterval: ReturnType<typeof setInterval> | undefined;
    let checkStatusInterval: ReturnType<typeof setInterval> | undefined;

    const clearPolling = () => {
      if (statusInterval) clearInterval(statusInterval);
      if (progressInterval) clearInterval(progressInterval);
      if (checkStatusInterval) clearInterval(checkStatusInterval);
      statusInterval = undefined;
      progressInterval = undefined;
      checkStatusInterval = undefined;
    };

    const finishProcessing = (statusMessage: string, redirect: () => void) => {
      if (!isPageActiveRef.current || !isProcessingRef.current) return;

      isProcessingRef.current = false;
      setIsProcessing(false);
      setProgress(100);
      setStatus(statusMessage);
      clearPolling();
      sessionStorage.removeItem("uploadStatus");
      sessionStorage.removeItem("uploadError");
      scheduleTimeout(redirect, 1500);
    };

    statusInterval = setInterval(() => {
      if (!isPageActiveRef.current) return;
      if (statusIndex < statusMessages.length - 1) {
        statusIndex += 1;
        setStatus(statusMessages[statusIndex]);
      }
    }, 3000);

    progressInterval = setInterval(() => {
      if (!isPageActiveRef.current) return;
      if (progressValue < 90 && isProcessingRef.current) {
        progressValue += 1;
        setProgress(progressValue);
      }
    }, 200);

    const checkProcessingStatus = async () => {
      if (!isPageActiveRef.current || !storedCandidateId) return;

      try {
        const response = await fetch(`${API_BASE_URL}/cv/status/${storedCandidateId}`);
        if (!response.ok || !isPageActiveRef.current) return;

        const data = await response.json();
        if (data.processed && data.aiAnalyzed) {
          if (!completionToastShownRef.current) {
            completionToastShownRef.current = true;
            showSuccessToast("Resume uploaded", "Your profile has been analyzed successfully.");
          }
          finishProcessing(
            "CV analysis complete! Redirecting to dashboard...",
            redirectToDashboard,
          );
        } else if (data.hasResume && !data.aiAnalyzed) {
          setStatus("Processing CV with AI...");
        }
      } catch {
        if (!isPageActiveRef.current) return;

        const uploadError = sessionStorage.getItem("uploadError");
        if (uploadError) {
          isProcessingRef.current = false;
          setIsProcessing(false);
          setStatus("Upload failed. Please try again.");
          clearPolling();
          scheduleTimeout(() => {
            if (!isPageActiveRef.current) return;
            router.push("/uploadcv");
          }, 3000);
        }
      }
    };

    checkStatusInterval = setInterval(checkProcessingStatus, 2000);
    scheduleTimeout(() => void checkProcessingStatus(), 1000);

    // Only force-complete when the user is still in the post-upload flow on this page
    const awaitingFreshUpload = sessionStorage.getItem("uploadStatus") === "processing";
    if (awaitingFreshUpload) {
      scheduleTimeout(() => {
        if (!isPageActiveRef.current || !isProcessingRef.current) return;
        if (!completionToastShownRef.current) {
          completionToastShownRef.current = true;
          showSuccessToast("Resume uploaded", "Your profile has been analyzed successfully.");
        }
        finishProcessing(
          "Processing complete! Redirecting to dashboard...",
          redirectToDashboard,
        );
      }, 60000);
    }

    return () => {
      isPageActiveRef.current = false;
      pendingTimeouts.forEach(clearTimeout);
      clearPolling();
      sessionStorage.removeItem("uploadStatus");
    };
  }, [authLoading, user?.id, router, redirectToDashboard]);

  if (isProcessing || !minExtractTimerFinished) {
    return <HryantraLoader />;
  }

  return (
    <div className="min-h-screen bg-[#FCFDFE] text-slate-900 flex flex-col relative overflow-hidden font-sans">
      {/* Background Soft AI Glow */}
      <div className="absolute top-0 right-0 -mr-[10%] -mt-[10%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(40,168,225,0.08)_0,rgba(255,255,255,0)_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-[10%] -mb-[10%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(40,168,225,0.05)_0,rgba(255,255,255,0)_60%)] pointer-events-none" />

      {/* Header */}
      <header className="flex flex-none items-center justify-between px-6 py-6 relative z-10 mx-auto w-full max-w-[1240px]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <Image
            src="/SAASA%20Logo.png"
            alt="SAASA B2E"
            width={120}
            height={36}
            className="h-8 w-auto"
          />
        </div>
        <a href="#" className="text-[13px] font-bold text-sky-600 hover:text-sky-700 transition-colors uppercase tracking-widest">
          Help 
        </a>
      </header>

      {/* Main content centered */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 w-full mb-12">
        
        {/* The Card Shell */}
        <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-12 relative overflow-hidden text-center">
          
          <div className="w-full flex justify-center mb-8 relative">
            {!isProcessing ? (
              <div className="w-20 h-20 bg-emerald-50 rounded-[24px] flex items-center justify-center shadow-sm border border-emerald-100 relative z-10 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 w-24 h-24 bg-sky-100 rounded-full animate-ping opacity-75 mx-auto" style={{ top: '-8px' }}></div>
                <div className="w-20 h-20 bg-sky-50 rounded-[24px] flex items-center justify-center shadow-sm border border-sky-100 relative z-10">
                  <Sparkles className="w-8 h-8 text-sky-500 animate-pulse" />
                </div>
              </div>
            )}
          </div>

          <div className="mb-10">
            <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-tight transition-all duration-300">
              {isProcessing ? "Analyzing your profile..." : "Analysis Complete!"}
            </h1>
          </div>

          <div className="mb-8 w-full">
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
              <div 
                className={`h-full rounded-full transition-all duration-500 ease-out relative ${!isProcessing ? 'bg-emerald-500' : 'bg-sky-500'}`}
                style={{ width: `${progress}%` }}
              >
                {isProcessing && (
                   <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-center gap-3">
            {!isProcessing ? (
               <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
               <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-sky-500 animate-spin"></div>
            )}
            <p className="text-[14px] font-semibold text-slate-700">
              {status}
            </p>
          </div>

          <div className={`mt-8 flex justify-center gap-6 opacity-40 transition-opacity duration-1000 ${progress > 30 ? 'opacity-100' : ''}`}>
             <User className={`w-5 h-5 transition-colors duration-500 ${progress > 45 ? 'text-sky-500' : 'text-slate-300'}`} />
             <Briefcase className={`w-5 h-5 transition-colors duration-500 ${progress > 60 ? 'text-sky-500' : 'text-slate-300'}`} />
             <GraduationCap className={`w-5 h-5 transition-colors duration-500 ${progress > 75 ? 'text-sky-500' : 'text-slate-300'}`} />
          </div>
          
        </div>
      </main>
    </div>
  );
}