"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { API_BASE_URL, getApiBaseUrl } from "@/lib/api-base";
import {
  Search, MapPin, ChevronRight, PlayCircle, Star, ArrowRight, CheckCircle2,
  Sparkles, Award, FileText, Target, Mic2, UploadCloud, Zap, Clock, Briefcase,
  Map, UserRound, GraduationCap, ArrowUpRight, Building,
  Wifi, Landmark, BarChart2, Package, Trophy, BookOpen,
  Code2, TrendingUp, BadgeDollarSign, ClipboardList, Cpu, BrainCircuit,
  Home, Building2, Users, Database
} from "lucide-react";

// Mock Services data to resolve build error
const SERVICES = [
  {
    id: "resume-review",
    title: "AI Resume Optimization",
    shortDescription: "Get a professional review of your resume backed by industry experts and AI-driven ATS targeting.",
    iconKey: "file-pen-line",
  },
  {
    id: "mock-interview",
    title: "Mock Interview Series",
    shortDescription: "Practice your technical and behavioral interviewing skills with a verified industry professional.",
    iconKey: "scan-search",
  },
  {
    id: "career-coaching",
    title: "Executive Coaching",
    shortDescription: "Work 1-on-1 with a senior career coach to map your precise trajectory and hit your professional goals.",
    iconKey: "target",
  }
];

// ----------------------------------------------------------------------
// 1. TYPES & HELPERS

// ----------------------------------------------------------------------
interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  workStyle: string; // Remote, Hybrid, Onsite
  type: string;
  salary: string;
  match: string;
  timeAgo: string;
  logo: string;
  experience: string;
}

const getSuggestionLabel = (suggestion: any) =>
  suggestion?.title ||
  suggestion?.name ||
  suggestion?.label ||
  suggestion?.value ||
  suggestion?.query ||
  "";

/**
 * Returns a numeric match score. Higher = better match.
 * 3 = label starts with query (exact prefix)
 * 2 = a word inside label starts with query
 * 1 = label contains query anywhere
 * 0 = no match (exclude)
 */
const scoreMatch = (label: string, query: string): number => {
  if (!query || !label) return 0;
  const l = label.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  if (l.startsWith(q)) return 3;
  // Check if any word inside the label starts with the query
  if (l.split(/[\s,\/\-_]+/).some(w => w.startsWith(q))) return 2;
  if (l.includes(q)) return 1;
  return 0;
};

/**
 * Highlights the matched portion of `label` with a <mark>.
 * Returns an array of spans safe for React rendering.
 */
const HighlightMatch = ({ label, query }: { label: string; query: string }) => {
  if (!query.trim()) return <>{label}</>;
  const idx = label.toLowerCase().indexOf(query.toLowerCase().trim());
  if (idx === -1) return <>{label}</>;
  return (
    <>
      {label.slice(0, idx)}
      <span className="font-black text-sky-600">{label.slice(idx, idx + query.trim().length)}</span>
      {label.slice(idx + query.trim().length)}
    </>
  );
};

const buildSearchJobsUrl = (title: string, location: string) => {
  const params = new URLSearchParams();
  const normalizedTitle = title.trim();
  const normalizedLocation = location.trim();

  if (normalizedTitle) params.append("q", normalizedTitle);
  if (normalizedLocation) params.append("location", normalizedLocation);

  return params.toString() ? `/searchjobs?${params.toString()}` : "/searchjobs";
};

const formatTimeAgo = (date: Date | string): string => {
  const now = new Date();
  const postedDate = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = now.getTime() - postedDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Just now';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
  return `${Math.floor(diffInDays / 30)}mo ago`;
};

const formatSalary = (min: number | null, max: number | null, currency: string | null, type: string | null): string => {
  if (!min && !max) return 'Salary unspecified';
  const sym = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency || '$';
  const typeLabel = type === 'ANNUAL' ? '/yr' : '/mo';

  if (min && max) return `${sym}${(min / 1000)}k - ${sym}${(max / 1000)}k${typeLabel}`;
  if (min) return `${sym}${(min / 1000)}k+${typeLabel}`;
  return `${sym}${(max! / 1000)}k${typeLabel}`;
};

// ----------------------------------------------------------------------
// 2. AUTH INTERCEPT MODAL
// ----------------------------------------------------------------------
function AuthInterceptModal({
  isOpen,
  onClose,
  title,
  description,
  redirectUrl
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  redirectUrl: string;
}) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleContinue = () => {
    sessionStorage.setItem("postLoginRedirect", redirectUrl);
    router.push("/whatsapp");
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-[24px] bg-white shadow-2xl ring-1 ring-slate-900/5 transition-all outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 mb-5">
            <svg className="h-7 w-7 text-sky-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h2 className="text-center text-2xl font-bold text-slate-900 mb-3 tracking-tight">{title}</h2>
          <p className="text-center text-[15px] font-medium text-slate-500 mb-8 leading-relaxed">{description}</p>

          <div className="space-y-3">
            <button
              onClick={handleContinue}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#28A8DF] py-3.5 px-4 text-[15px] font-semibold text-white shadow-sm hover:bg-[#1f97cb] transition-all"
            >
              Continue with WhatsApp
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-xl py-3.5 px-4 text-[15px] font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 3. MAIN PAGE COMPONENT
// ----------------------------------------------------------------------
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobListing[]>([
    { id: '1', title: 'Senior Research Scientist', company: 'Pfizer', location: 'Mumbai, IN', workStyle: 'Hybrid', type: 'Full-time', salary: '$140k - $175k/yr', match: '94% Match', timeAgo: '2h ago', experience: 'Senior level', logo: '' },
    { id: '2', title: 'Payments Infrastructure Engineer', company: 'Stripe', location: 'Bangalore, IN', workStyle: 'Remote', type: 'Full-time', salary: '$165k - $210k/yr', match: '88% Match', timeAgo: '5h ago', experience: 'Mid level', logo: '' },
    { id: '3', title: 'Global Supply Chain Manager', company: 'DHL Logistics', location: 'Douala, CM', workStyle: 'Onsite', type: 'Full-time', salary: '$110k - $145k/yr', match: '85% Match', timeAgo: '1d ago', experience: 'Senior level', logo: '' },
    { id: '4', title: 'Investment Banking Analyst', company: 'Goldman Sachs', location: 'London, UK', workStyle: 'Hybrid', type: 'Full-time', salary: '$95k - $130k/yr', match: '96% Match', timeAgo: '1d ago', experience: 'Entry level', logo: '' },
    { id: '5', title: 'Clinical Solutions Architect', company: 'UnitedHealth Group', location: 'Yaoundé, CM', workStyle: 'Remote', type: 'Contract', salary: '$120k+ /yr', match: '81% Match', timeAgo: '2d ago', experience: 'Mid level', logo: '' },
    { id: '6', title: 'Staff Software Engineer', company: 'Google Cloud', location: 'Hyderabad, IN', workStyle: 'Hybrid', type: 'Full-time', salary: '$190k - $250k/yr', match: '89% Match', timeAgo: '3d ago', experience: 'Senior level', logo: '' },
  ]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [heroSearch, setHeroSearch] = useState({ title: '', location: '' });
  const [searchMode, setSearchMode] = useState<'search' | 'ai'>('search');

  // Suggestions State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [locSuggestions, setLocSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authConfig, setAuthConfig] = useState({ title: "", description: "", redirectUrl: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadJobs();
  }, []);

  // Debounced Search Suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (heroSearch.title.length >= 2 && searchMode === 'search') {
        try {
          setIsSuggesting(true);
          const res = await fetch(`${getApiBaseUrl()}/jobs/recommend?q=${encodeURIComponent(heroSearch.title)}`);
          if (res.ok) {
            const result = await res.json();
            const rawSuggestions = Array.isArray(result.data) ? result.data : [];
            const dbOnlySuggestions = rawSuggestions
              .filter((item: any) => {
                if (!item) return false;
                if (item.isAiSuggestion || item.isAi) return false;
                const label = getSuggestionLabel(item);
                if (!String(label || '').trim()) return false;
                // Only keep suggestions that actually match the typed characters
                return scoreMatch(String(label), heroSearch.title) > 0;
              })
              .sort((a: any, b: any) => {
                const scoreA = scoreMatch(String(getSuggestionLabel(a)), heroSearch.title);
                const scoreB = scoreMatch(String(getSuggestionLabel(b)), heroSearch.title);
                return scoreB - scoreA; // highest score first
              })
              .slice(0, 8); // cap at 8 suggestions
            setSuggestions(dbOnlySuggestions);
            if (document.activeElement === titleInputRef.current) {
              setShowSuggestions(dbOnlySuggestions.length > 0);
            }
          }
        } catch (err) {
          console.error("Suggestion fetch failed", err);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsSuggesting(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [heroSearch.title, searchMode]);

  // Debounced Location Suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (heroSearch.location.length >= 1 && searchMode === 'search') {
        try {
          const res = await fetch(`${getApiBaseUrl()}/jobs/location-recommend?q=${encodeURIComponent(heroSearch.location)}`);
          if (res.ok) {
            const result = await res.json();
            const rawLocationSuggestions = Array.isArray(result.data) ? result.data : [];
            const dbOnlyLocationSuggestions = rawLocationSuggestions
              .filter((item: any) => {
                if (!item) return false;
                if (item.isAiSuggestion || item.isAi) return false;
                const label = getSuggestionLabel(item);
                if (!String(label || '').trim()) return false;
                return scoreMatch(String(label), heroSearch.location) > 0;
              })
              .sort((a: any, b: any) => {
                const scoreA = scoreMatch(String(getSuggestionLabel(a)), heroSearch.location);
                const scoreB = scoreMatch(String(getSuggestionLabel(b)), heroSearch.location);
                return scoreB - scoreA;
              })
              .slice(0, 6);
            setLocSuggestions(dbOnlyLocationSuggestions);
            if (document.activeElement === locationInputRef.current) {
              setShowLocSuggestions(dbOnlyLocationSuggestions.length > 0);
            }
          }
        } catch (err) {
          console.error("Loc suggestion fetch failed", err);
          setLocSuggestions([]);
          setShowLocSuggestions(false);
        }
      } else {
        setLocSuggestions([]);
        setShowLocSuggestions(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [heroSearch.location, searchMode]);

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const res = await fetch(`${API_BASE_URL}/jobs?limit=6`);
      if (res.ok) {
        const result = await res.json();
        const rawJobs = result?.data?.jobs || result?.data?.data || result?.data?.items || [];

        if (rawJobs.length > 0) {
          const formatted = rawJobs.slice(0, 6).map((job: any) => ({
            id: job.id || job._id,
            title: job.title || 'Job Title',
            company: job.client?.companyName || job.company || 'Company Name',
            location: job.location || 'Location not specified',
            workStyle: job.location?.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
            type: job.type === 'FULL_TIME' ? 'Full-time' : job.type === 'CONTRACT' ? 'Contract' : 'Part-time',
            salary: formatSalary(job.salary?.min ?? job.salaryMin, job.salary?.max ?? job.salaryMax, null, null),
            match: `${Math.floor(Math.random() * 10) + 85}% Match`,
            timeAgo: formatTimeAgo(job.postedDate || new Date()),
            experience: 'Mid-Senior level',
            logo: job.client?.logo || job.companyLogo || '',
          }));
          setJobs(formatted);
        }
      }
    } catch (err) {
      console.error("Failed to fetch jobs for homepage", err);
    } finally {
      setLoadingJobs(false);
    }
  };

  const triggerGatedAction = (title: string, description: string, redirectUrl: string) => {
    if (isAuthenticated) {
      router.push(redirectUrl);
    } else {
      setAuthConfig({ title, description, redirectUrl });
      setIsAuthModalOpen(true);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch();
  };

  const triggerSearch = () => {
    if (searchMode === 'ai') {
      router.push('/whatsapp');
      return;
    }
    router.push(buildSearchJobsUrl(heroSearch.title, heroSearch.location));
  };

  const preventEnterSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const applyTitleSuggestion = (value: string, shouldSearch = false) => {
    const normalizedValue = value.trim();
    setHeroSearch(prev => ({ ...prev, title: normalizedValue }));
    setShowSuggestions(false);

    requestAnimationFrame(() => {
      titleInputRef.current?.focus();
      titleInputRef.current?.setSelectionRange(normalizedValue.length, normalizedValue.length);
    });

    if (shouldSearch) {
      router.push(buildSearchJobsUrl(normalizedValue, heroSearch.location));
    }
  };

  const applyLocationSuggestion = (value: string, shouldSearch = false) => {
    const normalizedValue = value.trim();
    setHeroSearch(prev => ({ ...prev, location: normalizedValue }));
    setShowLocSuggestions(false);

    requestAnimationFrame(() => {
      locationInputRef.current?.focus();
      locationInputRef.current?.setSelectionRange(normalizedValue.length, normalizedValue.length);
    });

    if (shouldSearch) {
      router.push(buildSearchJobsUrl(heroSearch.title, normalizedValue));
    }
  };

  const rotatingWords = ["Job Title", "Skills", "Company", "Roles", "Keywords", "Specific Field"];
  const rotatingLocations = ["City, State", "Remote Friendly", "USA", "India", "UK", "Remote", "International"];
  const rotatingAIPrompts = [
    "Show me jobs for fresher React developer in Mumbai",
    "Digital Marketing roles in New York for remote work",
    "Graphic Design jobs in London with 2+ years exp",
    "High paying Finance jobs in Dubai for seniors",
    "Junior HR Manager roles in Singapore",
    "Data Scientist jobs in San Francisco (Hybrid)"
  ];
  const [wordIndex, setWordIndex] = useState(0);
  const [locIndex, setLocIndex] = useState(0);

  // Job and AI Prompt interval (standard)
  useEffect(() => {
    const interval = setInterval(() => {
      setWordIndex((prev) => (prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLocIndex(1);
      const interval = setInterval(() => {
        setLocIndex((prev) => (prev + 1));
      }, 3000);
      return () => clearInterval(interval);
    }, 1500);
    return () => clearTimeout(timeout);
  }, []);

  const TechCircuit = () => (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 transition-opacity duration-1000 ${searchMode === 'ai' ? 'opacity-40' : 'opacity-50'
        }`}
      style={{
        maskImage: 'radial-gradient(circle at center, transparent 15%, black 85%)',
        WebkitMaskImage: 'radial-gradient(circle at center, transparent 15%, black 85%)'
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
        <defs>
          <filter id="aiGlow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Circuit Lines */}
        {[
          "M0,200 L400,200 L500,100 L1440,100",
          "M0,400 L300,400 L450,550 L1000,550 L1150,400 L1440,400",
          "M0,600 L600,600 L750,450 L1440,450",
          "M0,100 L200,100 L350,250 L800,250 L950,100 L1440,100",
          "M1440,700 L1000,700 L800,500 L0,500"
        ].map((path, i) => (
          <g key={i}>
            {/* Background Path */}
            <path d={path} stroke={searchMode === 'ai' ? '#7c2d12' : '#cbd5e1'} strokeWidth="0.3" fill="none" opacity="0.15" />
            {/* Animated Progress Path */}
            <path
              key={`${searchMode}-${i}`}
              d={path}
              stroke={searchMode === 'ai' ? '#ea580c' : '#39ade2'}
              strokeWidth="0.6"
              fill="none"
              strokeDasharray="2000, 2000"
              className="animate-circuit-fill"
              filter="url(#aiGlow)"
              style={{ animationDelay: `${i * 0.6}s` }}
            />
            {/* Nodes */}
            <circle cx={400} cy={200} r="1.5" fill={searchMode === 'ai' ? "#ea580c" : "#39ade2"} opacity="0.3" />
            <circle cx={500} cy={100} r="1.5" fill={searchMode === 'ai' ? "#ea580c" : "#39ade2"} opacity="0.3" />
            <circle cx={600} cy={600} r="1.5" fill={searchMode === 'ai' ? "#ea580c" : "#39ade2"} opacity="0.3" />
            <circle cx={750} cy={450} r="1.5" fill={searchMode === 'ai' ? "#ea580c" : "#39ade2"} opacity="0.3" />
          </g>
        ))}
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen font-sans bg-[#FCFDFE] flex flex-col overflow-x-hidden">
      {/* Rolling Cube Style */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes slideAndStay {
            0% { transform: translateY(100%) rotateX(-90deg); opacity: 0; }
            14% { transform: translateY(0) rotateX(0deg); opacity: 1; }
            86% { transform: translateY(0) rotateX(0deg); opacity: 1; }
            100% { transform: translateY(-100%) rotateX(90deg); opacity: 0; }
          }
          @keyframes circuitFill {
            0% { stroke-dashoffset: 2000; }
            100% { stroke-dashoffset: 0; }
          }
          .animate-circuit-fill {
            animation: circuitFill 10s cubic-bezier(0.19, 1, 0.22, 1) forwards;
          }
          .rolling-text {
            display: inline-block;
            perspective: 1200px;
            height: 1.5em;
            overflow: hidden;
            vertical-align: middle;
            width: 100%;
            text-align: left;
          }
          .rolling-word {
            display: block;
            animation: slideAndStay 3s cubic-bezier(0.19, 1, 0.22, 1) forwards;
            transform-origin: left center -10px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            text-align: left;
          }
          @keyframes scrollRefined {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-scroll-refined {
            animation: scrollRefined 60s linear infinite;
          }
        `}} />

      <main className="flex-1">
        {/* ========================================================= */}
        {/* HERO SECTION WITH REAL SEARCH */}
        {/* ========================================================= */}
        <section className="relative pt-12 pb-12 lg:pt-20 lg:pb-20 overflow-hidden bg-white border-b border-slate-100 flex items-center justify-center">
          <TechCircuit />
          {/* Subtle modern background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_center,rgba(40,168,225,0.08)_0%,rgba(255,255,255,0)_70%)] pointer-events-none" />
          <div className="absolute top-0 right-1/4 -mt-[10%] w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 -ml-[10%] w-[600px] h-[600px] bg-sky-400/10 blur-[150px] rounded-full pointer-events-none" />

          <div className="relative z-10 w-full max-w-5xl mx-auto px-6">
            <div className="flex flex-col items-center justify-center text-center">

              <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col items-center">
                {/* Brand badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 rounded-full px-4 py-2 mb-6 shadow-sm">
                  <span className="flex h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
                  <span className="text-[12px] font-black uppercase tracking-[0.18em] text-sky-700">HR Yantra AI — Powered Job Search</span>
                </div>

                <h1 className="text-4xl md:text-[3.75rem] font-black tracking-tight text-slate-900 mb-5 leading-[1.12]">
                  Find the job that<br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600">
                    fits you perfectly.
                  </span>
                </h1>

                <p className="text-[17px] text-slate-500 font-medium max-w-2xl leading-relaxed">
                  HR Yantra AI matches you to roles that suit your skills, experience &amp; goals — so every application counts.
                </p>
              </div>

              {/* Hero Search Box */}
              <form
                onSubmit={handleSearchSubmit}
                className={`w-full rounded-[32px] sm:rounded-full p-3.5 shadow-2xl ring-1 mb-14 flex flex-col sm:flex-row gap-3 relative z-20 group transition-all duration-700 ease-in-out ${searchMode === 'ai'
                    ? 'bg-slate-950 ring-white/10 shadow-[0_0_50px_-12px_rgba(37,99,235,0.25)]'
                    : 'bg-white/90 backdrop-blur-2xl ring-slate-900/5 shadow-[0_24px_60px_-15px_rgba(40,168,225,0.2)]'
                  }`}
              >

                {/* Conditional Search Inputs based on Mode */}
                {searchMode === 'search' ? (
                  <>
                    <div className="flex-1 flex items-center bg-transparent rounded-[24px] sm:rounded-full px-6 border border-transparent focus-within:bg-slate-50/80 transition-colors min-h-[64px] relative">
                      <Search className="h-6 w-6 text-sky-500 mr-4 shrink-0 group-focus-within:scale-110 transition-transform" />
                      <div className="relative flex-1 flex items-center h-full">
                        <input
                          type="text"
                          ref={titleInputRef}
                          className="w-full bg-transparent border-none outline-none text-slate-900 font-semibold text-[17px] relative z-10"
                          value={heroSearch.title}
                          onChange={e => setHeroSearch({ ...heroSearch, title: e.target.value })}
                          onKeyDown={preventEnterSubmit}
                          onFocus={() => {
                            setShowLocSuggestions(false);
                            if (suggestions.length > 0) setShowSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        {!heroSearch.title && (
                          <div className="absolute inset-0 flex items-center pointer-events-none">
                            <span className="text-slate-400 font-semibold text-[17px] rolling-text">
                              <span key={wordIndex} className="rolling-word">{rotatingWords[wordIndex % rotatingWords.length]}</span>
                            </span>
                          </div>
                        )}
                        
                        {/* Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute top-full left-0 mt-4 min-w-[440px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[300] animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2">
                              {suggestions.map((s, i) => (
                                <button
                                  key={s.id || i}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    const suggestionLabel = getSuggestionLabel(s);
                                    if (suggestionLabel) {
                                      applyTitleSuggestion(suggestionLabel);
                                    }
                                  }}
                                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition-colors text-left group/item"
                                >
                                  <div className="flex-1 pr-4 min-w-0">
                                    <p className="font-bold text-slate-900 text-[15px] leading-tight truncate">
                                      <HighlightMatch label={getSuggestionLabel(s)} query={heroSearch.title} />
                                    </p>
                                    {s.company && (
                                      <p className="mt-0.5 text-xs text-slate-400 truncate">{s.company}</p>
                                    )}
                                  </div>
                                  <Search className="w-3.5 h-3.5 text-slate-300 group-hover/item:text-sky-500 transition-colors shrink-0" />
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className="hidden sm:block w-[1.5px] h-12 bg-slate-200/80 my-auto rounded-full shrink-0"></div>

                    <div className="flex-1 flex items-center bg-transparent rounded-[24px] sm:rounded-full px-6 border border-transparent focus-within:bg-slate-50/80 transition-colors min-h-[64px] relative">
                      <MapPin className="h-6 w-6 text-slate-400 mr-4 shrink-0 group-focus-within:text-sky-500 transition-colors" />
                      <div className="relative flex-1 flex items-center h-full">
                        <input
                          type="text"
                          ref={locationInputRef}
                          className="w-full bg-transparent border-none outline-none text-slate-900 font-semibold text-[17px] relative z-10"
                          value={heroSearch.location}
                          onChange={e => setHeroSearch({ ...heroSearch, location: e.target.value })}
                          onKeyDown={preventEnterSubmit}
                          onFocus={() => {
                            setShowSuggestions(false);
                            if (locSuggestions.length > 0) setShowLocSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => setShowLocSuggestions(false), 200)}
                        />
                        {!heroSearch.location && (
                          <div className="absolute inset-0 flex items-center pointer-events-none">
                            <span className="text-slate-400 font-semibold text-[17px] rolling-text">
                              {/* Sync and cycle with the staggered locIndex */}
                              <span key={locIndex} className="rolling-word">{rotatingLocations[locIndex % rotatingLocations.length]}</span>
                            </span>
                          </div>
                        )}

                        {/* Location Suggestions Dropdown */}
                        {showLocSuggestions && locSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 mt-4 min-w-[320px] bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-[300] animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-2">
                              {locSuggestions.map((s, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    const suggestionLabel = getSuggestionLabel(s);
                                    if (suggestionLabel) {
                                      applyLocationSuggestion(suggestionLabel);
                                    }
                                  }}
                                  className="w-full flex items-center justify-between p-3.5 hover:bg-slate-50 rounded-xl transition-colors text-left group/loc"
                                >
                                  <div className="flex-1 pr-4 min-w-0 flex items-center gap-2.5">
                                    <MapPin className="w-3.5 h-3.5 text-slate-300 group-hover/loc:text-sky-500 transition-colors shrink-0" />
                                    <p className="font-bold text-slate-900 text-[14px] leading-tight truncate">
                                      <HighlightMatch label={getSuggestionLabel(s)} query={heroSearch.location} />
                                    </p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col justify-center px-7 min-h-[64px] relative">
                    <div className="flex items-center">
                      <div className="relative mr-5 shrink-0 flex items-center h-7">
                        {/* Gradient Masked Sparkles Icon */}
                        <div className="w-6 h-6 bg-gradient-to-br from-[#2563EB] to-[#9333EA]" style={{ maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z\'/%3E%3Cpath d=\'M5 3v4\'/%3E%3Cpath d=\'M3 5h4\'/%3E%3Cpath d=\'M21 17v4\'/%3E%3Cpath d=\'M19 19h4\'/%3E%3C/svg%3e")', maskSize: 'contain', maskRepeat: 'no-repeat' }}></div>
                        {heroSearch.title === '' && (
                          <div className="absolute -right-3 w-[2px] h-7 bg-sky-400 animate-[pulse_1s_infinite]"></div>
                        )}
                      </div>
                      <div className="relative flex-1 flex items-center h-full">
                        <input
                          type="text"
                          className="w-full bg-transparent border-none outline-none text-white font-semibold text-[18px] relative z-10"
                          value={heroSearch.title}
                          onChange={e => setHeroSearch({ ...heroSearch, title: e.target.value })}
                          onKeyDown={preventEnterSubmit}
                        />
                        {!heroSearch.title && (
                          <div className="absolute inset-0 flex items-center pointer-events-none">
                            <span className="text-slate-500 font-semibold text-[18px] rolling-text">
                              <span key={wordIndex} className="rolling-word">{rotatingAIPrompts[wordIndex % rotatingAIPrompts.length]}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Search / AI Toggle + Action Button */}
                <div className="flex items-center gap-3 shrink-0 pr-1">
                  {/* Toggle Pill with Sliding Background */}
                  <div className={`hidden sm:flex items-center rounded-full p-1 relative min-w-[160px] min-h-[64px] transition-colors duration-700 ${searchMode === 'ai' ? 'bg-white/10' : 'bg-slate-100'
                    }`}>
                    {/* Active Sliding Layer */}
                    <div
                      className={`absolute top-1 bottom-1 h-[calc(100%-8px)] rounded-full transition-all duration-300 ease-in-out ${searchMode === 'search'
                          ? 'left-1 w-[calc(50%-4px)] bg-white shadow-sm'
                          : 'left-[calc(50%+2px)] w-[calc(50%-4px)] bg-gradient-to-br from-[#2563EB] to-[#9333EA] shadow-md'
                        }`}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setSearchMode('search');
                        router.push(buildSearchJobsUrl(heroSearch.title, heroSearch.location));
                      }}
                      className={`relative z-10 flex items-center justify-center w-[50%] h-full rounded-full transition-colors duration-300 ${searchMode === 'search'
                          ? 'text-slate-900'
                          : 'text-slate-400 hover:text-white'
                        }`}
                    >
                      <Search className="w-5.5 h-5.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchMode('ai')}
                      className={`relative z-10 flex items-center justify-center w-[50%] h-full rounded-full transition-colors duration-300 ${searchMode === 'ai' ? 'text-white' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                      <Image
                        src="/ai2yantra-removebg.png"
                        alt="AI"
                        width={36}
                        height={36}
                        className={`object-contain transition-all ${searchMode === 'ai' ? 'brightness-0 invert' : 'brightness-0'}`}
                        style={{ width: '36px', height: '36px' }}
                      />
                    </button>
                  </div>

                  {/* Action Button */}
                  <button
                    type="submit"
                    className={`rounded-[24px] sm:rounded-full px-8 py-4 sm:py-0 font-bold text-[17px] tracking-wide transition-all duration-700 flex items-center justify-center gap-3 shadow-lg active:scale-[0.98] shrink-0 min-h-[64px] w-full sm:w-[155px] ${searchMode === 'ai'
                        ? 'bg-gradient-to-br from-[#2563EB] to-[#9333EA] hover:brightness-110 text-white shadow-purple-500/20'
                        : 'bg-slate-900 hover:bg-sky-500 text-white shadow-slate-900/10'
                      }`}
                  >
                    {searchMode === 'ai' ? (
                      <>
                        <span>Ask</span>
                        <Image
                          src="/ai2yantra-removebg.png"
                          alt="AI"
                          width={40}
                          height={40}
                          className="object-contain brightness-0 invert"
                          style={{ width: '40px', height: '40px' }}
                        />
                      </>
                    ) : (
                      <><Search className="w-5 h-5" /> Search</>
                    )}
                  </button>
                </div>
              </form>

              {/* Industry / Domain Category Grid */}
              <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.25em] text-center mb-6">Explore by Category</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {([
                    { label: 'Remote', Icon: Home, q: 'Remote', color: 'text-sky-600', bg: 'bg-sky-50' },
                    { label: 'Corporate', Icon: Building2, q: 'MNC', color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Analytics', Icon: BarChart2, q: 'Analytics', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Logistics', Icon: Package, q: 'Supply Chain', color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Fresher', Icon: GraduationCap, q: 'Fresher', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Software', Icon: Code2, q: 'Software Engineer', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Sales', Icon: TrendingUp, q: 'Sales', color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Finance', Icon: BadgeDollarSign, q: 'Banking Finance', color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Leadership', Icon: Users, q: 'Project Manager', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Engineering', Icon: Cpu, q: 'Engineering', color: 'text-slate-600', bg: 'bg-slate-100' },
                    { label: 'Data', Icon: Database, q: 'Data Science', color: 'text-pink-600', bg: 'bg-pink-50' },
                  ] as const).map(cat => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => router.push(buildSearchJobsUrl(cat.q, ""))}
                      className="group relative flex items-center gap-4 bg-white border border-slate-200/90 rounded-2xl px-6 py-4.5 text-left transition-all duration-300 shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 cursor-pointer overflow-hidden"
                    >
                      {/* Left-to-Right Hover Background */}
                      <div className="absolute inset-0 w-0 bg-slate-900 transition-all duration-500 ease-out group-hover:w-full z-0 opacity-[0.98]" />

                      {/* Icon Container */}
                      <span className={`relative z-10 w-11 h-11 rounded-2xl ${cat.bg} border border-transparent flex items-center justify-center shrink-0 transition-all duration-300 group-hover:bg-white/10 group-hover:scale-110 group-hover:border-white/20 shadow-sm`}>
                        <cat.Icon className={`w-5.5 h-5.5 ${cat.color} group-hover:text-white transition-colors duration-300`} strokeWidth={2.5} />
                      </span>

                      {/* Text Section */}
                      <div className="relative z-10 flex-1 flex flex-col min-w-0">
                        <span className="text-[15px] font-bold text-slate-800 group-hover:text-white transition-colors duration-300 leading-tight">{cat.label}</span>
                      </div>

                      <ChevronRight className="relative z-10 w-4 h-4 text-slate-300 group-hover:text-white group-hover:translate-x-0.5 shrink-0 transition-all duration-300" />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* PUBLIC LIVE JOBS / TRENDING SECTION */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* PUBLIC LIVE JOBS / TRENDING SECTION */}
        {/* ========================================================= */}
        <section className="py-12 bg-[#F8FAFC]">
          <div className="mx-auto max-w-[1240px] px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6">
              <div className="max-w-xl">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Trending Jobs</h2>
                <p className="text-slate-500 text-lg font-medium">High-growth roles actively hiring. Ready for your next move.</p>
              </div>
              <button
                onClick={() => router.push('/searchjobs')}
                className="group relative flex-shrink-0 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-900 font-bold text-[15px] px-8 py-3.5 rounded-2xl transition-all shadow-sm w-full md:w-auto overflow-hidden"
              >
                {/* Left-to-Right Hover Fill Layer */}
                <div className="absolute inset-0 w-0 bg-slate-900 transition-all duration-500 ease-out group-hover:w-full z-0" />

                <span className="relative z-10 group-hover:text-white transition-colors duration-300">Explore More Jobs</span>
                <ArrowRight className="relative z-10 w-4 h-4 group-hover:text-white group-hover:translate-x-1 transition-all" />
              </button>
            </div>

            {/* Double-Slider Section */}
            <div className="relative w-full flex flex-col gap-8 overflow-hidden pt-4 pb-8 -mx-6 px-6">

              {/* Slider 1: Top Row */}
              <div
                className="flex gap-8 animate-scroll-refined hover:[animation-play-state:paused] transition-all"
                style={{ width: 'max-content' }}
              >
                {[...jobs, ...jobs, ...jobs].map((job, idx) => (
                  <div
                    key={`s1-${job.id}-${idx}`}
                    onClick={() =>
                      triggerGatedAction(
                        'Continue To Job Match',
                        `Log in or sign up to continue with ${job.title} and unlock the guided job matching flow.`,
                        '/whatsapp'
                      )
                    }
                    className="w-[420px] flex-shrink-0 bg-white border border-slate-200 rounded-[32px] p-6 hover:shadow-2xl hover:-translate-y-1.5 hover:border-sky-300 transition-all cursor-pointer group flex flex-col h-full shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative group-hover:shadow-md transition-shadow">
                          <Building className="w-6 h-6 text-slate-300 absolute" />
                          {job.logo && (
                            /* Using standard img for robust onError handling */
                            <img
                              src={job.logo}
                              alt={job.company}
                              className="w-full h-full object-contain relative z-10 bg-white"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-[17px] text-slate-900 group-hover:text-sky-600 transition-colors leading-tight line-clamp-1">{job.title}</h3>
                          <div className="flex items-center text-[12px] font-medium text-slate-500 mt-1">
                            <span className="font-semibold text-slate-700">{job.company}</span>
                            <span className="mx-2 w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />{job.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="flex items-center text-slate-600 bg-slate-50 border border-slate-100 text-[11px] px-3 py-1.5 rounded-xl font-bold">
                        <Map className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {job.workStyle}
                      </span>
                      <span className="flex items-center text-slate-600 bg-slate-50 border border-slate-100 text-[11px] px-3 py-1.5 rounded-xl font-bold">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {job.type}
                      </span>
                      <span className="flex items-center text-slate-600 bg-slate-50 border border-slate-100 text-[11px] px-3 py-1.5 rounded-xl font-bold">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {job.timeAgo}
                      </span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Salary</p>
                        <span className="font-black text-[16px] text-slate-900 tracking-tight">{job.salary}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white group-hover:bg-sky-500 transition-all shadow-lg group-hover:scale-105">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Slider 2: Bottom Row */}
              <div
                className="flex gap-8 animate-scroll-refined hover:[animation-play-state:paused] transition-all"
                style={{ width: 'max-content', animationDelay: '-30s' }}
              >
                {[...[...jobs].reverse(), ...[...jobs].reverse(), ...[...jobs].reverse()].map((job, idx) => (
                  <div
                    key={`s2-${job.id}-${idx}`}
                    onClick={() =>
                      triggerGatedAction(
                        'Continue To Job Match',
                        `Log in or sign up to continue with ${job.title} and unlock the guided job matching flow.`,
                        '/whatsapp'
                      )
                    }
                    className="w-[420px] flex-shrink-0 bg-white border border-slate-200 rounded-[32px] p-6 hover:shadow-2xl hover:-translate-y-1.5 hover:border-sky-300 transition-all cursor-pointer group flex flex-col h-full shadow-sm"
                  >
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className="w-13 h-13 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 overflow-hidden relative group-hover:shadow-md transition-shadow">
                          <Building className="w-6 h-6 text-slate-300 absolute" />
                          {job.logo && (
                            /* Using standard img for robust onError handling */
                            <img
                              src={job.logo}
                              alt={job.company}
                              className="w-full h-full object-contain relative z-10 bg-white"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold text-[17px] text-slate-900 group-hover:text-sky-600 transition-colors leading-tight line-clamp-1">{job.title}</h3>
                          <div className="flex items-center text-[12px] font-medium text-slate-500 mt-1">
                            <span className="font-semibold text-slate-700">{job.company}</span>
                            <span className="mx-2 w-1 h-1 rounded-full bg-slate-200"></span>
                            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />{job.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-5">
                      <span className="flex items-center text-slate-600 bg-slate-50 border border-slate-100 text-[11px] px-3 py-1.5 rounded-xl font-bold">
                        <Map className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {job.workStyle}
                      </span>
                      <span className="flex items-center text-slate-600 bg-slate-50 border border-slate-100 text-[11px] px-3 py-1.5 rounded-xl font-bold">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {job.type}
                      </span>
                      <span className="flex items-center text-slate-600 bg-slate-50 border border-slate-100 text-[11px] px-3 py-1.5 rounded-xl font-bold">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" /> {job.timeAgo}
                      </span>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Salary</p>
                        <span className="font-black text-[16px] text-slate-900 tracking-tight">{job.salary}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white group-hover:bg-sky-500 transition-all shadow-lg group-hover:scale-105">
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </section>







      </main>


      {/* Global Gated Action Modal */}
      <AuthInterceptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={authConfig.title}
        description={authConfig.description}
        redirectUrl={authConfig.redirectUrl}
      />
    </div>
  );
}
