"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const styles = `
  .gradient-text {
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    background-image: linear-gradient(to right, #4f46e5, #9333ea, #db2777);
  }
  
  .fade-in-up {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .fade-in-up.visible {
    opacity: 1;
    transform: translateY(0);
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
  }

  @keyframes pulse-glow {
    0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.3); }
    70% { box-shadow: 0 0 0 20px rgba(79, 70, 229, 0); }
    100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
  }

  @keyframes rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes counter-rotate {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(-360deg); }
  }

  @keyframes fadeIn {
      to { opacity: 1; }
  }

  @keyframes shimmer {
    100% { transform: translateX(100%); }
  }

  @keyframes scan {
    0%, 100% { top: 0; opacity: 0; }
    10%, 90% { opacity: 1; }
    50% { top: 100%; }
  }

  @keyframes grow {
    from { height: 0%; }
    to { height: 100%; }
  }

  .hero-bg-glow {
      position: absolute;
      top: -20%;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 800px;
      background: radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, rgba(252, 252, 253, 0) 70%);
      z-index: 0;
      pointer-events: none;
  }

  .cta-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, rgba(252, 252, 253, 0) 70%);
      z-index: 0;
  }

  .center-glow {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 150px;
      height: 150px;
      background: radial-gradient(circle, rgba(147, 51, 234, 0.1) 0%, rgba(0,0,0,0) 70%);
      border-radius: 50%;
  }

  .card-glow {
      position: absolute;
      top: 0;
      right: 0;
      width: 200px;
      height: 200px;
      background: radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, rgba(0,0,0,0) 70%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0;
  }
  .group:hover .card-glow {
      opacity: 1;
  }

  .journey-line {
      position: absolute;
      top: 50%;
      left: 5%;
      right: 5%;
      height: 2px;
      background: #e5e7eb;
      transform: translateY(-50%);
      z-index: 1;
  }

  @keyframes journeyFill {
      0% { width: 0%; opacity: 1; }
      90% { width: 100%; opacity: 1; }
      95% { width: 100%; opacity: 0; }
      100% { width: 0%; opacity: 0; }
  }

  @keyframes journeyFillMobile {
      0% { height: 0%; opacity: 1; }
      90% { height: 100%; opacity: 1; }
      95% { height: 100%; opacity: 0; }
      100% { height: 0%; opacity: 0; }
  }

  @keyframes journeyNodePulse {
      0%, 100% { box-shadow: none; border-color: #e5e7eb; transform: scale(1); color: #4b5563; }
      10% { 
          box-shadow: 0 0 0 10px rgba(79, 70, 229, 0.1), 0 0 25px rgba(79, 70, 229, 0.3);
          border-color: #4f46e5;
          color: #4f46e5;
          transform: scale(1.15);
      }
      20% { box-shadow: none; border-color: #e5e7eb; transform: scale(1); color: #4b5563; }
  }

  @keyframes journeyNodePulseEnd {
      0%, 100% { box-shadow: none; border-color: #e5e7eb; transform: scale(1); background-color: white; color: #4b5563; }
      10% { 
          box-shadow: 0 0 0 10px rgba(16, 185, 129, 0.15), 0 0 25px rgba(16, 185, 129, 0.4);
          border-color: #059669;
          background-color: #10b981;
          transform: scale(1.15);
          color: white;
      }
      20% { box-shadow: none; border-color: #e5e7eb; transform: scale(1); background-color: white; color: #4b5563; }
  }

  .journey-line::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      width: 0%;
      background: linear-gradient(to right, #4f46e5, #9333ea, #10b981);
      box-shadow: 0 0 10px rgba(79, 70, 229, 0.4);
      animation: journeyFill 9s ease-in-out infinite;
  }

  @media (max-width: 768px) {
      .journey-line {
          top: 0; left: 32px; right: auto; width: 2px; height: 100%;
          transform: none;
      }
      .journey-line::after { 
          width: 100%; 
          height: 0%; 
          background: linear-gradient(to bottom, #4f46e5, #9333ea, #10b981);
          animation: journeyFillMobile 9s ease-in-out infinite;
      }
  }

  /* Utility mapping for Tailwind Arbitrary Config */
  .animate-float { animation: float 6s ease-in-out infinite; }
  .animate-pulse-glow { animation: pulse-glow 2s infinite; }
  .animate-rotate { animation: rotate 20s linear infinite; }
  .animate-counter-rotate { animation: counter-rotate 20s linear infinite; }
  .animate-fade-in { animation: fadeIn 1s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
`;

export default function Home() {

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.15,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll(".fade-in-up");
    animatedElements.forEach((el) => observer.observe(el));

    return () => {
      animatedElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#fcfcfd] text-[#111827] font-inter overflow-x-hidden">
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      {/* Hero Section */}
      <header className="relative pt-[160px] pb-[100px] min-h-screen flex items-center overflow-hidden">
        <div className="hero-bg-glow"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="opacity-0 animate-fade-in text-center md:text-left">
            <h1 className="text-4xl md:text-5xl lg:text-[4rem] mb-6 tracking-tight text-gray-900">
              We don't just help you apply. <br />
              <span className="gradient-text">We help you get hired.</span>
            </h1>
            <p className="text-lg text-gray-600 mb-10 max-w-[90%] mx-auto md:mx-0">
              Transform your job search into job success. SAASA B2E provides an interconnected AI ecosystem that optimizes your resume, perfects your interview skills, and upskills you for the exact roles you want.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link
                href="/whatsapp"
                className="px-7 py-3.5 rounded-full font-medium text-base text-white bg-gradient-to-br from-accent-primary to-accent-secondary shadow-[0_4px_14px_0_rgba(79,70,229,0.25)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition inline-flex items-center justify-center gap-2"
              >
                Start Your Journey
              </Link>
              <Link
                href="#services"
                className="px-7 py-3.5 rounded-full font-medium text-base border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:bg-gray-100 transition inline-flex items-center justify-center gap-2"
              >
                Explore AI Tools <i className="fa-solid fa-arrow-down"></i>
              </Link>
            </div>
          </div>
          <div className="relative h-[500px] flex justify-center items-center mt-10 md:mt-0 opacity-0 animate-fade-in [animation-delay:200ms] w-full">
            
            {/* Background decorative rings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[350px] h-[350px] md:w-[450px] md:h-[450px] border border-accent-primary/10 rounded-full absolute animate-[pulse-glow_4s_ease-in-out_infinite]"></div>
              <div className="w-[250px] h-[250px] md:w-[320px] md:h-[320px] border border-accent-secondary/20 rounded-full absolute animate-[pulse-glow_4s_ease-in-out_infinite_1s]"></div>
            </div>

            {/* Floating Pills */}
            <div className="absolute top-[10%] right-[0%] md:right-[5%] bg-white/95 backdrop-blur-md border border-gray-100 py-3 px-5 rounded-2xl flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-30 animate-float hover:scale-105 active:scale-95 cursor-pointer transition-all duration-300 hover:border-accent-primary/30 hover:shadow-[0_8px_30px_rgba(79,70,229,0.15)] group">
              <div className="w-10 h-10 rounded-full bg-accent-primary/10 flex items-center justify-center text-accent-primary text-lg group-hover:rotate-12 group-hover:bg-accent-primary group-hover:text-white transition-all duration-300">
                <i className="fa-solid fa-robot"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-900 text-sm font-bold font-outfit group-hover:text-accent-primary transition-colors duration-300">AI Analysis</span>
                <span className="text-accent-primary text-[10px] font-bold uppercase tracking-wider">Scanning...</span>
              </div>
            </div>
            
            <div className="absolute bottom-[20%] -left-[5%] md:-left-[10%] bg-white/95 backdrop-blur-md border border-gray-100 py-3 px-5 rounded-2xl flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-30 animate-float [animation-delay:2s] hover:scale-105 active:scale-95 cursor-pointer transition-all duration-300 hover:border-[#10b981]/30 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] group">
              <div className="w-10 h-10 rounded-full bg-[#10b981]/10 flex items-center justify-center text-[#10b981] text-lg group-hover:-rotate-12 group-hover:bg-[#10b981] group-hover:text-white transition-all duration-300">
                <i className="fa-solid fa-bolt"></i>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-900 text-sm font-bold font-outfit group-hover:text-[#10b981] transition-colors duration-300">ATS Match</span>
                <span className="text-[#10b981] text-[10px] font-bold uppercase tracking-wider">Excellent</span>
              </div>
            </div>
            
            {/* Main Mockup Card */}
            <div className="w-full max-w-[380px] md:max-w-[420px] bg-white/80 backdrop-blur-2xl border border-gray-200/80 rounded-[2rem] p-6 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative z-20 overflow-hidden group/card hover:-translate-y-2 hover:shadow-[0_30px_60px_-15px_rgba(79,70,229,0.15)] hover:border-accent-primary/30 transition-all duration-500 cursor-pointer">
              {/* Glass reflection */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/60 to-transparent pointer-events-none"></div>
              
              {/* Top Bar */}
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 relative z-10">
                <div className="flex gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ef4444] shadow-sm hover:scale-150 transition-transform duration-200 cursor-pointer"></span>
                  <span className="w-3 h-3 rounded-full bg-[#f59e0b] shadow-sm hover:scale-150 transition-transform duration-200 cursor-pointer"></span>
                  <span className="w-3 h-3 rounded-full bg-[#10b981] shadow-sm hover:scale-150 transition-transform duration-200 cursor-pointer"></span>
                </div>
                <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 flex items-center gap-2 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200">
                  <i className="fa-regular fa-file-pdf"></i> resume_vfinal.pdf
                </div>
              </div>
              
              {/* Content Area with Scanner */}
              <div className="relative mb-6 z-10">
                {/* Scanner Line Animation */}
                <div className="absolute left-0 right-0 h-[2px] bg-accent-primary shadow-[0_0_15px_3px_rgba(79,70,229,0.4)] z-20 animate-[scan_3s_ease-in-out_infinite] group-hover/card:bg-accent-secondary group-hover/card:shadow-[0_0_15px_3px_rgba(147,51,234,0.4)] transition-colors duration-500"></div>
                
                {/* Mock Content */}
                <div className="space-y-4">
                  {/* Mock Header */}
                  <div className="flex gap-4 items-center hover:bg-gray-50 p-2 -mx-2 rounded-xl transition-colors duration-200 cursor-default">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-50 to-gray-200 border border-gray-200 flex-shrink-0 hover:scale-110 transition-transform duration-200 flex items-center justify-center overflow-hidden">
                      <i className="fa-solid fa-user text-gray-400 text-xl"></i>
                    </div>
                    <div className="w-full">
                      <div className="text-sm font-bold text-gray-900 leading-tight">Alex Sterling</div>
                      <div className="text-[10px] text-gray-500 font-medium">Senior Software Engineer</div>
                      <div className="text-[9px] text-gray-400 mt-1 flex gap-2">
                        <span><i className="fa-solid fa-location-dot"></i> San Francisco, CA</span>
                        <span><i className="fa-solid fa-envelope"></i> alex@example.com</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mock Experience */}
                  <div className="pt-1 px-2 hover:bg-gray-50 -mx-2 p-2 rounded-xl transition-colors duration-200 cursor-default">
                    <div className="text-[11px] font-bold text-gray-800 mb-1">Experience</div>
                    <div className="text-[10px] font-semibold text-gray-700">TechNova Solutions <span className="text-gray-400 font-normal">| 2021 - Present</span></div>
                    <ul className="text-[9.5px] text-gray-500 list-disc pl-3 mt-1.5 space-y-1.5 leading-relaxed">
                      <li>Architected and migrated a legacy monolithic application to microservices using Node.js and Docker, improving system uptime by 99.9%.</li>
                      <li>Led a team of 5 engineers to deliver a real-time analytics dashboard in React, increasing user engagement by 40%.</li>
                    </ul>
                  </div>
                  
                  {/* Mock Skills */}
                  <div className="flex flex-wrap gap-1.5 pt-1 px-2">
                    <div className="text-[10px] font-semibold text-accent-primary bg-accent-primary/10 px-2.5 py-1 rounded-md border border-accent-primary/20 hover:scale-110 hover:shadow-md hover:bg-accent-primary hover:text-white transition-all duration-300 cursor-default">React.js</div>
                    <div className="text-[10px] font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 hover:scale-110 hover:shadow-md hover:bg-gray-800 hover:text-white transition-all duration-300 cursor-default">TypeScript</div>
                    <div className="text-[10px] font-semibold text-accent-secondary bg-accent-secondary/10 px-2.5 py-1 rounded-md border border-accent-secondary/20 hover:scale-110 hover:shadow-md hover:bg-accent-secondary hover:text-white transition-all duration-300 cursor-default">Node.js</div>
                    <div className="text-[10px] font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200 hover:scale-110 hover:shadow-md hover:bg-gray-800 hover:text-white transition-all duration-300 cursor-default">AWS</div>
                  </div>
                </div>
              </div>

              {/* Bottom AI Assessment Box */}
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden z-10 group/box hover:shadow-md hover:-translate-y-1 hover:border-accent-primary/30 transition-all duration-300">
                <div className="absolute right-0 top-0 w-32 h-32 bg-accent-primary/5 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2 group-hover/box:bg-accent-primary/10 transition-colors duration-300"></div>
                <div className="flex justify-between items-end relative z-10">
                  <div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 group-hover/box:text-accent-primary transition-colors duration-300">Impact Score</div>
                    <div className="text-4xl font-outfit font-bold text-gray-900 group-hover/box:text-accent-primary transition-colors duration-300">92<span className="text-lg text-gray-400 font-medium group-hover/box:text-accent-primary/60">/100</span></div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <div className="w-2.5 bg-gray-200 rounded-t-sm h-4 group-hover/box:bg-accent-secondary/20 group-hover/box:h-6 transition-all duration-300"></div>
                    <div className="w-2.5 bg-gray-200 rounded-t-sm h-6 group-hover/box:bg-accent-secondary/40 group-hover/box:h-10 transition-all duration-300"></div>
                    <div className="w-2.5 bg-accent-primary/20 rounded-t-sm h-10 relative overflow-hidden group-hover/box:h-14 transition-all duration-300"><div className="absolute bottom-0 w-full bg-accent-primary rounded-t-sm animate-[grow_2s_ease-out_forwards]"></div></div>
                    <div className="w-2.5 bg-[#10b981]/20 rounded-t-sm h-14 relative overflow-hidden group-hover/box:h-16 transition-all duration-300"><div className="absolute bottom-0 w-full bg-[#10b981] rounded-t-sm animate-[grow_2s_ease-out_forwards_0.5s]"></div></div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </header>

      {/* Trust / Proof Section */}
      <section className="py-16 border-y border-black/5 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center fade-in-up">
            <div className="group hover:-translate-y-1 transition-transform duration-300 cursor-default">
              <h3 className="text-4xl md:text-5xl mb-2 gradient-text font-outfit inline-block group-hover:scale-110 group-hover:drop-shadow-sm transition-all duration-300">3.5x</h3>
              <p className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors duration-300">Higher Shortlist Rate</p>
            </div>
            <div className="group hover:-translate-y-1 transition-transform duration-300 cursor-default">
              <h3 className="text-4xl md:text-5xl mb-2 gradient-text font-outfit inline-block group-hover:scale-110 group-hover:drop-shadow-sm transition-all duration-300">92%</h3>
              <p className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors duration-300">Interview Success Score</p>
            </div>
            <div className="group hover:-translate-y-1 transition-transform duration-300 cursor-default">
              <h3 className="text-4xl md:text-5xl mb-2 gradient-text font-outfit inline-block group-hover:scale-110 group-hover:drop-shadow-sm transition-all duration-300">60+</h3>
              <p className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors duration-300">Days Faster Placement</p>
            </div>
            <div className="group hover:-translate-y-1 transition-transform duration-300 cursor-default">
              <h3 className="text-4xl md:text-5xl mb-2 gradient-text font-outfit inline-block group-hover:scale-110 group-hover:drop-shadow-sm transition-all duration-300">1M+</h3>
              <p className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors duration-300">Resumes Optimized</p>
            </div>
          </div>
        </div>
      </section>

      {/* User Journey Flow */}
      <section id="journey" className="py-[120px]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center fade-in-up">
            <h2 className="text-4xl mb-4 text-gray-900">Your Path to Job Success</h2>
            <p className="text-lg text-gray-600 max-w-[600px] mx-auto">
              A connected ecosystem that builds your confidence and competence at every single step.
            </p>
          </div>
          
          <div className="relative py-10 fade-in-up [transition-delay:200ms]">
            <div className="journey-line"></div>
            <div className="flex flex-col md:flex-row justify-between relative z-10 gap-8 md:gap-0 pl-8 md:pl-0">
              
              <div className="group text-left md:text-center w-full md:w-[140px] bg-transparent md:bg-[#fcfcfd] p-0 md:p-3 flex md:block items-center gap-5 md:gap-0 hover:-translate-y-2 hover:bg-white md:hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] rounded-2xl transition-all duration-300 cursor-pointer">
                <div className="w-16 h-16 shrink-0 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-0 md:mx-auto mb-0 md:mb-4 text-2xl text-gray-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-accent-primary group-hover:text-accent-primary group-hover:shadow-md animate-[journeyNodePulse_9s_infinite] [animation-delay:0s]">
                  <i className="fa-regular fa-user"></i>
                </div>
                <div className="grow md:grow-0">
                  <h4 className="text-lg mb-1 text-gray-900 font-outfit group-hover:text-accent-primary transition-colors duration-300">Profile</h4>
                  <p className="text-sm text-gray-600">Build your base</p>
                </div>
              </div>

              <div className="group text-left md:text-center w-full md:w-[140px] bg-transparent md:bg-[#fcfcfd] p-0 md:p-3 flex md:block items-center gap-5 md:gap-0 hover:-translate-y-2 hover:bg-white md:hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] rounded-2xl transition-all duration-300 cursor-pointer">
                <div className="w-16 h-16 shrink-0 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-0 md:mx-auto mb-0 md:mb-4 text-2xl text-gray-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-accent-primary group-hover:text-accent-primary group-hover:shadow-md animate-[journeyNodePulse_9s_infinite] [animation-delay:1.5s]">
                  <i className="fa-regular fa-file-lines"></i>
                </div>
                <div className="grow md:grow-0">
                  <h4 className="text-lg mb-1 text-gray-900 font-outfit group-hover:text-accent-primary transition-colors duration-300">Resume</h4>
                  <p className="text-sm text-gray-600">AI generation</p>
                </div>
              </div>

              <div className="group text-left md:text-center w-full md:w-[140px] bg-transparent md:bg-[#fcfcfd] p-0 md:p-3 flex md:block items-center gap-5 md:gap-0 hover:-translate-y-2 hover:bg-white md:hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] rounded-2xl transition-all duration-300 cursor-pointer relative z-20">
                <div className="w-16 h-16 shrink-0 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-0 md:mx-auto mb-0 md:mb-4 text-2xl text-gray-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:bg-accent-primary group-hover:text-white group-hover:shadow-[0_0_20px_rgba(147,51,234,0.3)] animate-[journeyNodePulse_9s_infinite] [animation-delay:3s]">
                  <i className="fa-solid fa-magnifying-glass-chart"></i>
                </div>
                <div className="grow md:grow-0">
                  <h4 className="text-lg mb-1 text-gray-900 font-outfit group-hover:text-accent-primary transition-colors duration-300">Analysis</h4>
                  <p className="text-sm text-gray-600">ATS scoring</p>
                </div>
              </div>

              <div className="group text-left md:text-center w-full md:w-[140px] bg-transparent md:bg-[#fcfcfd] p-0 md:p-3 flex md:block items-center gap-5 md:gap-0 hover:-translate-y-2 hover:bg-white md:hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] rounded-2xl transition-all duration-300 cursor-pointer">
                <div className="w-16 h-16 shrink-0 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-0 md:mx-auto mb-0 md:mb-4 text-2xl text-gray-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-accent-secondary group-hover:text-accent-secondary group-hover:shadow-md animate-[journeyNodePulse_9s_infinite] [animation-delay:4.5s]">
                  <i className="fa-solid fa-arrow-trend-up"></i>
                </div>
                <div className="grow md:grow-0">
                  <h4 className="text-lg mb-1 text-gray-900 font-outfit group-hover:text-accent-secondary transition-colors duration-300">Improvement</h4>
                  <p className="text-sm text-gray-600">Skill gap fix</p>
                </div>
              </div>

              <div className="group text-left md:text-center w-full md:w-[140px] bg-transparent md:bg-[#fcfcfd] p-0 md:p-3 flex md:block items-center gap-5 md:gap-0 hover:-translate-y-2 hover:bg-white md:hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] rounded-2xl transition-all duration-300 cursor-pointer">
                <div className="w-16 h-16 shrink-0 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-0 md:mx-auto mb-0 md:mb-4 text-2xl text-gray-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-accent-secondary group-hover:text-accent-secondary group-hover:shadow-md animate-[journeyNodePulse_9s_infinite] [animation-delay:6s]">
                  <i className="fa-regular fa-comments"></i>
                </div>
                <div className="grow md:grow-0">
                  <h4 className="text-lg mb-1 text-gray-900 font-outfit group-hover:text-accent-secondary transition-colors duration-300">Practice</h4>
                  <p className="text-sm text-gray-600">Mock interviews</p>
                </div>
              </div>

              <div className="group text-left md:text-center w-full md:w-[140px] bg-transparent md:bg-[#fcfcfd] p-0 md:p-3 flex md:block items-center gap-5 md:gap-0 hover:-translate-y-2 hover:bg-white md:hover:shadow-[0_15px_30px_rgba(0,0,0,0.06)] rounded-2xl transition-all duration-300 cursor-pointer">
                <div className="w-16 h-16 shrink-0 bg-white border border-gray-200 rounded-full flex items-center justify-center mx-0 md:mx-auto mb-0 md:mb-4 text-2xl text-gray-600 shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-[journeyNodePulseEnd_9s_infinite] [animation-delay:7.5s]">
                  <i className="fa-solid fa-check-double"></i>
                </div>
                <div className="grow md:grow-0">
                  <h4 className="text-lg mb-1 text-gray-900 font-outfit group-hover:text-[#10b981] transition-colors duration-300">Hired</h4>
                  <p className="text-sm text-gray-600">Job Success</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-[120px] bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.03)_0%,rgba(252,252,253,0)_70%)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16 text-center fade-in-up">
            <h2 className="text-4xl mb-4 text-gray-900">Everything you need to <span className="gradient-text">stand out</span></h2>
            <p className="text-lg text-gray-600 max-w-[600px] mx-auto">
              Our AI-powered services work seamlessly together to ensure you're the top candidate for the role.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            
            {/* Service 1 */}
            <div className="group bg-gradient-to-b from-white to-[#fafafa] border border-gray-200/80 rounded-[1.5rem] p-6 lg:p-8 relative overflow-hidden transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-accent-primary/10 hover:-translate-y-2 hover:border-accent-primary/30 flex flex-col fade-in-up">
              <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-gradient-to-br from-accent-primary/10 to-transparent blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-50 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 rounded-xl flex items-center justify-center text-xl text-accent-primary mb-6 relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <i className="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <h3 className="text-xl lg:text-2xl mb-3 text-gray-900 font-outfit font-bold tracking-tight relative z-10">AI Resume Builder</h3>
              <p className="text-gray-600 mb-8 text-base leading-relaxed grow relative z-10">
                Beat the ATS every time. Our AI suggests high-impact keywords, rewrites your bullet points, and perfectly tailors your resume.
              </p>
              
              <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl p-5 mt-auto relative z-10 group-hover:-translate-y-1 transition-transform duration-500">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">ATS Match</div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-[#10b981]/10 text-[#059669] rounded-full text-[10px] font-bold">
                    <i className="fa-solid fa-arrow-trend-up"></i> +32%
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="grow h-2 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full rounded-full bg-gradient-to-r from-[#34d399] to-[#059669] w-[94%] relative overflow-hidden group-hover:after:absolute group-hover:after:inset-0 group-hover:after:bg-white/20 group-hover:after:-translate-x-full group-hover:after:animate-[shimmer_1.5s_infinite]"></div>
                  </div>
                  <span className="font-outfit font-bold text-lg text-gray-900">94%</span>
                </div>
              </div>
              
              <Link href="/whatsapp" className="inline-flex items-center gap-2 font-semibold text-gray-900 mt-6 relative z-10 group/cta text-base">
                Try Resume Builder <span className="bg-gray-100 w-7 h-7 rounded-full flex items-center justify-center group-hover/cta:bg-accent-primary group-hover/cta:text-white transition-colors duration-300"><i className="fa-solid fa-arrow-right text-[10px]"></i></span>
              </Link>
            </div>

            {/* Service 2 */}
            <div className="group bg-gradient-to-b from-white to-[#fafafa] border border-gray-200/80 rounded-[1.5rem] p-6 lg:p-8 relative overflow-hidden transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-accent-secondary/10 hover:-translate-y-2 hover:border-accent-secondary/30 flex flex-col fade-in-up [transition-delay:150ms]">
              <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-gradient-to-br from-accent-secondary/10 to-transparent blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-50 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 rounded-xl flex items-center justify-center text-xl text-accent-secondary mb-6 relative z-10 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <i className="fa-solid fa-video"></i>
              </div>
              <h3 className="text-xl lg:text-2xl mb-3 text-gray-900 font-outfit font-bold tracking-tight relative z-10">AI Interview Prep</h3>
              <p className="text-gray-600 mb-8 text-base leading-relaxed grow relative z-10">
                Practice with a realistic AI interviewer. Get real-time feedback on your pacing, tone, and the strength of your answers.
              </p>
              
              <div className="bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-xl p-4 mt-auto relative z-10 flex flex-col gap-3 group-hover:-translate-y-1 transition-transform duration-500">
                <div className="px-3 py-2.5 text-xs max-w-[85%] bg-gray-50 border border-gray-100 rounded-xl rounded-bl-sm self-start text-gray-700 shadow-sm">
                  Tell me about a time you overcame a challenge.
                </div>
                <div className="px-3 py-2.5 text-xs max-w-[85%] bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-xl rounded-br-sm self-end shadow-md relative overflow-hidden group-hover:shadow-lg transition-shadow">
                  In my last role, we faced a tight deadline...
                </div>
                <div className="self-center mt-1 text-[0.7rem] text-[#b45309] bg-[#f59e0b]/10 px-3 py-1 rounded-full font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <i className="fa-solid fa-lightbulb"></i> Great STAR method
                </div>
              </div>
              
              <Link href="/whatsapp" className="inline-flex items-center gap-2 font-semibold text-gray-900 mt-6 relative z-10 group/cta text-base">
                Start Mock Interview <span className="bg-gray-100 w-7 h-7 rounded-full flex items-center justify-center group-hover/cta:bg-accent-secondary group-hover/cta:text-white transition-colors duration-300"><i className="fa-solid fa-arrow-right text-[10px]"></i></span>
              </Link>
            </div>

            {/* Service 3 */}
            <div className="group bg-gradient-to-b from-white to-[#fafafa] border border-gray-200/80 rounded-[1.5rem] p-6 lg:p-8 relative overflow-hidden transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-accent-primary/10 hover:-translate-y-2 hover:border-accent-primary/30 flex flex-col fade-in-up [transition-delay:300ms]">
              <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-gradient-to-br from-accent-primary/10 to-transparent blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-50 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 rounded-xl flex items-center justify-center text-xl text-accent-primary mb-6 relative z-10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                <i className="fa-solid fa-list-check"></i>
              </div>
              <h3 className="text-xl lg:text-2xl mb-3 text-gray-900 font-outfit font-bold tracking-tight relative z-10">Quizzes & Assessment</h3>
              <p className="text-gray-600 mb-8 text-base leading-relaxed grow relative z-10">
                Prove your expertise. Take AI-generated skill assessments that evaluate your readiness and identify areas for improvement.
              </p>
              
              <div className="mt-auto relative z-10 flex flex-col gap-2.5 group-hover:-translate-y-1 transition-transform duration-500">
                <div className="flex justify-between items-center px-4 py-3 bg-white border-l-4 border-l-[#10b981] border-y border-r border-gray-100 rounded-lg text-sm font-semibold shadow-[0_4px_20px_rgb(0,0,0,0.03)] group-hover:translate-x-1 transition-transform">
                  <span className="text-gray-900 text-sm">React.js</span> <span className="text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded text-xs">9/10</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 bg-white border-l-4 border-l-[#10b981] border-y border-r border-gray-100 rounded-lg text-sm font-semibold shadow-[0_4px_20px_rgb(0,0,0,0.03)] group-hover:translate-x-1 transition-transform [transition-delay:50ms]">
                  <span className="text-gray-900 text-sm">System Design</span> <span className="text-[#10b981] bg-[#10b981]/10 px-2 py-0.5 rounded text-xs">7/10</span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 bg-white border-l-4 border-l-[#f59e0b] border-y border-r border-gray-100 rounded-lg text-sm font-semibold shadow-[0_4px_20px_rgb(0,0,0,0.03)] group-hover:translate-x-1 transition-transform [transition-delay:100ms]">
                  <span className="text-gray-900 text-sm">Data Structures</span> <span className="text-[#f59e0b] bg-[#f59e0b]/10 px-2 py-0.5 rounded text-xs">Needs Work</span>
                </div>
              </div>
              
              <Link href="/whatsapp" className="inline-flex items-center gap-2 font-semibold text-gray-900 mt-6 relative z-10 group/cta text-base">
                Test Your Skills <span className="bg-gray-100 w-7 h-7 rounded-full flex items-center justify-center group-hover/cta:bg-accent-primary group-hover/cta:text-white transition-colors duration-300"><i className="fa-solid fa-arrow-right text-[10px]"></i></span>
              </Link>
            </div>

            {/* Service 4 */}
            <div className="group bg-gradient-to-b from-white to-[#fafafa] border border-gray-200/80 rounded-[1.5rem] p-6 lg:p-8 relative overflow-hidden transition-all duration-500 shadow-sm hover:shadow-2xl hover:shadow-accent-secondary/10 hover:-translate-y-2 hover:border-accent-secondary/30 flex flex-col fade-in-up [transition-delay:450ms]">
              <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-gradient-to-br from-accent-secondary/10 to-transparent blur-[60px] rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="w-12 h-12 bg-gradient-to-br from-white to-gray-50 shadow-[0_4px_10px_rgba(0,0,0,0.03)] border border-gray-100 rounded-xl flex items-center justify-center text-xl text-accent-secondary mb-6 relative z-10 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500">
                <i className="fa-solid fa-graduation-cap"></i>
              </div>
              <h3 className="text-xl lg:text-2xl mb-3 text-gray-900 font-outfit font-bold tracking-tight relative z-10">Targeted Learning</h3>
              <p className="text-gray-600 mb-8 text-base leading-relaxed grow relative z-10">
                Bridge the gap between where you are and where you want to be. Our AI recommends hyper-specific mini-courses.
              </p>
              
              <div className="mt-auto relative z-10 group-hover:-translate-y-1 transition-transform duration-500">
                <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-5"></div>
                  <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-lg flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-500">
                      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <i className="fa-solid fa-play text-[10px] ml-0.5"></i>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <strong className="text-gray-900 font-outfit text-base mb-0.5 leading-tight">Advanced Data Structures</strong>
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Recommended Module</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Link href="/whatsapp" className="inline-flex items-center gap-2 font-semibold text-gray-900 mt-6 relative z-10 group/cta text-base">
                Explore Courses <span className="bg-gray-100 w-7 h-7 rounded-full flex items-center justify-center group-hover/cta:bg-accent-secondary group-hover/cta:text-white transition-colors duration-300"><i className="fa-solid fa-arrow-right text-[10px]"></i></span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* AI Feedback Loop Section */}
      <section className="py-[120px] bg-white border-y border-black/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center fade-in-up">
            <div>
              <h2 className="text-4xl mb-4 text-gray-900 font-outfit">The Ultimate AI Feedback Loop</h2>
              <p className="text-lg text-gray-600 mb-10">
                We turn rejection into your biggest advantage. Our system continuously learns from your performance to refine your strategy.
              </p>
              <ul className="flex flex-col gap-6">
                <li className="flex items-start gap-4 text-lg text-gray-600">
                  <i className="fa-solid fa-circle-xmark text-accent-primary text-2xl mt-0.5"></i>
                  <div><strong className="text-gray-900">Identify Gaps:</strong> AI analyzes why you might be getting rejected.</div>
                </li>
                <li className="flex items-start gap-4 text-lg text-gray-600">
                  <i className="fa-solid fa-wand-magic text-accent-primary text-2xl mt-0.5"></i>
                  <div><strong className="text-gray-900">Smart Suggestions:</strong> Get targeted resume tweaks and skill goals.</div>
                </li>
                <li className="flex items-start gap-4 text-lg text-gray-600">
                  <i className="fa-solid fa-book-open text-accent-primary text-2xl mt-0.5"></i>
                  <div><strong className="text-gray-900">Rapid Learning:</strong> Take recommended courses to fix weaknesses.</div>
                </li>
                <li className="flex items-start gap-4 text-lg text-gray-600">
                  <i className="fa-solid fa-rocket text-accent-primary text-2xl mt-0.5"></i>
                  <div><strong className="text-gray-900">Continuous Improvement:</strong> Apply again with a massively higher success rate.</div>
                </li>
              </ul>
            </div>
            <div className="relative h-[400px] flex items-center justify-center">
              <div className="w-[300px] h-[300px] border-2 border-dashed border-black/10 rounded-full relative animate-rotate">
                <div className="absolute w-[100px] h-[100px] bg-white border border-accent-primary/20 rounded-full flex items-center justify-center font-semibold text-sm shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] text-accent-primary -top-[50px] left-[100px] animate-counter-rotate">
                  Analysis
                </div>
                <div className="absolute w-[100px] h-[100px] bg-white border border-[#10b981]/20 rounded-full flex items-center justify-center font-semibold text-sm shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] text-[#10b981] bottom-[20px] -right-[30px] animate-counter-rotate">
                  Learning
                </div>
                <div className="absolute w-[100px] h-[100px] bg-white border border-[#f59e0b]/20 rounded-full flex items-center justify-center font-semibold text-sm shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] text-[#f59e0b] bottom-[20px] -left-[30px] animate-counter-rotate">
                  Improvement
                </div>
                <div className="center-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-[120px] text-center relative overflow-hidden fade-in-up">
        <div className="cta-glow"></div>
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <h2 className="text-[3.5rem] mb-6 text-gray-900 font-outfit leading-tight">
            Your dream job is waiting. <br />Let's go get it.
          </h2>
          <p className="text-xl text-gray-600 mb-10">
            Join thousands of jobseekers who have transformed their careers with SAASA B2E.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/whatsapp"
              className="px-7 py-3.5 rounded-full font-medium text-base text-white bg-gradient-to-br from-accent-primary to-accent-secondary shadow-[0_4px_14px_0_rgba(79,70,229,0.25)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 transition inline-flex items-center justify-center gap-2"
            >
              Upload Resume to Start
            </Link>
            <Link
              href="/whatsapp"
              className="px-7 py-3.5 rounded-full font-medium text-base border border-gray-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)] hover:bg-gray-100 transition inline-flex items-center justify-center gap-2"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
