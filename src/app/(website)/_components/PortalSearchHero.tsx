"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { getApiBaseUrl } from '@/lib/api-base';
import { AppLocale, localizePath } from '@/lib/i18n';
import {
  Search, MapPin, ChevronRight,
  Home, Building2, BarChart2, Package, GraduationCap,
  Code2, TrendingUp, BadgeDollarSign, Cpu, Users, Database,
} from 'lucide-react';
import {
  buildSearchJobsUrl,
  getSuggestionLabel,
  HighlightMatch,
  portalSearchHeroStyles,
  scoreMatch,
} from './portalSearchHero.helpers';

export function PortalSearchHero() {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const t = useTranslations();
  const [heroSearch, setHeroSearch] = useState({ title: '', location: '' });
  const [searchMode, setSearchMode] = useState<'search' | 'ai'>('search');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [locSuggestions, setLocSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocSuggestions, setShowLocSuggestions] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerSearch();
  };

  const triggerSearch = () => {
    if (searchMode === 'ai') {
      router.push(localizePath('/whatsapp', locale));
      return;
    }
    router.push(buildSearchJobsUrl(locale, heroSearch.title, heroSearch.location));
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
      router.push(buildSearchJobsUrl(locale, normalizedValue, heroSearch.location));
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
      router.push(buildSearchJobsUrl(locale, heroSearch.title, normalizedValue));
    }
  };

  const rotatingWords = useMemo(
    () => t.raw("landing.rotatingWords") as string[],
    [locale, t],
  );
  const rotatingLocations = useMemo(
    () => t.raw("landing.rotatingLocations") as string[],
    [locale, t],
  );
  const rotatingAIPrompts = useMemo(
    () => t.raw("landing.rotatingAiPrompts") as string[],
    [locale, t],
  );
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
    <>
      <style dangerouslySetInnerHTML={{ __html: portalSearchHeroStyles }} />
      {/* ========================================================= */}
        {/* HERO SECTION WITH REAL SEARCH */}
        {/* ========================================================= */}
        <section className="relative pt-28 pb-12 lg:pt-32 lg:pb-20 overflow-hidden bg-white border-b border-slate-100 flex items-center justify-center">
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
                  <span className="text-[12px] font-black uppercase tracking-[0.18em] text-sky-700">{t("landing.badge")}</span>
                </div>

                <h1 className="text-4xl md:text-[3.75rem] font-black tracking-tight text-slate-900 mb-5 leading-[1.12]">
                  {t("landing.heroLine1")}<br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600">
                    {t("landing.heroLine2")}
                  </span>
                </h1>

                <p className="text-[17px] text-slate-500 font-medium max-w-2xl leading-relaxed">
                  {t("landing.heroSubtitle")}
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
                        router.push(buildSearchJobsUrl(locale, heroSearch.title, heroSearch.location));
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
                        <span>{t("landing.ask")}</span>
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
                      <><Search className="w-5 h-5" /> {t("landing.search")}</>
                    )}
                  </button>
                </div>
              </form>

              {/* Industry / Domain Category Grid */}
              <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
                <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.25em] text-center mb-6">{t("landing.exploreByCategory")}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {([
                    { label: t("landing.categoryRemote"), Icon: Home, q: 'Remote', color: 'text-sky-600', bg: 'bg-sky-50' },
                    { label: t("landing.categoryCorporate"), Icon: Building2, q: 'MNC', color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: t("landing.categoryAnalytics"), Icon: BarChart2, q: 'Analytics', color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: t("landing.categoryLogistics"), Icon: Package, q: 'Supply Chain', color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: t("landing.categoryFresher"), Icon: GraduationCap, q: 'Fresher', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: t("landing.categorySoftware"), Icon: Code2, q: 'Software Engineer', color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: t("landing.categorySales"), Icon: TrendingUp, q: 'Sales', color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: t("landing.categoryFinance"), Icon: BadgeDollarSign, q: 'Banking Finance', color: 'text-green-600', bg: 'bg-green-50' },
                    { label: t("landing.categoryLeadership"), Icon: Users, q: 'Project Manager', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: t("landing.categoryEngineering"), Icon: Cpu, q: 'Engineering', color: 'text-slate-600', bg: 'bg-slate-100' },
                    { label: t("landing.categoryData"), Icon: Database, q: 'Data Science', color: 'text-pink-600', bg: 'bg-pink-50' },
                  ] as const).map(cat => (
                    <button
                      key={cat.label}
                      type="button"
                      onClick={() => router.push(buildSearchJobsUrl(locale, cat.q, ""))}
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
    </>
  );
}