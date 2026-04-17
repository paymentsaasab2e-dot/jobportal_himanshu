"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { ArrowRight, Sparkles, AlertCircle, FileText, UploadCloud, FileUp, Phone } from "lucide-react";

import { API_BASE_URL } from '@/lib/api-base';

export default function UploadCV() {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get candidate ID from sessionStorage
    const storedCandidateId = sessionStorage.getItem("candidateId");
    if (storedCandidateId) {
      setCandidateId(storedCandidateId);
    } else {
      // If no candidate ID, redirect to WhatsApp verification
      router.push("/whatsapp");
    }
  }, [router]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Invalid file type. Please upload a PDF, DOC, or DOCX file.");
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        setError("File size exceeds 5MB limit. Please upload a smaller file.");
        return;
      }

      setSelectedFile(file);
      setError("");
      setSuccess("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !candidateId) {
      setError("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    // Store candidateId in sessionStorage for extract page
    sessionStorage.setItem("candidateId", candidateId);
    sessionStorage.setItem("uploadStatus", "processing");

    try {
      const formData = new FormData();
      formData.append("cv", selectedFile);
      formData.append("candidateId", candidateId);

      // Start the upload and redirect to extract page
      const xhr = new XMLHttpRequest();

      // Track upload progress (for reference)
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          setUploadProgress(percentComplete);
        }
      });

      // Handle upload completion/errors
      xhr.addEventListener("load", () => {
        // Upload completed - extract page will handle status checking
        if (xhr.status !== 200) {
          // If upload fails, store error in sessionStorage
          try {
            const response = JSON.parse(xhr.responseText);
            sessionStorage.setItem("uploadError", response.message || "Upload failed");
          } catch (e) {
            sessionStorage.setItem("uploadError", "Upload failed. Please try again.");
          }
        }
      });

      xhr.addEventListener("error", () => {
        sessionStorage.setItem("uploadError", "Network error. Please check your connection and try again.");
      });

      // Open and send the request
      xhr.open("POST", `${API_BASE_URL}/cv/upload`);
      xhr.send(formData);

      // Redirect to extract page immediately after starting upload
      // The extract page will poll for completion status
      setTimeout(() => {
        router.push("/extract");
      }, 100); // Small delay to ensure request is sent
    } catch (err: any) {
      sessionStorage.setItem("uploadError", err.message || "Upload failed. Please try again.");
      router.push("/extract");
    }
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

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
        
        {/* The Card Shell (Wider for upload zone) */}
        <div className="w-full max-w-[560px] bg-white rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
          
          <div className="w-16 h-16 bg-sky-50 rounded-[18px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-sky-100">
            <Sparkles className="w-7 h-7 text-sky-500" />
          </div>

          <div className="mb-10 text-center">
            <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-tight">
              Let's build your AI Profile
            </h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500 leading-relaxed max-w-[400px] mx-auto">
              Upload your CV. Our AI will instantly extract your skills, experience, and education for your dashboard.
            </p>
          </div>

          {!selectedFile ? (
            <div className="space-y-4">
              {/* OPTION A: Upload from computer (PRIMARY) */}
              <div 
                 className="relative w-full rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-400 hover:bg-sky-50/30 bg-slate-50 transition-all cursor-pointer overflow-hidden group"
                 onClick={handleChooseFile}
              >
                 <div className="p-8 flex flex-col items-center justify-center text-center relative z-10">
                   <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100 group-hover:scale-110 transition-transform">
                     <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-sky-500 transition-colors" />
                   </div>
                   <p className="text-[16px] font-bold text-slate-900 mb-1 pointer-events-none group-hover:text-sky-700 transition-colors">
                     Upload from computer
                   </p>
                   <p className="text-[13px] font-medium text-slate-500 pointer-events-none">
                     Click to browse or drag file here
                   </p>
                 </div>
              </div>

              {/* OPTION B: Upload via WhatsApp (SECONDARY) */}
              <div className="w-full rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20 transition-all cursor-pointer group p-5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition-colors">
                      <Phone className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="text-[15px] font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        Send via WhatsApp
                      </p>
                      <p className="text-[13px] font-medium text-slate-500">
                        Send your CV from your phone
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-translate group-hover:translate-x-1" />
              </div>
            </div>
          ) : (
            /* FILE SELECTED STATE */
            <div className="space-y-6">
              <div className="w-full rounded-2xl border-2 border-sky-500 bg-sky-50/50 p-6 flex flex-col items-center justify-center text-center relative shadow-sm">
                 <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-sky-100">
                   <FileText className="w-6 h-6 text-sky-500" />
                 </div>
                 <p className="text-[16px] font-bold text-slate-900 mb-1 w-full max-w-[300px] truncate px-4">
                   {selectedFile.name}
                 </p>
                 <p className="text-[13px] font-medium text-slate-500 mb-5">
                   {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to process
                 </p>
                 
                 <button 
                   onClick={handleChooseFile}
                   className="text-[13px] font-bold text-sky-600 hover:text-sky-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-sky-100 transition-colors"
                 >
                   Choose different file
                 </button>
              </div>

              {/* Primary CTA */}
              <button
                type="button"
                className="w-full h-[56px] flex justify-center items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white font-bold text-[16px] shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing Profile...
                  </>
                ) : (
                  <>
                    Build My Profile
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* Hidden Input field */}
          <input
             type="file"
             ref={fileInputRef}
             onChange={handleFileSelect}
             accept=".pdf,.doc,.docx"
             className="hidden"
          />

          {/* Supportive Format Text */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
             <p className="text-[13px] font-medium text-slate-500">
               Supported formats: PDF or MS Word (Max 5MB)
             </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex gap-3 items-start mt-6">
              <AlertCircle className="w-5 h-5 text-red-500 mt-[-1px] shrink-0" />
              <p className="text-sm font-semibold text-red-700 leading-snug">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-3.5 flex gap-3 items-start mt-6">
              <Sparkles className="w-5 h-5 text-green-500 mt-[-1px] shrink-0" />
              <p className="text-sm font-semibold text-green-700 leading-snug">{success}</p>
            </div>
          )}

          {/* Progress Bar */}
          {isUploading && (
            <div className="mt-6 space-y-2">
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-sky-500 rounded-full transition-all duration-300 relative"
                  style={{ width: `${Math.max(uploadProgress, 5)}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <span>Uploading Document</span>
                <span>{Math.round(uploadProgress)}%</span>
              </div>
            </div>
          )}
          
        </div>
      </main>
    </div>
  );
}
