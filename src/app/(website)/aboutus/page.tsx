"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

import { Eye, Zap, Sparkles } from "lucide-react";

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

  .animate-float { animation: float 6s ease-in-out infinite; }
`;

export default function AboutUsPage() {
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
    <div className="relative min-h-screen bg-[#fcfcfd] text-[#111827] font-inter overflow-x-hidden pt-16">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="hero-bg-glow"></div>

      <section className="max-w-7xl mx-auto px-6 relative z-10 py-20">
        <div className="text-center mb-20 fade-in-up">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight text-gray-900">
            About <span className="gradient-text">HRYANTRA</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            We are on a mission to bridge the gap between world-class talent and leading employers through AI-driven intelligence and human-centric design.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center mb-32">
          <div className="fade-in-up">
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Our Story</h2>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Founded in 2024, HRYANTRA (by SAASA B2E) emerged from a simple observation: the traditional job search process is broken. Resume filtering is often arbitrary, and candidates struggle to understand why they aren't being shortlisted.
            </p>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              We decided to build an ecosystem that empowers the candidate. By using the same AI technology that large corporations use to filter applicants, we give you the tools to optimize your profile, upskill your talents, and walk into interviews with absolute confidence.
            </p>
            <div className="flex gap-4">
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="text-2xl font-bold text-accent-primary mb-1">50k+</div>
                <div className="text-sm text-gray-500 font-medium">Active Users</div>
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <div className="text-2xl font-bold text-accent-secondary mb-1">1M+</div>
                <div className="text-sm text-gray-500 font-medium">Scans Completed</div>
              </div>
            </div>
          </div>
          <div className="relative fade-in-up [transition-delay:200ms]">
            <div className="aspect-square bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[3rem] relative overflow-hidden shadow-2xl flex items-center justify-center">
              <div className="relative w-64 h-64 animate-float">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-full scale-110"></div>
                <div className="relative h-full w-full p-12">
                   <Image 
                    src="/SAASA%20Logo.png" 
                    alt="SAASA B2E Logo" 
                    fill 
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="absolute top-10 right-10 w-20 h-20 bg-accent-secondary/20 rounded-2xl blur-xl"></div>
              <div className="absolute bottom-10 left-10 w-32 h-32 bg-accent-primary/20 rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {[
            {
              title: "Transparency",
              desc: "We believe candidates deserve to know how they are being evaluated.",
              icon: Eye,
              color: "text-blue-500",
              bg: "bg-blue-50"
            },
            {
              title: "Empowerment",
              desc: "Our tools are designed to give you the upper hand in a competitive market.",
              icon: Zap,
              color: "text-purple-500",
              bg: "bg-purple-50"
            },
            {
              title: "Innovation",
              desc: "We constantly refine our AI to stay ahead of changing recruitment trends.",
              icon: Sparkles,
              color: "text-pink-500",
              bg: "bg-pink-50"
            }
          ].map((item, i) => (
            <div key={item.title} className={`p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm fade-in-up`} style={{ transitionDelay: `${i * 100}ms` }}>
              <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-xl flex items-center justify-center mb-6`}>
                <item.icon size={24} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 rounded-[3rem] p-12 text-center relative overflow-hidden fade-in-up">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-accent-primary/10 blur-[100px] rounded-full"></div>
           <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to start your success story?</h2>
              <p className="text-gray-400 mb-10 max-w-xl mx-auto">Join thousands of professionals who have already transformed their careers using our platform.</p>
              <Link href="/whatsapp" className="px-10 py-4 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition-all inline-block">
                Get Started for Free
              </Link>
           </div>
        </div>
      </section>
    </div>
  );
}
