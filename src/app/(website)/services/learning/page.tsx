"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, PlayCircle, Target, Mic2, FileText, ArrowUpRight, GraduationCap, Laptop, BookOpen, PenTool, Lightbulb, Star, ShieldCheck } from "lucide-react";

const HIGHLIGHTS = [
  { 
    title: "React Patterns for Interviews", 
    tag: "Intermediate", 
    icon: PlayCircle, 
    color: "blue", 
    desc: "Master common coding patterns used in senior engineering interviews at top tech firms." 
  },
  { 
    title: "System Design Frameworks", 
    tag: "Advanced", 
    icon: Target, 
    color: "rose", 
    desc: "A exhaustive guide to architecting scalable systems from scratch with real-world case studies." 
  },
  { 
    title: "Storytelling for PMs", 
    tag: "Beginner", 
    icon: Mic2, 
    color: "amber", 
    desc: "Learn to communicate your product vision with clarity and influence using narrative-driven techniques." 
  },
  { 
    title: "Resume Teardowns", 
    tag: "Workshop", 
    icon: FileText, 
    color: "emerald", 
    desc: "Weekly live sessions where we analyze and refactor real resumes for maximum impact." 
  },
];

export default function LmsServicePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white">
      <main>
        {/* Learning Hero Section */}
        <section className="relative pt-44 pb-20 overflow-hidden bg-slate-950 text-white rounded-b-[60px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_50%)]" />
          
          <div className="mx-auto max-w-[1240px] px-6 relative z-10 text-center lg:text-left">
            <div className="grid lg:grid-cols-[1.2fr_1fr] gap-20 items-center">
              <div className="animate-in fade-in slide-in-from-left-8 duration-700">
                <div className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-5 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-sky-300 mb-8 mx-auto lg:mx-0">
                  <GraduationCap className="mr-3 h-4 w-4" /> Integrated Upskilling
                </div>
                <h1 className="text-5xl lg:text-[72px] font-black mb-8 tracking-tight leading-[0.95] text-white">
                  Turn rejections <br /> 
                  <span className="text-sky-400">into roadmaps.</span>
                </h1>
                <p className="text-slate-400 text-xl leading-relaxed mb-12 font-medium max-w-xl mx-auto lg:mx-0">
                  We don't just tell you what's missing. We give you the structured learning path to acquire it. Access targeted technical courses and interview prep effortlessly.
                </p>

                <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                  <button
                    onClick={() => router.push('/whatsapp')}
                    className="bg-white text-slate-950 font-black px-10 py-5 rounded-2xl hover:bg-sky-50 transition-all shadow-2xl active:scale-95 text-[17px] flex items-center justify-center gap-2"
                  >
                    Start Learning <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => router.push('/whatsapp')}
                    className="bg-slate-900 border border-white/10 text-white font-bold px-10 py-5 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 text-[17px]"
                  >
                    Browse Courses
                  </button>
                </div>
              </div>

              {/* Course Preview Cards - Breaking the "Image" look with interactive floating stats */}
              <div className="hidden lg:block relative group">
                 <div className="absolute -inset-4 bg-sky-500/10 rounded-[48px] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                 <div className="relative space-y-6">
                    <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-8 rounded-[32px] shadow-2xl rotate-2 transition-transform hover:rotate-0">
                       <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 rounded-2xl bg-sky-400/20 text-sky-400 flex items-center justify-center">
                             <PlayCircle className="w-6 h-6" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-sky-400 uppercase tracking-widest">Enrolled Now</p>
                             <p className="text-2xl font-black text-white">4,200+ Students</p>
                          </div>
                       </div>
                       <p className="text-slate-400 font-medium italic">"The React Interview patterns alone landed me 3 final rounds."</p>
                    </div>

                    <div className="bg-slate-900 border border-white/10 p-6 rounded-[32px] shadow-2xl -rotate-1 hover:rotate-0 transition-transform flex items-center gap-6">
                       <div className="flex -space-x-3">
                          {[1,2,3,4].map(i => (
                             <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-950 bg-slate-800" />
                          ))}
                       </div>
                       <p className="text-sm font-bold text-slate-300">Join the elite community of tech leaders</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Structured Outcome Section */}
         <section className="py-24 bg-white">
           <div className="mx-auto max-w-[1240px] px-6">
              <div className="text-center max-w-3xl mx-auto mb-20">
                 <h2 className="text-4xl lg:text-5xl font-black text-slate-950 mb-6 tracking-tight">Structured for outcome.</h2>
                 <p className="text-lg text-slate-500 font-medium leading-relaxed">
                   Our curriculum isn't just about knowledge—it's about landing the role. Every course is mapped to specific industry skill gaps discovered by our AI.
                 </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
                 {[
                   { title: "Live Bootcamps", desc: "Intense weekend sessions with industry veterans.", icon: Laptop },
                   { title: "Curated Tracks", desc: "From Zero to DevOps or Senior PM, we map it all.", icon: BookOpen },
                   { title: "Project Labs", desc: "Build real-world artifacts for your portfolio.", icon: PenTool },
                   { title: "Expert Support", desc: "Get unstuck with 24/7 access to our domain labs.", icon: Lightbulb }
                 ].map((item, i) => (
                    <div key={i} className="text-left group cursor-default">
                       <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mb-6 group-hover:bg-slate-950 group-hover:text-white transition-all shadow-sm group-hover:scale-110">
                          <item.icon className="w-6 h-6" />
                       </div>
                       <h3 className="text-xl font-bold text-slate-950 mb-3">{item.title}</h3>
                       <p className="text-slate-500 font-medium leading-relaxed text-[15px]">{item.desc}</p>
                    </div>
                 ))}
              </div>
           </div>
         </section>

         {/* Trending Courses - Professional Grid */}
         <section className="py-24 bg-slate-50/50 border-y border-slate-100">
           <div className="mx-auto max-w-[1240px] px-6">
              <div className="flex flex-col sm:flex-row justify-between items-end mb-16 gap-6">
                 <div>
                    <h2 className="text-3xl lg:text-4xl font-black text-slate-950 tracking-tight">Trending Skills Decoded</h2>
                    <p className="text-slate-500 font-medium mt-2">Master the tools that recruiters are searching for right now.</p>
                 </div>
                 <button onClick={() => router.push('/whatsapp')} className="text-sky-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
                    View All Courses <ChevronRight className="w-4 h-4" />
                 </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {HIGHLIGHTS.map((course, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-[32px] p-8 hover:shadow-xl transition-all flex flex-col md:flex-row gap-8 items-start group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 transition-transform group-hover:scale-150 -z-0" />
                    
                    <div className="relative z-10 w-20 h-20 shrink-0 rounded-[24px] bg-slate-950 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                       <course.icon className="w-10 h-10" />
                    </div>
                    <div className="relative z-10 flex-1">
                       <div className="flex items-center gap-3 mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100">{course.tag}</span>
                          <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9</span>
                       </div>
                       <h3 className="text-2xl font-black text-slate-950 mb-4 tracking-tight leading-tight group-hover:text-sky-600 transition-colors">{course.title}</h3>
                       <p className="text-slate-500 font-medium leading-relaxed mb-8">{course.desc}</p>
                       <button onClick={() => router.push('/whatsapp')} className="w-full py-4 bg-slate-50 border border-slate-200 text-slate-900 font-bold rounded-2xl hover:bg-slate-950 hover:text-white hover:border-slate-950 transition-all flex items-center justify-center gap-2">
                          Join Course <ArrowUpRight className="w-4 h-4" />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
           </div>
         </section>

         {/* Final CTA Strip */}
         <section className="py-32 bg-white">
            <div className="mx-auto max-w-[1000px] px-6 text-center">
               <div className="bg-sky-50 rounded-[48px] p-12 lg:p-20 relative overflow-hidden border border-sky-100">
                  <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-sky-400/10 rounded-full blur-[100px]" />
                  
                  <h2 className="text-4xl lg:text-5xl font-black text-slate-950 mb-8 tracking-tight relative z-10">
                    Your growth starts <br /> with a shared <span className="text-sky-600">roadmap.</span>
                  </h2>
                  <p className="text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto relative z-10">
                    Join 50,000+ candidates who have bridge their skill gaps and secured roles at top-tier companies.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 relative z-10">
                    <button
                      onClick={() => router.push('/whatsapp')}
                      className="bg-slate-950 text-white font-black px-12 py-5 rounded-2xl hover:bg-slate-800 transition-all shadow-xl active:scale-95 text-[17px] w-full sm:w-auto"
                    >
                      Get Started Free
                    </button>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-400">
                       <ShieldCheck className="w-5 h-5 text-emerald-500" />
                       Expert Verified Content
                    </div>
                  </div>
               </div>
            </div>
         </section>
      </main>
    </div>
  );
}
