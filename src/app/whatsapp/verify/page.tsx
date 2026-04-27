"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, AlertCircle, Phone, Mail } from "lucide-react";

import { API_BASE_URL } from '@/lib/api-base';
import { showSuccessToast } from '@/components/common/toast/toast';
import { useAuth } from '@/components/auth/AuthContext';

export default function VerifyOTP() {
  const { login } = useAuth();
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(29);
  const [isResendDisabled, setIsResendDisabled] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpPreview, setOtpPreview] = useState("");

  useEffect(() => {
    // Get WhatsApp number from sessionStorage
    const storedNumber = sessionStorage.getItem("whatsappNumber");
    const storedCountryCode = sessionStorage.getItem("countryCode");
    const storedEmail = sessionStorage.getItem("otpEmail");
    const storedOtpPreview = sessionStorage.getItem("otpPreview");

    if (storedNumber && storedCountryCode && storedEmail) {
      setWhatsappNumber(storedNumber);
      setCountryCode(storedCountryCode);
      setOtpEmail(storedEmail);
      setOtpPreview(storedOtpPreview || "");
    } else {
      // If no stored data, redirect back to WhatsApp page
      router.push("/whatsapp");
    }
  }, [router]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsResendDisabled(false);
    }
  }, [timer]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleResend = async () => {
    setError("");
    setTimer(29);
    setIsResendDisabled(true);

    if (!whatsappNumber || !countryCode || !otpEmail) {
      setError("Missing WhatsApp number. Please go back and enter your number again.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsappNumber: whatsappNumber,
          countryCode: countryCode,
          email: otpEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      // Show OTP on screen when backend sends fallback/testing OTP
      if (data.data.otp) {
        setOtpPreview(data.data.otp);
        sessionStorage.setItem("otpPreview", data.data.otp);
      }

      showSuccessToast("OTP resent", "A fresh verification code has been sent.");
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP. Please try again.");
      console.error("Error resending OTP:", err);
    }
  };

  const handleVerifyOTP = async () => {
    setError("");

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    if (!whatsappNumber || !countryCode) {
      setError("Missing WhatsApp number. Please go back and enter your number again.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whatsappNumber: whatsappNumber,
          countryCode: countryCode,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Invalid OTP. Please try again.");
      }

      // Use the centralized login function from AuthContext
      if (data.data.token && data.data.candidateId) {
        login(data.data.token, data.data.candidateId);
      }

      // Clear OTP-related session data
      sessionStorage.removeItem("whatsappNumber");
      sessionStorage.removeItem("countryCode");
      sessionStorage.removeItem("fullWhatsAppNumber");
      sessionStorage.removeItem("otpEmail");
      sessionStorage.removeItem("otpPreview");

      // Returning users (number already in DB / onboarded before): go straight to dashboard — no CV step
      const skipCv = data.data.skipCvUpload === true;
      const postLoginRedirect = sessionStorage.getItem("postLoginRedirect");
      showSuccessToast("Login successful", "Your account has been verified.");
      if (postLoginRedirect) {
        sessionStorage.removeItem("postLoginRedirect");
        router.push(postLoginRedirect);
      } else {
        router.push(skipCv ? "/candidate-dashboard" : "/uploadcv");
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
      console.error("Error verifying OTP:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const maskPhoneNumber = (number: string) => {
    if (number.length <= 4) return number;
    const visible = number.slice(-4);
    const masked = "•".repeat(number.length - 4);
    return `${masked}${visible}`;
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
        
        {/* The Card Shell */}
        <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_20px_40px_rgba(0,0,0,0.06)] border border-slate-100 p-8 sm:p-10 relative overflow-hidden text-center">
          
          <div className="w-16 h-16 bg-sky-50 rounded-[18px] flex items-center justify-center mx-auto mb-6 shadow-sm border border-sky-100">
            <Mail className="w-7 h-7 text-sky-500" />
          </div>

          <div className="mb-8">
            <h1 className="text-[26px] font-black text-slate-900 tracking-tight leading-tight">
              Check your email
            </h1>
            <p className="mt-2 text-[15px] font-medium text-slate-500 leading-relaxed max-w-[300px] mx-auto">
              We've sent a 6-digit verification code to <span className="text-slate-900 font-bold">{otpEmail || "your email"}</span>.
            </p>
          </div>

          {/* Identity Context */}
          <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-4 py-1.5 mb-8 text-[13px] font-semibold text-slate-600 shadow-sm">
            <Phone className="w-3.5 h-3.5 text-slate-400" />
            {countryCode && whatsappNumber
                  ? `${countryCode} ${maskPhoneNumber(whatsappNumber)}`
                  : "+91 •••••• 1234"}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 flex gap-3 items-start mb-6 text-left">
              <AlertCircle className="w-5 h-5 text-red-500 mt-[-1px] shrink-0" />
              <p className="text-sm font-semibold text-red-700 leading-snug">{error}</p>
            </div>
          )}



          <div className="space-y-6">
            
            {/* OTP Input styled elegantly */}
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className={`w-full h-16 rounded-xl border border-slate-200 bg-slate-50 text-center text-[28px] font-mono tracking-[0.5em] font-bold text-slate-900 shadow-inner focus:bg-white focus:border-sky-400 focus:ring-4 focus:ring-sky-100 transition-all outline-none ${otp.length > 0 ? "tracking-[0.5em]" : ""}`}
                placeholder="••••••"
              />
            </div>

            <button
              type="button"
              className="w-full h-[52px] flex justify-center items-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-[0.98] text-white font-bold text-[15px] shadow-[0_4px_14px_0_rgba(14,165,233,0.39)] hover:shadow-[0_6px_20px_rgba(14,165,233,0.23)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </button>
            
          </div>

          <div className="mt-8 flex flex-col items-center gap-3">
             <div className="text-[13px] font-medium text-slate-500">
                Didn't receive the code?{" "}
                {isResendDisabled ? (
                  <span className="text-slate-400">
                    Resend in {formatTime(timer)}
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    className="text-sky-600 hover:text-sky-700 font-bold transition-colors"
                  >
                    Resend code
                  </button>
                )}
             </div>
             <button
                onClick={() => router.push("/whatsapp")}
                className="text-[13px] font-bold text-slate-500 hover:text-slate-800 transition-colors"
             >
                Change contact details
             </button>
          </div>

        </div>
      </main>
    </div>
  );
}
