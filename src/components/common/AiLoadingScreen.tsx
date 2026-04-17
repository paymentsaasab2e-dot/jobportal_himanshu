'use client';
import React from 'react';

const AiLoadingScreen = ({ message = "HRYantra AI" }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f8fafc] overflow-hidden">
      {/* Background Decorative Blobs */}
      <div className="absolute top-1/4 -left-12 h-64 w-64 rounded-full bg-blue-100/40 blur-3xl" />
      <div className="absolute bottom-1/4 -right-12 h-64 w-64 rounded-full bg-blue-50/40 blur-3xl" />

      <div className="relative flex flex-col items-center">
        {/* The Animated Sphere */}
        <div className="relative flex h-64 w-64 items-center justify-center">
          {/* External Glow Layer 1 */}
          <div className="absolute inset-0 animate-[pulse_3s_ease-in-out_infinite] rounded-full bg-blue-500/10 blur-2xl" />
          
          {/* External Glow Layer 2 */}
          <div className="absolute inset-4 animate-[pulse_4s_ease-in-out_infinite] rounded-full bg-blue-400/20 blur-xl shadow-[0_0_50px_rgba(59,130,246,0.3)]" />

          {/* Main Sphere Body */}
          <div className="relative h-44 w-44 overflow-hidden rounded-full border border-white/40 bg-white/10 shadow-[inner_0_0_40px_rgba(255,255,255,0.8),0_0_60px_rgba(59,130,246,0.2)] backdrop-blur-md">
            
            {/* Rotating Liquid Gradient */}
            <div className="absolute inset-0 animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,rgba(59,130,246,0.4)_50%,transparent_100%)] filter blur-md" />
            
            {/* Inner Sphere Content Wrapper */}
            <div className="absolute inset-[3px] flex flex-col items-center justify-center rounded-full bg-white/40 backdrop-blur-lg">
              {/* Inner Soft Shadow */}
              <div className="absolute inset-0 rounded-full shadow-[inset_0_0_25px_rgba(59,130,246,0.15)]" />
              
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-500/80 drop-shadow-sm">
                  {message}
                </span>
                
                {/* Dynamic Status Dots */}
                <div className="mt-4 flex items-center gap-1.5">
                  <div className="h-1 w-1 animate-[bounce_1s_infinite] rounded-full bg-blue-400" />
                  <div className="h-1 w-1 animate-[bounce_1s_infinite_0.2s] rounded-full bg-blue-500" />
                  <div className="h-1.5 w-1.5 animate-[bounce_1s_infinite_0.4s] rounded-full bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                </div>
              </div>
            </div>

            {/* Top Shine Flare */}
            <div className="absolute -top-[20%] left-1/4 h-1/2 w-1/2 rounded-full bg-white/20 blur-xl" />
          </div>
        </div>

        {/* Simplified Universal Message */}
        <div className="mt-6 text-center">
          <h2 className="text-base font-bold tracking-[0.15em] uppercase text-slate-900 drop-shadow-sm">
            AI is Processing...
          </h2>
        </div>
      </div>
      
      {/* Footer Branding */}
      <div className="absolute bottom-10 flex items-center gap-2 opacity-30 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0">
         <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-900 underline decoration-blue-500 decoration-2 underline-offset-4">
           SAASA AI
         </span>
         <div className="h-1 w-1 rounded-full bg-blue-500" />
         <span className="text-[10px] font-bold text-slate-500">Neural Engine (v4.2.0)</span>
      </div>
    </div>
  );
};

export default AiLoadingScreen;
