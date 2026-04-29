'use client';

import { useState } from 'react';
import WebsiteNavbar from '@/app/(website)/_components/Navbar';
import Footer from '@/components/common/Footer';
import { 
  ChevronDown, 
  Search, 
  FileText, 
  UserCheck, 
  BrainCircuit, 
  ShieldCheck, 
  Briefcase, 
  HelpCircle,
  Mail,
  Clock
} from 'lucide-react';

const FAQS = [
  {
    category: "Getting Started",
    icon: <UserCheck className="w-5 h-5 text-sky-500" />,
    questions: [
      {
        id: "verify",
        q: "How do I verify my account?",
        a: "We use a secure passwordless system via WhatsApp. Enter your WhatsApp number and email, and we'll send a 6-digit verification code to your email. Once verified, you're ready to build your profile."
      },
      {
        id: "profile-complete",
        q: "Why should I complete my profile?",
        a: "A complete profile gives our AI engine more data to work with. Candidates with 100% complete profiles are 3x more likely to get matched with high-tier opportunities."
      }
    ]
  },
  {
    category: "Resume & AI Matching",
    icon: <BrainCircuit className="w-5 h-5 text-emerald-500" />,
    questions: [
      {
        id: "upload-resume",
        q: "Do I need to upload my resume?",
        a: "Yes. Uploading your resume is the first step for our AI to understand your experience. We analyze your skills, achievements, and career trajectory to match you with jobs that actually fit your profile."
      },
      {
        id: "ats-score",
        q: "What is an ATS Match Score?",
        a: "The ATS (Applicant Tracking System) Match Score is our AI's calculation of how well your profile aligns with a specific job description. A score above 80% indicates an exceptional fit."
      },
      {
        id: "cv-analysis",
        q: "How does CV Analysis work?",
        a: "Our AI 'reads' your resume like a human recruiter would, but faster. It extracts skills, detects career gaps, and highlights your strongest achievements to make your profile stand out to employers."
      }
    ]
  },
  {
    category: "Job Applications",
    icon: <Briefcase className="w-5 h-5 text-purple-500" />,
    questions: [
      {
        id: "apply",
        q: "How do I apply for jobs?",
        a: "Once your profile is set up, you can browse matched jobs on your dashboard. Simply click 'Quick Apply' on any job that interests you. Your AI-optimized profile will be sent directly to the employer."
      },
      {
        id: "track",
        q: "Can I track my application status?",
        a: "Absolutely. Your dashboard has an 'Applications' tab where you can see the real-time status of every job you've applied for—from 'Under Review' to 'Interview' and 'Offer'."
      }
    ]
  },
  {
    category: "Dashboard & Tools",
    icon: <FileText className="w-5 h-5 text-indigo-500" />,
    questions: [
      {
        id: "cv-editor",
        q: "How do I use the AI Resume Editor?",
        a: "Navigate to the 'CV Editor' section. You can either upload an existing resume to optimize it or build one from scratch. Our AI will suggest improvements for your bullet points, skills, and overall layout to maximize your match score."
      },
      {
        id: "dashboard-stats",
        q: "What do the dashboard statistics mean?",
        a: "Your dashboard tracks 'Profile Completeness' (data richness), 'CV Score' (resume quality), and 'Market Fit' (how in-demand your skills are). High scores in all three areas significantly improve your job matching results."
      }
    ]
  },
  {
    category: "Privacy & Data",
    icon: <ShieldCheck className="w-5 h-5 text-amber-500" />,
    questions: [
      {
        id: "data-use",
        q: "How is my data used?",
        a: "Your data is used exclusively to build your professional profile and match you with employers. We do not sell your personal information to third-party advertisers. Please refer to our Privacy Policy for more details."
      },
      {
        id: "security",
        q: "Is my personal information secure?",
        a: "Yes. We use industry-standard encryption and secure cloud infrastructure to protect your documents and personal details. Your contact information is only shared with employers when you choose to apply for their roles."
      }
    ]
  }
];

export default function HelpPage() {
  const [openId, setOpenId] = useState<string | null>("upload-resume");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleFaq = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const filteredFaqs = FAQS.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <WebsiteNavbar />
      
      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-sky-50 text-sky-600 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-sky-100">
            <HelpCircle className="w-4 h-4" />
            Support Center
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">
            How can we <span className="text-sky-500">help you</span> today?
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium">
            Find answers to common questions about our AI hiring platform, 
            profile optimization, and job application process.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              placeholder="Search for articles or questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-16 pl-14 pr-6 rounded-2xl border border-slate-200 bg-white shadow-sm focus:ring-4 focus:ring-sky-100 focus:border-sky-400 outline-none transition-all text-slate-700 font-medium placeholder:text-slate-400"
            />
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <div className="space-y-12">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((category, catIdx) => (
              <div key={catIdx} className="space-y-6">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0">
                    {category.icon}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">{category.category}</h2>
                </div>
                
                <div className="grid gap-4">
                  {category.questions.map((faq) => (
                    <div 
                      key={faq.id} 
                      className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
                        openId === faq.id 
                          ? 'bg-white border-sky-200 shadow-md ring-1 ring-sky-100' 
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <button 
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left gap-4"
                      >
                        <span className={`text-[16px] font-bold transition-colors ${
                          openId === faq.id ? 'text-sky-600' : 'text-slate-700'
                        }`}>
                          {faq.q}
                        </span>
                        <div className={`p-1 rounded-full transition-all duration-300 ${
                          openId === faq.id ? 'bg-sky-50 text-sky-500 rotate-180' : 'bg-slate-50 text-slate-400'
                        }`}>
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </button>
                      
                      <div 
                        className={`transition-all duration-300 ease-in-out ${
                          openId === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <div className="px-6 pb-6 pt-0">
                          <div className="w-full h-px bg-slate-100 mb-4" />
                          <p className="text-slate-500 text-[15px] leading-relaxed font-medium">
                            {faq.a}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No matches found</h3>
              <p className="text-slate-500 font-medium">Try searching for different keywords or browse categories.</p>
              <button 
                onClick={() => setSearchQuery("")}
                className="mt-6 text-sky-600 font-bold hover:underline"
              >
                Clear search
              </button>
            </div>
          )}
        </div>

        {/* Contact Strip */}
        <section className="mt-20 p-8 sm:p-10 rounded-[32px] bg-slate-900 relative overflow-hidden text-center sm:text-left">
          {/* Atmosphere */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">Still need help?</h2>
              <p className="text-slate-400 font-medium max-w-md">
                Our support team is available to assist you with any technical issues or career guidance.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-6 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl w-full sm:w-auto">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 text-white font-bold mb-0.5">
                    <Mail className="w-4 h-4 text-sky-400" />
                    support@hryantra.com
                  </div>
                  <div className="flex items-center gap-2 text-[13px] text-slate-500 font-bold uppercase tracking-wider">
                    <Clock className="w-3.5 h-3.5" />
                    24H Response Time
                  </div>
                </div>
              </div>
              <a 
                href="mailto:support@hryantra.com"
                className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-[15px] hover:bg-slate-100 transition-all w-full sm:w-auto text-center"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
