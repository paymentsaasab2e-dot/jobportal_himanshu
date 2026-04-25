'use client';
import { Suspense, useMemo, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import Image from 'next/image';
import ApplicationSuccessModal from '@/components/modals/ApplicationSuccessModal';
import DashboardContainer from '@/components/layout/DashboardContainer';
import DashboardPanel from '@/components/dashboard/DashboardPanel';
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Sparkles,
} from 'lucide-react';

// Use backend1 directly (it shares the same MongoDB as backendphase2).
import { API_BASE_URL } from '@/lib/api-base';
import { showInfoToast, showSuccessToast } from '@/components/common/toast/toast';
const PAGE_BG =
  'linear-gradient(135deg, #e0f2fe 0%, #ecf7fd 12%, #fafbfb 30%, #fdf6f0 55%, #fef5ed 85%, #fef5ed 100%)';
const SAVED_JOBS_STORAGE_PREFIX = 'dashboardSavedJobs';

interface JobListing {
  id: number | string
  title: string
  company: string
  logo: string
  location: string
  salary: string
  type: string
  skills: string[]
  match: string
  matchScore?: number
  normalizedScore?: number
  timeAgo: string
  isHighlighted?: boolean
  description: string
  responsibilities: string[]
  requiredSkills: string[]
  niceToHaveSkills?: string[]
  companyOverview: string
  experienceLevel: string
  education?: string
  benefits?: string[]
  department?: string
  workMode: string
  industry: string
  visaAvailability: string
  applicantCount: string
  postedDate: string
  strengths?: string[]
  gaps?: string[]
  confidenceTag?: string
  reasoning?: string
  matchedSkills?: string[]
  missingSkills?: string[]
  topMatchedSkills?: string[]
  topMissingSkills?: string[]
  matchLabel?: string
  scoreColorHint?: 'high' | 'medium' | 'low' | string
  whyNotMatched?: string | null
  transferableSkills?: string[]
  skillGaps?: string[]
  hiringRecommendation?: string
  breakdown?: any
  normalizedJobProfile?: any
}

interface AppliedJobSummary {
  jobTitle: string
  company: string
  appliedDate: string
  jobId?: string | number
  applicationId?: string
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function resolveCompanyName(job: Record<string, any>) {
  if (typeof job.company === 'object' && job.company !== null) {
    return (
      asString(job.company.name) ||
      asString(job.company.companyName) ||
      asString(job.client?.companyName) ||
      'Company Name'
    )
  }

  return asString(job.company) || asString(job.client?.companyName) || 'Company Name'
}

function resolveCompanyLogo(job: Record<string, any>) {
  if (typeof job.company === 'object' && job.company !== null) {
    return (
      asString(job.company.logoUrl) ||
      asString(job.company.logo) ||
      asString(job.client?.logo) ||
      asString(job.logo) ||
      asString(job.companyLogo) ||
      '/perosn_icon.png'
    )
  }

  return (
    asString(job.logo) ||
    asString(job.companyLogo) ||
    asString(job.client?.logo) ||
    '/perosn_icon.png'
  )
}

function getSavedJobsStorageKey() {
  if (typeof window === 'undefined') return `${SAVED_JOBS_STORAGE_PREFIX}:guest`
  const candidateId = sessionStorage.getItem('candidateId') || 'guest'
  return `${SAVED_JOBS_STORAGE_PREFIX}:${candidateId}`
}

function getMonogram(value: string) {
  const letters = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')

  return letters || 'JB'
}

function parseMatchPercentage(match?: string, matchScore?: number) {
  if (typeof matchScore === 'number' && Number.isFinite(matchScore)) {
    return Math.max(0, Math.min(100, Math.round(matchScore)))
  }

  const parsed = Number.parseInt((match || '').replace(/[^0-9]/g, ''), 10)
  return Number.isFinite(parsed) ? Math.max(0, Math.min(100, parsed)) : 0
}

const MONGODB_OBJECT_ID_REGEX = /^[a-f0-9]{24}$/i

function isValidMongoObjectId(value: unknown) {
  return MONGODB_OBJECT_ID_REGEX.test(String(value || '').trim())
}

function buildApiBaseCandidates(primaryBase: string) {
  const bases = new Set<string>()
  const normalizedPrimary = String(primaryBase || '').trim().replace(/\/$/, '')
  if (normalizedPrimary) bases.add(normalizedPrimary)

  const localhostMatch = normalizedPrimary.match(/^(https?:\/\/localhost:)(\d+)(\/api)$/i)
  if (localhostMatch) {
    const [, hostPrefix, port, suffix] = localhostMatch
    if (port === '5000') bases.add(`${hostPrefix}5001${suffix}`)
    if (port === '5001') bases.add(`${hostPrefix}5000${suffix}`)
  }

  return Array.from(bases)
}

function extractJobsFromResponse(result: any): any[] {
  if (!result) return []
  if (Array.isArray(result)) return result
  if (Array.isArray(result?.data)) return result.data
  if (Array.isArray(result?.data?.jobs)) return result.data.jobs
  if (Array.isArray(result?.data?.items)) return result.data.items
  if (Array.isArray(result?.jobs)) return result.jobs
  if (Array.isArray(result?.items)) return result.items
  return []
}

async function fetchPhase2PublicJobs(): Promise<any[]> {
  try {
    const response = await fetch('/api/proxy/phase2-public-jobs?limit=500', { method: 'GET' })
    const result = await response.json()

    if (!response.ok || !result?.success || !Array.isArray(result?.data)) {
      return []
    }

    return result.data
  } catch (error) {
    console.error('Error fetching Phase 2 public jobs:', error)
    return []
  }
}

function getConfidenceBadgeClasses(confidenceTag?: string) {
  const normalized = (confidenceTag || '').toLowerCase()

  if (normalized.includes('excellent')) {
    return 'border-[rgba(40,168,225,0.22)] bg-[rgba(40,168,225,0.10)] text-[#0f5f83]'
  }

  if (normalized.includes('partial') || normalized.includes('gap')) {
    return 'border-[rgba(252,150,32,0.24)] bg-[rgba(252,150,32,0.12)] text-[#d97706]'
  }

  return 'border-slate-200 bg-slate-100/90 text-slate-600'
}

function getMatchLabelClasses(matchLabel?: string) {
  const normalized = (matchLabel || '').toLowerCase()

  if (normalized.includes('excellent')) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (normalized.includes('best')) {
    return 'border-sky-200 bg-sky-50 text-sky-700'
  }

  if (normalized.includes('good')) {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-slate-200 bg-slate-50 text-slate-600'
}

function getScoreBadgeClasses(scoreColorHint?: string) {
  if (scoreColorHint === 'high') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (scoreColorHint === 'medium') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-rose-200 bg-rose-50 text-rose-700'
}

const ExploreJobsPageContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const detailsRef = useRef<HTMLDivElement | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null)
  const [jobListings, setJobListings] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'detail'>('grid')
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid')
  const [isScreeningModalOpen, setIsScreeningModalOpen] = useState(false)
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false)
  const [appliedJobSummary, setAppliedJobSummary] = useState<AppliedJobSummary | null>(null)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())
  const [savedJobIds, setSavedJobIds] = useState<string[]>([])

  // Screening form states
  const [experienceAnswer, setExperienceAnswer] = useState<string | null>('yes')
  const [nightShiftFocused, setNightShiftFocused] = useState(false)
  const [nightShiftValue, setNightShiftValue] = useState('')
  const [excelProficiency, setExcelProficiency] = useState(0) // 0 = Beginner, 100 = Expert
  const [joiningAvailability, setJoiningAvailability] = useState<string | null>(null)

  // Filters UI state (local only)
  const [smartFiltersOpen, setSmartFiltersOpen] = useState(true)
  const [experienceOpen, setExperienceOpen] = useState(true)
  const [salaryOpen, setSalaryOpen] = useState(true)
  const [matchOpen, setMatchOpen] = useState(true)
  const [industryOpen, setIndustryOpen] = useState(true)
  const [departmentOpen, setDepartmentOpen] = useState(true)
  const [citiesOpen, setCitiesOpen] = useState(true)

  // View More expand states
  const [showMoreSalary, setShowMoreSalary] = useState(false)
  const [showMoreIndustry, setShowMoreIndustry] = useState(false)
  const [showMoreDepartment, setShowMoreDepartment] = useState(false)
  const [showMoreCities, setShowMoreCities] = useState(false)

  const [smartFilterSkills, setSmartFilterSkills] = useState(false)
  const [smartFilterHighMatch, setSmartFilterHighMatch] = useState(false)
  const [smartFilterLikelyRespond, setSmartFilterLikelyRespond] = useState(false)
  const [smartFilterRemoteFriendly, setSmartFilterRemoteFriendly] = useState(false)

  const [workMode, setWorkMode] = useState<'Remote' | 'Hybrid' | 'On-site' | null>(null)
  const [experienceYears, setExperienceYears] = useState(20)
  const [salaryRanges, setSalaryRanges] = useState<Record<string, boolean>>({
    '0-3 Lakhs': false,
    '3-6 Lakhs': false,
    '6-10 Lakhs': false,
    '10-15 Lakhs': false,
    '15-25 Lakhs': false,
    '25-35 Lakhs': false,
    '35-50 Lakhs': false,
    '50+ Lakhs': false,
  })
  const [matchScore, setMatchScore] = useState<Record<string, boolean>>({
    '80%+ Match': false,
    '70%+ Match': false,
    '60%+ Match': false,
  })
  const [industry, setIndustry] = useState<Record<string, boolean>>({
    'IT Services & Consulting': false,
    'Software Product': false,
    'Recruitment / Staffing': false,
    'Miscellaneous': false,
    'Banking & Finance': false,
    'Healthcare & Pharma': false,
    'E-commerce & Retail': false,
    'Manufacturing': false,
    'Education & Training': false,
    'Media & Entertainment': false,
    'Telecommunications': false,
  })
  const [department, setDepartment] = useState<Record<string, boolean>>({
    'Engineering - Software': false,
    'Data Science & Analytics': false,
    'UX, Design & Architecture': false,
    'IT & Information Security': false,
    'Sales & Business Development': false,
    'Marketing & Communications': false,
    'Human Resources': false,
    'Finance & Accounting': false,
    'Operations & Logistics': false,
    'Customer Support': false,
    'Product Management': false,
    'Quality Assurance': false,
  })

  useEffect(() => {
    const query = searchParams.get('q')?.trim() || ''
    const location = searchParams.get('location')?.trim() || ''
    const combined = [query, location].filter(Boolean).join(' ').trim()

    if (combined) {
      setSearchQuery(combined)
    }
  }, [searchParams])
  const [cities, setCities] = useState<Record<string, boolean>>({
    'Navi Mumbai': false,
    'Panvel': false,
    'Mumbai': false,
    'Bengaluru': false,
    'Hyderabad': false,
    'Chennai': false,
    'Pune': false,
    'Delhi': false,
    'Gurgaon': false,
    'Noida': false,
    'Kolkata': false,
    'Ahmedabad': false,
    'Jaipur': false,
    'Chandigarh': false,
    'Remote': false,
  })

  const resetFilters = () => {
    setSearchQuery('')
    setSmartFilterSkills(false)
    setSmartFilterHighMatch(false)
    setSmartFilterLikelyRespond(false)
    setSmartFilterRemoteFriendly(false)
    setWorkMode(null)
    setExperienceYears(20)
    setSalaryRanges({ '0-3 Lakhs': false, '3-6 Lakhs': false, '6-10 Lakhs': false, '10-15 Lakhs': false, '15-25 Lakhs': false, '25-35 Lakhs': false, '35-50 Lakhs': false, '50+ Lakhs': false })
    setMatchScore({ '80%+ Match': false, '70%+ Match': false, '60%+ Match': false })
    setIndustry({ 'IT Services & Consulting': false, 'Software Product': false, 'Recruitment / Staffing': false, 'Miscellaneous': false, 'Banking & Finance': false, 'Healthcare & Pharma': false, 'E-commerce & Retail': false, 'Manufacturing': false, 'Education & Training': false, 'Media & Entertainment': false, 'Telecommunications': false })
    setDepartment({ 'Engineering - Software': false, 'Data Science & Analytics': false, 'UX, Design & Architecture': false, 'IT & Information Security': false, 'Sales & Business Development': false, 'Marketing & Communications': false, 'Human Resources': false, 'Finance & Accounting': false, 'Operations & Logistics': false, 'Customer Support': false, 'Product Management': false, 'Quality Assurance': false })
    setCities({ 'Navi Mumbai': false, 'Panvel': false, 'Mumbai': false, 'Bengaluru': false, 'Hyderabad': false, 'Chennai': false, 'Pune': false, 'Delhi': false, 'Gurgaon': false, 'Noida': false, 'Kolkata': false, 'Ahmedabad': false, 'Jaipur': false, 'Chandigarh': false, 'Remote': false })
    setShowMoreSalary(false)
    setShowMoreIndustry(false)
    setShowMoreDepartment(false)
    setShowMoreCities(false)
  }

  useEffect(() => {
    loadJobListings()
    checkAppliedJobs()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const stored = localStorage.getItem(getSavedJobsStorageKey())
    if (!stored) {
      setSavedJobIds([])
      return
    }

    try {
      const parsed = JSON.parse(stored) as unknown
      if (Array.isArray(parsed)) {
        setSavedJobIds(parsed.filter((item): item is string => typeof item === 'string'))
      }
    } catch (error) {
      console.error('Could not parse saved jobs:', error)
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(getSavedJobsStorageKey(), JSON.stringify(savedJobIds))
  }, [savedJobIds])

  useEffect(() => {
    if (viewMode !== 'detail') return
    // Ensure the Job Details section is visible after selecting a job
    const t = setTimeout(() => {
      detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    return () => clearTimeout(t)
  }, [viewMode, selectedJob?.id])

  const formatTimeAgo = (date: Date | string): string => {
    const now = new Date();
    const postedDate = typeof date === 'string' ? new Date(date) : date;
    const diffInMs = now.getTime() - postedDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Just now';
    if (diffInDays === 1) return '1 day ago';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    }
    if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
    const years = Math.floor(diffInDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  };

  const formatSalary = (min: number | null, max: number | null, currency: string | null, type: string | null, amount?: string | null): string => {
    if (amount) return amount;
    if (!min && !max) return 'Salary not specified';
    const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency || '$';
    const typeLabel = type === 'ANNUAL' ? '/year' : type === 'MONTHLY' ? '/month' : type === 'HOURLY' ? '/hour' : '';
    
    if (min && max) {
      return `${currencySymbol}${min.toLocaleString()} - ${currencySymbol}${max.toLocaleString()}${typeLabel}`;
    }
    if (min) {
      return `${currencySymbol}${min.toLocaleString()}+${typeLabel}`;
    }
    return `${currencySymbol}${max?.toLocaleString()}${typeLabel}`;
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  };

  const [isPersonalized, setIsPersonalized] = useState(false);

  const loadJobListings = async () => {
    try {
      setLoading(true);
      const candidateId = sessionStorage.getItem('candidateId');
      const apiBases = buildApiBaseCandidates(String(API_BASE_URL));

      let result: any = null;
      let rawJobs: any[] = [];
      let usingPersonalized = false;

      for (const base of apiBases) {
        if (candidateId) {
          try {
            const personalizedResponse = await fetch(
              `${base}/jobs/personalized?candidateId=${encodeURIComponent(candidateId)}`,
              { method: 'GET' }
            );
            if (personalizedResponse.ok) {
              const personalizedResult = await personalizedResponse.json();
              const personalizedJobs = extractJobsFromResponse(personalizedResult);
              if (personalizedResult?.success !== false && personalizedJobs.length > 0) {
                result = personalizedResult;
                rawJobs = personalizedJobs;
                usingPersonalized = true;
                break;
              }
            }
          } catch (error) {
            console.warn(`Personalized jobs fetch failed for ${base}`, error);
          }
        }

        try {
          const generalResponse = await fetch(`${base}/jobs?limit=500`, { method: 'GET' });
          if (!generalResponse.ok) {
            continue;
          }
          const generalResult = await generalResponse.json();
          const generalJobs = extractJobsFromResponse(generalResult);
          if (generalResult?.success !== false) {
            result = generalResult;
            rawJobs = generalJobs;
            usingPersonalized = false;
            break;
          }
        } catch (error) {
          console.warn(`General jobs fetch failed for ${base}`, error);
        }
      }

      if (!result) {
        throw new Error(`Failed to connect to any local API base (${apiBases.join(', ')})`);
      }

      setIsPersonalized(usingPersonalized);
      const phase2Jobs = await fetchPhase2PublicJobs();
      const mergedJobs = [...rawJobs];
      const existingIds = new Set(
        rawJobs
          .filter((job: any) => job && typeof job === 'object')
          .map((job: any) => String(job.id || job._id || job.jobId || ''))
          .filter(Boolean)
      );

      phase2Jobs.forEach((job: any) => {
        const jobId = String(job?.id || job?._id || '')
        if (!jobId || existingIds.has(jobId)) return
        existingIds.add(jobId)
        mergedJobs.push(job)
      })

      if (result.success && Array.isArray(mergedJobs)) {
        // Transform API response to JobListing format
        const transformedJobs: JobListing[] = mergedJobs
        .map((job: any) => {
          const rawDescriptionText =
            asString(job.description) ||
            asString(job.jobDescription) ||
            asString(job.jobSummary) ||
            (typeof job.jobDescriptionHtml === 'string' ? stripHtml(job.jobDescriptionHtml) : null) ||
            ''
          const parsedText = parseStructuredJobText(rawDescriptionText)

          const matchScoreFromApi =
            typeof job.finalScore === 'number'
              ? job.finalScore
              : typeof job.aiScore === 'number'
              ? job.aiScore
              : typeof job.totalScore === 'number'
              ? job.totalScore
              : typeof job.score === 'number'
              ? job.score
              : typeof job.match_score === 'number'
              ? job.match_score
              : undefined;
          const safeRoundedScore =
            typeof matchScoreFromApi === 'number' && Number.isFinite(matchScoreFromApi)
              ? Math.max(0, Math.min(100, Math.round(matchScoreFromApi)))
              : undefined;
          const matchScore =
            typeof safeRoundedScore === 'number'
              ? safeRoundedScore
              : Math.floor(Math.random() * 21) + 75;
          
          const jobId = asString(job.id) || asString(job._id) || asString(job.jobId) || '';
          if (!jobId) {
            return null;
          }
          const companyName = resolveCompanyName(job);
          const resolvedLocation =
            asString(job.location) ||
            asString(job.city) ||
            parsedText.location ||
            'Location not specified'
          const resolvedType =
            asString(job.type) ||
            asString(job.employmentType) ||
            parsedText.employmentType ||
            'Full-time'
          const resolvedDescription =
            asString(job.overview) ||
            asString(job.aboutRole) ||
            parsedText.summary ||
            rawDescriptionText ||
            'No description available.'
          const resolvedResponsibilities =
            Array.isArray(job.keyResponsibilities) && job.keyResponsibilities.length
              ? job.keyResponsibilities
              : typeof job.responsibilities === 'string'
              ? splitTextPoints(job.responsibilities)
              : Array.isArray(job.responsibilities)
              ? job.responsibilities
              : parsedText.responsibilities
          const resolvedRequiredSkills =
            Array.isArray(job.skills) && job.skills.length
              ? job.skills
              : Array.isArray(job.requirements) && job.requirements.length
              ? job.requirements
              : Array.isArray(job.normalizedJobProfile?.requiredSkills) && job.normalizedJobProfile.requiredSkills.length
              ? job.normalizedJobProfile.requiredSkills
              : parsedText.requirements
          const resolvedBenefits =
            Array.isArray(job.benefits) && job.benefits.length
              ? job.benefits
              : parsedText.benefits
          const resolvedEducation =
            asString(job.education) ||
            asString(job.qualification) ||
            asString(job.educationalQualification) ||
            '-'
          
          return {
            id: jobId,
            title: job.jobTitle || job.title || 'Job Title',
            company: companyName,
            logo: resolveCompanyLogo(job),
            location: resolvedLocation,
            salary: formatSalary(
              job.salary?.min ?? job.salaryMin, 
              job.salary?.max ?? job.salaryMax, 
              job.salary?.currency ?? job.salaryCurrency, 
              job.salary?.type ?? job.salaryType,
              job.salary?.amount || asString(job.expectedSalary) || parsedText.expectedSalary || asString(job.compensation)
            ),
            type: resolvedType,
            skills: Array.isArray(job.skills) ? job.skills : (job.matchedSkills || []),
            match: `${matchScore}% Match`,
            matchScore: matchScore,
            normalizedScore:
              typeof job.normalizedScore === 'number'
                ? job.normalizedScore
                : matchScore,
            timeAgo: formatTimeAgo(job.postedDate || job.postedAt || job.createdAt || new Date()),
            isHighlighted: matchScore >= 85,
            description: resolvedDescription,
            responsibilities: resolvedResponsibilities,
            requiredSkills: resolvedRequiredSkills,
            niceToHaveSkills: Array.isArray(job.preferredSkills)
              ? job.preferredSkills
              : Array.isArray(job.normalizedJobProfile?.preferredSkills)
              ? job.normalizedJobProfile.preferredSkills
              : [],
            companyOverview:
              asString(job.companyOverview) ||
              parsedText.summary ||
              `We are a leading company in the ${job.industry || job.department || 'technology'} industry.`,
            experienceLevel:
              job.experienceRequired ||
              job.experienceLevel ||
              job.normalizedJobProfile?.requiredExperienceLevel ||
              job.experience ||
              'Not specified',
            department: job.industry || job.department || undefined,
            workMode: job.workMode || job.normalizedJobProfile?.workMode || 'On-site',
            industry: job.industry || job.department || 'Technology',
            visaAvailability: job.visaSponsorship || job.visaSponsorship === true ? 'Available' : 'Not Available',
            applicantCount: `${Math.floor(Math.random() * 200) + 20}+`,
            postedDate: formatDate(job.postedDate || job.postedAt || job.createdAt || new Date()),
            strengths: job.strongMatches || [],
            gaps: job.skillGaps || [],
            education: resolvedEducation,
            benefits: resolvedBenefits,
            confidenceTag: job.confidenceTag,
            reasoning: job.shortReason || job.reasoning,
            matchedSkills: job.matchedSkills,
            missingSkills: job.missingSkills,
            topMatchedSkills: Array.isArray(job.topMatchedSkills)
              ? job.topMatchedSkills
              : Array.isArray(job.matchedSkills)
              ? job.matchedSkills.slice(0, 3)
              : [],
            topMissingSkills: Array.isArray(job.topMissingSkills)
              ? job.topMissingSkills
              : Array.isArray(job.missingSkills)
              ? job.missingSkills.slice(0, 3)
              : [],
            matchLabel: job.matchLabel || job.confidenceTag,
            scoreColorHint: job.scoreColorHint || (matchScore >= 85 ? 'high' : matchScore >= 55 ? 'medium' : 'low'),
            whyNotMatched: typeof job.whyNotMatched === 'string' ? job.whyNotMatched : null,
            transferableSkills: job.transferableSkills,
            hiringRecommendation: job.hiringRecommendation,
            breakdown: job.breakdown,
            normalizedJobProfile: job.normalizedJobProfile
          };
        })
        .filter((job) => job !== null) as JobListing[];

        setJobListings(transformedJobs);
        if (transformedJobs.length > 0) {
          setSelectedJob(transformedJobs[0]);
        } else {
          setSelectedJob(null);
        }
      } else {
        setJobListings([]);
        setSelectedJob(null);
      }
    } catch (error: any) {
      console.error('Failed to load job listings:', error);
      setJobListings([]);
    } finally {
      setLoading(false);
    }
  }

  const checkAppliedJobs = async () => {
    const candidateId = sessionStorage.getItem('candidateId');
    if (!candidateId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/applications/${candidateId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const appliedIds = new Set<string>(result.data.map((app: any) => String(app.jobId)));
          setAppliedJobIds(appliedIds);
        }
      }
    } catch (error) {
      console.error('Error checking applied jobs:', error);
    }
  }

  const handleResetFilters = () => {
    resetFilters()
  }

  const handleJobClick = (job: JobListing) => {
    setSelectedJob(job)
  }

  const handleApplyNow = () => {
    setIsScreeningModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsScreeningModalOpen(false)
    setExperienceAnswer('yes')
    setNightShiftValue('')
    setNightShiftFocused(false)
    setExcelProficiency(0)
    setJoiningAvailability(null)
  }

  const handleSubmitScreening = async () => {
    const candidateId = sessionStorage.getItem('candidateId');
    if (!candidateId) {
      alert('Please log in to apply for jobs');
      return;
    }

    if (!selectedJob) {
      alert('No job selected');
      return;
    }

    const selectedJobId = String(selectedJob.id || '').trim();
    if (!isValidMongoObjectId(candidateId) || !isValidMongoObjectId(selectedJobId)) {
      showInfoToast('Cannot apply', 'This job has an invalid identifier. Please refresh and try another role.');
      return;
    }

    try {
      const screeningAnswers = {
      experience: experienceAnswer,
      nightShift: nightShiftValue,
      excelProficiency,
        joiningAvailability,
      };

      const response = await fetch(`${API_BASE_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidateId,
          jobId: selectedJobId,
          screeningAnswers,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const message =
          typeof result?.message === 'string' ? result.message : 'Failed to submit application';
        const lower = message.toLowerCase();

        // Backend can return a non-200 when the candidate already applied.
        // Treat this as a normal outcome so we don't show console errors.
        if (lower.includes('already applied')) {
          const fallbackTitle = selectedJob.title || 'Job'
          const fallbackCompany = selectedJob.company || 'Company'
          handleCloseModal();
          setAppliedJobSummary({
            jobTitle: fallbackTitle,
            company: fallbackCompany,
            appliedDate: formatDate(new Date()),
            jobId: selectedJobId,
          });
          setIsSuccessModalOpen(true);
          loadJobListings();
          checkAppliedJobs();
          showInfoToast('Application already submitted', 'This role is already in your applications.');
          return;
        }

        alert(message);
        return;
      }

      if (result.success) {
        const appliedAtDate =
          result?.data?.appliedAt ? formatDate(new Date(result.data.appliedAt)) : formatDate(new Date())
        const backendJob = result?.data?.job
        const modalJobTitle = asString(backendJob?.title) || selectedJob.title || 'Job'
        const modalCompany = asString(backendJob?.company) || selectedJob.company || 'Company'
        const modalJobId = asString(backendJob?.id) || selectedJobId
        const modalApplicationId = asString(result?.data?.applicationId) || undefined

        handleCloseModal();
        setAppliedJobSummary({
          jobTitle: modalJobTitle,
          company: modalCompany,
          appliedDate: appliedAtDate,
          jobId: modalJobId,
          applicationId: modalApplicationId,
        });
        setIsSuccessModalOpen(true);
        // Reload job listings and check applied status
        loadJobListings();
        checkAppliedJobs();
        showSuccessToast('Application submitted successfully');
      } else {
        alert(result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(error instanceof Error ? error.message : 'Failed to submit application. Please try again.');
    }
  }

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false)
    setAppliedJobSummary(null)
  }

  const getProficiencyLabel = (value: number) => {
    if (value === 0) return 'Beginner'
    if (value <= 25) return 'Basic'
    if (value <= 50) return 'Intermediate'
    if (value <= 75) return 'Advanced'
    return 'Expert'
  }

  const isSavedJob = (jobId: string | number) => savedJobIds.includes(String(jobId))

  const handleSaveJob = (job?: JobListing | null) => {
    const targetJob = job || selectedJob
    if (!targetJob) return

    const targetId = String(targetJob.id)
    const wasSaved = savedJobIds.includes(targetId)
    setSavedJobIds((previous) =>
      previous.includes(targetId)
        ? previous.filter((item) => item !== targetId)
        : [...previous, targetId]
    )
    showSuccessToast(wasSaved ? 'Job removed from saved jobs' : 'Job saved')
  }

  const handleBackToGrid = () => {
    setViewMode('grid')
    setSelectedJob(null)
  }

  const filteredJobs = useMemo(() => {
    let jobs = jobListings;

    // Filter out already applied jobs
    if (appliedJobIds.size > 0) {
      jobs = jobs.filter((j) => !appliedJobIds.has(String(j.id)));
    }

    // Search query filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      jobs = jobs.filter((j) => {
        const hay = `${j.title} ${j.company} ${j.location} ${(j.skills || []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }

    // Smart filters
    if (smartFilterSkills) {
      jobs = jobs.filter((j) => j.skills && j.skills.length > 0);
    }
    if (smartFilterHighMatch) {
      jobs = jobs.filter((j) => (j.matchScore || 0) >= 80);
    }
    if (smartFilterRemoteFriendly) {
      jobs = jobs.filter((j) =>
        j.workMode?.toLowerCase().includes('remote') ||
        j.location?.toLowerCase().includes('remote')
      );
    }

    // Work mode filter
    if (workMode) {
      jobs = jobs.filter((j) => {
        const mode = (j.workMode || '').toLowerCase();
        const loc = (j.location || '').toLowerCase();
        const target = workMode.toLowerCase();
        if (target === 'remote') return mode.includes('remote') || loc.includes('remote');
        if (target === 'hybrid') return mode.includes('hybrid');
        if (target === 'on-site') return mode.includes('on-site') || mode.includes('office') || mode.includes('onsite');
        return true;
      });
    }

    // Experience filter
    // Logic: experienceYears is the 'Maximum' experience the candidate has.
    // We show jobs that require up to that amount.
    // If experienceYears is 20 (max), we treat it as 'Any' and show all jobs.
    if (experienceYears < 20) {
      jobs = jobs.filter((j) => {
        const expStr = (j.experienceLevel || '').toLowerCase();
        if (expStr.includes('not specified') || expStr === '-') return true;
        
        const match = expStr.match(/(\d+)/);
        if (!match) return true; // include if unknown/freshers
        
        const jobExp = parseInt(match[1], 10);
        return jobExp <= experienceYears;
      });
    }

    // Salary range filter
    const activeSalaryRanges = Object.entries(salaryRanges)
      .filter(([, v]) => v)
      .map(([k]) => k);
    
    if (activeSalaryRanges.length > 0) {
      const SALARY_RANGE_LIMITS: Record<string, [number, number]> = {
        '0-3 Lakhs': [0, 300000],
        '3-6 Lakhs': [300000, 600000],
        '6-10 Lakhs': [600000, 1000000],
        '10-15 Lakhs': [1000000, 1500000],
        '15-25 Lakhs': [1500000, 2500000],
        '25-35 Lakhs': [2500000, 3500000],
        '35-50 Lakhs': [3500000, 5000000],
        '50+ Lakhs': [5000000, Infinity],
      };

      jobs = jobs.filter((j) => {
        const salaryStr = (j.salary || '').toLowerCase();
        // Naive but effective parsing for common formats: "10-15 Lakhs", "12 Lakhs", "$100,000"
        const numbers = salaryStr.replace(/,/g, '').match(/(\d+(\.\d+)?)/g);
        if (!numbers) return false;

        let factor = 1;
        if (salaryStr.includes('lakh')) factor = 100000;
        else if (salaryStr.includes('crore')) factor = 10000000;

        const vals = numbers.map(n => parseFloat(n) * factor);
        const minSalary = vals[0];
        const maxSalary = vals.length > 1 ? vals[1] : (salaryStr.includes('+') ? Infinity : vals[0]);

        return activeSalaryRanges.some(range => {
          const [limitMin, limitMax] = SALARY_RANGE_LIMITS[range];
          // Check for overlap between job salary range and filter range
          return (minSalary < limitMax && maxSalary >= limitMin);
        });
      });
    }

    // Match score filter
    const activeMatchScores = Object.entries(matchScore)
      .filter(([, v]) => v)
      .map(([k]) => parseInt(k.replace('%+ Match', ''), 10));
    if (activeMatchScores.length > 0) {
      const minRequired = Math.min(...activeMatchScores);
      jobs = jobs.filter((j) => (j.matchScore || 0) >= minRequired);
    }

    // Industry filter
    const activeIndustries = Object.entries(industry)
      .filter(([, v]) => v)
      .map(([k]) => k.toLowerCase());
    if (activeIndustries.length > 0) {
      jobs = jobs.filter((j) =>
        activeIndustries.some((ind) => (j.industry || '').toLowerCase().includes(ind.split(' ')[0]))
      );
    }

    // Department filter
    const activeDepartments = Object.entries(department)
      .filter(([, v]) => v)
      .map(([k]) => k.toLowerCase());
    if (activeDepartments.length > 0) {
      jobs = jobs.filter((j) =>
        activeDepartments.some((dep) => (j.department || '').toLowerCase().includes(dep.split(' ')[0]))
      );
    }

    // Cities filter
    const activeCities = Object.entries(cities)
      .filter(([, v]) => v)
      .map(([k]) => k.toLowerCase());
    if (activeCities.length > 0) {
      jobs = jobs.filter((j) =>
        activeCities.some((city) => (j.location || '').toLowerCase().includes(city))
      );
    }

    // Smart Filter: Likely to Respond (using highlight status or match score as proxy)
    if (smartFilterLikelyRespond) {
      jobs = jobs.filter((j) => 
        j.isHighlighted || 
        (j.matchScore || 0) > 85
      );
    }

    return jobs;
  }, [
    jobListings,
    searchQuery,
    smartFilterSkills,
    smartFilterHighMatch,
    smartFilterLikelyRespond,
    smartFilterRemoteFriendly,
    workMode,
    experienceYears,
    salaryRanges,
    matchScore,
    industry,
    department,
    cities,
    appliedJobIds,
  ])

  const activeFilterCount = useMemo(() => {
    return [
      smartFilterSkills,
      smartFilterHighMatch,
      smartFilterLikelyRespond,
      smartFilterRemoteFriendly,
      workMode !== null,
      experienceYears < 20,
      ...Object.values(salaryRanges),
      ...Object.values(matchScore),
      ...Object.values(industry),
      ...Object.values(department),
      ...Object.values(cities),
    ].filter(Boolean).length
  }, [
    cities,
    department,
    experienceYears,
    industry,
    matchScore,
    salaryRanges,
    smartFilterHighMatch,
    smartFilterLikelyRespond,
    smartFilterRemoteFriendly,
    smartFilterSkills,
    workMode,
  ])

  const strongMatchCount = useMemo(
    () => filteredJobs.filter((job) => (job.matchScore || 0) >= 85).length,
    [filteredJobs]
  )

  // Dynamic filter counts based on actual job data
  const filterCounts = useMemo(() => {
    const counts = {
      salary: {} as Record<string, number>,
      industry: {} as Record<string, number>,
      department: {} as Record<string, number>,
      cities: {} as Record<string, number>,
    }

    // Initialize counts
    Object.keys(salaryRanges).forEach(key => counts.salary[key] = 0)
    Object.keys(industry).forEach(key => counts.industry[key] = 0)
    Object.keys(department).forEach(key => counts.department[key] = 0)
    Object.keys(cities).forEach(key => counts.cities[key] = 0)

    jobListings.forEach(job => {
      // Count salary ranges
      const salaryStr = (job.salary || '').toLowerCase();
      const numbers = salaryStr.replace(/,/g, '').match(/(\d+(\.\d+)?)/g);
      
      if (numbers) {
        let factor = 1;
        if (salaryStr.includes('lakh')) factor = 100000;
        else if (salaryStr.includes('crore')) factor = 10000000;
        
        const vals = numbers.map(n => parseFloat(n) * factor);
        const avgSalary = vals.length > 1 ? (vals[0] + vals[1]) / 2 : vals[0];

        if (avgSalary < 300000) counts.salary['0-3 Lakhs']++
        else if (avgSalary < 600000) counts.salary['3-6 Lakhs']++
        else if (avgSalary < 1000000) counts.salary['6-10 Lakhs']++
        else if (avgSalary < 1500000) counts.salary['10-15 Lakhs']++
        else if (avgSalary < 2500000) counts.salary['15-25 Lakhs']++
        else if (avgSalary < 3500000) counts.salary['25-35 Lakhs']++
        else if (avgSalary < 5000000) counts.salary['35-50 Lakhs']++
        else counts.salary['50+ Lakhs']++
      }

      // Count industries
      const jobIndustry = (job.industry || '').toLowerCase()
      Object.keys(industry).forEach(key => {
        if (jobIndustry.includes(key.toLowerCase().split(' ')[0])) {
          counts.industry[key]++
        }
      })

      // Count departments
      const jobDept = (job.department || '').toLowerCase()
      Object.keys(department).forEach(key => {
        if (jobDept.includes(key.toLowerCase().split(' ')[0])) {
          counts.department[key]++
        }
      })

      // Count cities
      const jobLoc = (job.location || '').toLowerCase()
      Object.keys(cities).forEach(key => {
        if (jobLoc.includes(key.toLowerCase()) || (key === 'Remote' && job.workMode?.toLowerCase().includes('remote'))) {
          counts.cities[key]++
        }
      })
    })

    return counts
  }, [jobListings, salaryRanges, industry, department, cities])

  const selectedJobMatchValue = selectedJob
    ? parseMatchPercentage(selectedJob.match, selectedJob.matchScore)
    : 0

  const selectedJobMatchedSkills = selectedJob
    ? selectedJob.matchedSkills?.length
      ? selectedJob.matchedSkills
      : selectedJob.skills?.slice(0, 4) || []
    : []

  const selectedJobMissingSkills = selectedJob
    ? selectedJob.missingSkills?.length
      ? selectedJob.missingSkills
      : ['Advanced Scaling', 'System Optimization']
    : []

  const selectedJobConfidenceTag =
    selectedJob?.confidenceTag || (selectedJobMatchValue >= 85 ? 'Excellent Match' : 'Partial Match')

  const Pill = ({
    label,
    active,
    onClick,
  }: {
    label: string
    active: boolean
    onClick: () => void
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2 rounded-full border text-sm transition-all duration-300 ease-out ${
        active ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  )

  const SectionHeader = ({
    title,
    open,
    onToggle,
    subtitle,
  }: {
    title: string
    open: boolean
    onToggle: () => void
    subtitle?: string
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between gap-3 text-left"
      aria-expanded={open}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {subtitle ? <p className="text-xs font-semibold text-blue-600 mt-0.5">{subtitle}</p> : null}
      </div>
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#6B7280"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
  )

  const JobLogoBadge = ({ job, compact = false }: { job: JobListing; compact?: boolean }) => {
    const logoSrc = job.logo && job.logo !== '/perosn_icon.png' ? job.logo : null
    const monogram = getMonogram(job.company)

    return (
      <div
        className={`relative overflow-hidden rounded-[18px] border border-white/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.92)] ${
          compact ? 'h-11 w-11' : 'h-12 w-12'
        }`}
      >
        {logoSrc ? (
          <Image
            src={logoSrc}
            alt={`${job.company} logo`}
            fill
            className="object-contain"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(40,168,225,0.16),transparent_65%),linear-gradient(180deg,rgba(255,255,255,0.96),rgba(240,247,255,0.92))]">
            <span className={`font-semibold tracking-[0.12em] text-slate-600 ${compact ? 'text-[12px]' : 'text-[13px]'}`}>
              {monogram}
            </span>
          </div>
        )}
      </div>
    )
  }

  const SummaryStat = ({
    label,
    value,
  }: {
    label: string
    value: string
  }) => (
    <div className="rounded-[18px] border border-white/70 bg-white/80 px-4 py-3 shadow-[0_12px_28px_rgba(15,23,42,0.05)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  )

  const renderJobCard = (job: JobListing, isCompact = false) => {
    const isSelected = selectedJob?.id === job.id && isCompact
    const when = (job.timeAgo || job.postedDate || '').toString()
    const isSaved = isSavedJob(job.id)
    const isApplied = appliedJobIds.has(String(job.id))
    const skills = Array.isArray(job.skills) ? job.skills : []
    const shownSkills = skills.slice(0, isCompact ? 2 : 3)
    const metaLocation = job.location || 'Location not specified'
    const metaSalary = job.salary || 'Salary not specified'
    const metaType = job.type ? job.type.replace(/_/g, ' ') : 'Role type not specified'
    const metaMode = job.workMode ? job.workMode.replace(/_/g, ' ') : ''
    const matchBadge = isPersonalized ? `AI Fit ${job.match}` : job.match
    const confidenceBadgeClasses = getConfidenceBadgeClasses(job.confidenceTag)
    const matchLabelClasses = getMatchLabelClasses(job.matchLabel)
    const scoreBadgeClasses = getScoreBadgeClasses(job.scoreColorHint)
    const topMatchedSkills = Array.isArray(job.topMatchedSkills) ? job.topMatchedSkills.slice(0, isCompact ? 2 : 3) : []
    const topMissingSkills = Array.isArray(job.topMissingSkills) ? job.topMissingSkills.slice(0, isCompact ? 2 : 3) : []

    return (
      <div
        key={job.id}
        onClick={() => {
          handleJobClick(job)
          if (!isCompact) setViewMode('detail')
        }}
        className={`group relative flex w-full max-w-full cursor-pointer flex-col overflow-hidden rounded-[24px] border p-4 transition-all duration-300 ${
          isSelected
            ? 'border-[rgba(40,168,225,0.30)] bg-[linear-gradient(180deg,rgba(40,168,225,0.10),rgba(255,255,255,0.96))] shadow-[0_18px_40px_rgba(40,168,225,0.12)]'
            : 'border-white/80 bg-white/88 shadow-[0_14px_34px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]'
        } ${isCompact ? 'mb-3' : 'h-full'}`}
      >
        {isSelected ? (
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#28A8E1] via-[#28A8DF] to-[#FC9620]" />
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <JobLogoBadge job={job} compact={isCompact} />
            <div className="min-w-0">
              <p className="truncate text-[12px] font-semibold text-slate-500">{job.company}</p>
              <h3 className={`mt-0.5 line-clamp-2 font-semibold tracking-tight text-slate-950 ${isCompact ? 'text-[17px] leading-[1.25]' : 'text-[19px]'}`}>
                {job.title}
              </h3>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!isCompact ? <span className="hidden text-[11px] font-medium text-slate-400 sm:inline">{when}</span> : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                handleSaveJob(job)
              }}
              aria-label={isSaved ? 'Remove saved job' : 'Save job'}
              className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ${
                isSaved
                  ? 'border-[rgba(40,168,225,0.24)] bg-[rgba(40,168,225,0.12)] text-[#28A8E1]'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {isSaved ? (
                <BookmarkCheck className="h-4 w-4" strokeWidth={2.1} />
              ) : (
                <Bookmark className="h-4 w-4" strokeWidth={2.1} />
              )}
            </button>
          </div>
        </div>

        {/* Meta line (Location • Salary • Type) */}
        <div className="hidden mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-slate-500">
          <span
            className={`wrap-break-word transition-colors duration-500 ${isCompact ? (isSelected ? 'text-gray-400' : 'text-gray-500') : 'text-gray-500 group-hover:text-gray-300'}`}
            style={{ fontSize: isCompact ? "11px" : "12px" }}
          >
            {job.location}
          </span>
          <span className={`opacity-50 ${isCompact ? (isSelected ? 'text-gray-500' : 'text-gray-400') : 'text-gray-400 group-hover:text-gray-500'}`}>•</span>
          <span
            className={`wrap-break-word font-semibold transition-colors duration-500 ${isCompact ? (isSelected ? 'text-gray-300' : 'text-blue-700') : 'text-blue-700 group-hover:text-blue-300'}`}
            style={{ fontSize: isCompact ? "11px" : "12px" }}
          >
            {job.salary}
          </span>
          <span className={`opacity-50 ${isCompact ? (isSelected ? 'text-gray-500' : 'text-gray-400') : 'text-gray-400 group-hover:text-gray-500'}`}>•</span>
          <span
            className={`wrap-break-word transition-colors duration-500 ${isCompact ? (isSelected ? 'text-gray-400' : 'text-gray-500') : 'text-gray-500 group-hover:text-gray-300'}`}
            style={{ fontSize: isCompact ? "11px" : "12px" }}
          >
            {job.type}
          </span>
        </div>

        {/* Skills Tags */}
        <div className={`hidden flex flex-wrap gap-1.5 ${isCompact ? 'mb-1.5' : 'mb-2'}`}>
          {job.skills.slice(0, isCompact ? 3 : 4).map((skill, index) => (
            <span
              key={index}
              className={`px-2.5 py-1 rounded-full font-medium transition-colors duration-500 shrink-0 wrap-break-word ${
                isCompact
                  ? (isSelected ? 'bg-white/10 text-gray-200 border border-white/15' : 'bg-gray-100 text-gray-700 border border-gray-200')
                  : 'bg-gray-100 text-gray-700 border border-gray-200 group-hover:bg-gray-800 group-hover:text-gray-200 group-hover:border-white/10'
              }`}
              style={{ fontSize: "11px" }}
            >
              {skill}
            </span>
          ))}
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-medium text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400" strokeWidth={2.1} />
              <span className="wrap-break-word">{metaLocation}</span>
            </span>
            <span className="text-slate-300" aria-hidden="true">&middot;</span>
            <span className="wrap-break-word font-semibold text-[#28A8E1]">{metaSalary}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <span>{metaType}</span>
            {metaMode ? (
              <>
                <span className="text-slate-300" aria-hidden="true">&middot;</span>
                <span>{metaMode}</span>
              </>
            ) : null}
          </div>
        </div>

        <div className={`mt-3 flex flex-wrap gap-1.5 ${isCompact ? '' : 'mb-1'}`}>
          {shownSkills.map((skill, index) => (
            <span
              key={`${job.id}-card-skill-${index}`}
              className="inline-flex rounded-full border border-slate-200 bg-white/78 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-[0_8px_18px_rgba(15,23,42,0.04)]"
            >
              {skill}
            </span>
          ))}
        </div>

        {(topMatchedSkills.length > 0 || topMissingSkills.length > 0) ? (
          <div className="mt-3 space-y-2">
            {topMatchedSkills.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Matched</span>
                {topMatchedSkills.map((skill, index) => (
                  <span
                    key={`${job.id}-top-matched-${index}`}
                    className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}

            {topMissingSkills.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Missing</span>
                {topMissingSkills.map((skill, index) => (
                  <span
                    key={`${job.id}-top-missing-${index}`}
                    className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {job.reasoning || job.whyNotMatched ? (
          <div className="mt-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-slate-600">
              {job.whyNotMatched && (job.matchScore || 0) < 55 ? job.whyNotMatched : job.reasoning}
            </p>
          </div>
        ) : null}

        <div className={`mt-4 flex items-end justify-between gap-3 ${isCompact ? '' : 'mt-auto'}`}>
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${scoreBadgeClasses}`}>
                {matchBadge}
              </span>
              {job.matchLabel ? (
                <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${matchLabelClasses}`}>
                  {job.matchLabel}
                </span>
              ) : null}
              {job.confidenceTag ? (
                <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${confidenceBadgeClasses}`}>
                  {job.confidenceTag}
                </span>
              ) : null}
              {isApplied ? (
                <span className="inline-flex rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                  Applied
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
              <Clock3 className="h-3.5 w-3.5" strokeWidth={2.1} />
              <span>{when}</span>
            </div>
          </div>

        </div>

        <div className={`hidden mt-4 flex flex-wrap items-center justify-between gap-3 ${isCompact ? '' : 'mt-auto'}`}>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-[rgba(40,168,225,0.10)] px-3 py-1 text-[11px] font-semibold text-[#28A8E1]">
              {isPersonalized ? `AI Fit ${job.match}` : job.match}
            </span>
            {job.confidenceTag ? (
              <span className="inline-flex rounded-full bg-[rgba(252,150,32,0.12)] px-3 py-1 text-[11px] font-semibold text-[#FC9620]">
                {job.confidenceTag}
              </span>
            ) : null}
            {isApplied ? (
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/80">
                Applied
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderJobListItem = (job: JobListing) => {
    const when = (job.timeAgo || job.postedDate || '').toString()
    const skills = Array.isArray(job.skills) ? job.skills : []
    return (
      <div
        key={job.id}
        onClick={() => {
          handleJobClick(job);
          setViewMode('detail');
        }}
        className="group w-full cursor-pointer rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 transition-all duration-300 ease-out hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <JobLogoBadge job={job} />

          {/* Left content */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-900 truncate">{job.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 min-w-0">
              <span className="truncate">{job.company}</span>
              <span className="text-gray-300">•</span>
              <span className="truncate">{job.location}</span>
              <span className="text-gray-300">•</span>
              <span className="font-semibold text-blue-700 truncate">{job.salary}</span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-blue-700">
                {job.type}
              </span>
              {skills.slice(0, 4).map((s, idx) => (
                <span
                  key={`${job.id}-list-skill-${idx}`}
                  className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 font-medium">
              <Clock3 className="h-4 w-4 text-gray-400" strokeWidth={2.1} />
              <span className="whitespace-nowrap">{when}</span>
            </div>

            <span className="inline-flex items-center rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
              {isPersonalized ? `AI Fit ${job.match}` : job.match}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>

      <main className="w-full grow overflow-x-clip">
        <DashboardContainer className="pt-3 pb-6 sm:pt-4 sm:pb-8 lg:pt-4 lg:pb-10">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-8">
            {/* LIST/GRID VIEW */}
            {viewMode !== 'detail' ? (
              <>
                {/* Top Header Area */}
                <DashboardPanel className="relative mb-6 overflow-hidden px-5 py-5 sm:px-6 sm:py-6">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(40,168,225,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(252,150,32,0.10),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(40,168,223,0.12),transparent_30%)]" />

                  <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-3xl min-w-0 space-y-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(40,168,225,0.18)] bg-white/78 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#28A8E1]">
                        <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                        {isPersonalized ? 'Profile matched roles' : 'Jobs discovery'}
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-4">
                          <button
                            onClick={() => router.back()}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                            title="Go Back"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m15 18-6-6 6-6" />
                            </svg>
                          </button>
                          <h1 className="text-[2rem] font-semibold tracking-tight text-slate-950 sm:text-[2.25rem]">
                            Explore Jobs
                          </h1>
                          {isPersonalized ? (
                            <span className="inline-flex items-center rounded-full bg-[rgba(40,168,225,0.10)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#28A8E1]">
                              Profile matched
                            </span>
                          ) : null}
                        </div>

                        <p className="max-w-2xl text-[14px] font-medium leading-6 text-slate-600">
                          {isPersonalized
                            ? 'Curated roles based on your current profile, experience signals, and application intent.'
                            : 'Search the current market, compare fit signals, and jump into the roles worth your time.'}
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3 xl:max-w-[560px]">
                        <SummaryStat label="Matches" value={String(filteredJobs.length)} />
                        <SummaryStat label="Strong Fit" value={String(strongMatchCount)} />
                        <SummaryStat label="Saved" value={String(savedJobIds.length)} />
                      </div>
                    </div>

                    <div className="w-full xl:max-w-[380px]">
                      <label className="relative block">
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" strokeWidth={2.2} />
                        <input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search jobs, companies, or keywords..."
                          className="w-full rounded-[20px] border border-white/80 bg-white/90 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 shadow-[0_14px_32px_rgba(15,23,42,0.06)] outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[rgba(40,168,225,0.24)] focus:ring-4 focus:ring-[rgba(40,168,225,0.10)]"
                        />
                      </label>
                    </div>
                  </div>
                </DashboardPanel>

                <div className="hidden flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Explore Jobs</h1>
                      {isPersonalized && (
                         <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-100 uppercase tracking-wider">
                           Profile Matched
                         </span>
                      )}
                    </div>
                    <p className="text-gray-500 font-medium">
                      {isPersonalized 
                        ? "Currently showing only roles perfectly aligned with your active profile."
                        : "Find roles that match your profile and preferences."}
                    </p>
                  </div>
                  <div className="w-full sm:w-[360px]">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search jobs, companies, or keywords…"
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    />
                  </div>
                </div>

                {/* Main Grid */}
                <div className="mt-6 grid grid-cols-12 gap-5 items-start relative">
              {/* Sidebar filters — sticky floating */}
              <aside className="col-span-12 lg:col-span-4 xl:col-span-3 sticky top-[72px] self-start z-20">
                <div className="dashboard-surface rounded-[24px] border border-white/80 p-6 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">Filters</p>
                      <span className="inline-flex rounded-full bg-[rgba(40,168,225,0.10)] px-2.5 py-1 text-[11px] font-semibold text-[#28A8E1]">
                        {activeFilterCount}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      Reset Filters
                    </button>
                  </div>

                  <div className="dashboard-scrollbar mt-5 max-h-[calc(100vh-180px)] overflow-y-auto pr-1 space-y-5">
                    {/* Smart Filters */}
                    <div className="space-y-4">
                      <SectionHeader
                        title="Smart Filters"
                        subtitle="Powered by SAASA AI"
                        open={smartFiltersOpen}
                        onToggle={() => setSmartFiltersOpen((v) => !v)}
                      />
                      {smartFiltersOpen ? (
                        <div className="space-y-3">
                          {[
                            { label: 'Jobs matching my skills', value: smartFilterSkills, onChange: setSmartFilterSkills },
                            { label: 'High match score (80%+)', value: smartFilterHighMatch, onChange: setSmartFilterHighMatch },
                            { label: 'Companies likely to respond', value: smartFilterLikelyRespond, onChange: setSmartFilterLikelyRespond },
                            { label: 'Remote-friendly companies', value: smartFilterRemoteFriendly, onChange: setSmartFilterRemoteFriendly },
                          ].map((row) => (
                            <label key={row.label} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={row.value}
                                onChange={(e) => row.onChange(e.target.checked)}
                                className="h-4 w-4"
                              />
                              <span className="text-sm text-gray-700">{row.label}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <p className="text-xs tracking-widest text-gray-400 font-bold uppercase">Job Preferences</p>

                    {/* Work Mode */}
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-900">Work Mode</p>
                      <div className="flex flex-wrap gap-2">
                        <Pill label="Remote" active={workMode === 'Remote'} onClick={() => setWorkMode(workMode === 'Remote' ? null : 'Remote')} />
                        <Pill label="Hybrid" active={workMode === 'Hybrid'} onClick={() => setWorkMode(workMode === 'Hybrid' ? null : 'Hybrid')} />
                        <Pill label="On-site" active={workMode === 'On-site'} onClick={() => setWorkMode(workMode === 'On-site' ? null : 'On-site')} />
                      </div>
                    </div>

                    {/* Experience */}
                    <div className="space-y-3">
                      <SectionHeader title="Experience" open={experienceOpen} onToggle={() => setExperienceOpen((v) => !v)} />
                      {experienceOpen ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[13px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                              {experienceYears === 20 ? 'Any Experience' : `${experienceYears} Yrs Max`}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-gray-400 font-bold uppercase tracking-wider">
                              <span>0 Yrs</span>
                              <span>Any</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={20}
                              value={experienceYears}
                              onChange={(e) => setExperienceYears(Number(e.target.value))}
                              className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Salary */}
                    <div className="space-y-3">
                      <SectionHeader title="Salary" open={salaryOpen} onToggle={() => setSalaryOpen((v) => !v)} />
                      {salaryOpen ? (
                        <div className="space-y-3">
                          {Object.entries(salaryRanges)
                            .slice(0, showMoreSalary ? undefined : 4)
                            .map(([label, checked]) => (
                            <label key={label} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => setSalaryRanges((prev) => ({ ...prev, [label]: e.target.checked }))}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-700">{label}</span>
                              </span>
                              <span className="text-xs text-gray-500">{filterCounts.salary[label] || 0}</span>
                            </label>
                          ))}
                          {Object.keys(salaryRanges).length > 4 && (
                            <button 
                              type="button" 
                              onClick={() => setShowMoreSalary(!showMoreSalary)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              {showMoreSalary ? 'View Less' : 'View More'}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Match Score */}
                    <div className="space-y-3">
                      <SectionHeader title="Match Score" open={matchOpen} onToggle={() => setMatchOpen((v) => !v)} />
                      {matchOpen ? (
                        <div className="space-y-3">
                          {['80%+ Match', '70%+ Match', '60%+ Match'].map((label) => (
                            <label key={label} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={Boolean(matchScore[label])}
                                onChange={(e) => setMatchScore((prev) => ({ ...prev, [label]: e.target.checked }))}
                                className="h-4 w-4"
                              />
                              <span className="text-sm text-gray-700">{label}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <p className="text-xs tracking-widest text-gray-400 font-bold uppercase">Company Filters</p>

                    {/* Industry */}
                    <div className="space-y-3">
                      <SectionHeader title="Industry" open={industryOpen} onToggle={() => setIndustryOpen((v) => !v)} />
                      {industryOpen ? (
                        <div className="space-y-3">
                          {Object.entries(industry)
                            .slice(0, showMoreIndustry ? undefined : 4)
                            .map(([label, checked]) => (
                            <label key={label} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => setIndustry((prev) => ({ ...prev, [label]: e.target.checked }))}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-700">{label}</span>
                              </span>
                              <span className="text-xs text-gray-500">{filterCounts.industry[label] || 0}</span>
                            </label>
                          ))}
                          {Object.keys(industry).length > 4 && (
                            <button 
                              type="button" 
                              onClick={() => setShowMoreIndustry(!showMoreIndustry)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              {showMoreIndustry ? 'View Less' : 'View More'}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Department */}
                    <div className="space-y-3">
                      <SectionHeader title="Department" open={departmentOpen} onToggle={() => setDepartmentOpen((v) => !v)} />
                      {departmentOpen ? (
                        <div className="space-y-3">
                          {Object.entries(department)
                            .slice(0, showMoreDepartment ? undefined : 4)
                            .map(([label, checked]) => (
                            <label key={label} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => setDepartment((prev) => ({ ...prev, [label]: e.target.checked }))}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-700">{label}</span>
                              </span>
                              <span className="text-xs text-gray-500">{filterCounts.department[label] || 0}</span>
                            </label>
                          ))}
                          {Object.keys(department).length > 4 && (
                            <button 
                              type="button" 
                              onClick={() => setShowMoreDepartment(!showMoreDepartment)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              {showMoreDepartment ? 'View Less' : 'View More'}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>

                    <p className="text-xs tracking-widest text-gray-400 font-bold uppercase">Location</p>

                    {/* Cities */}
                    <div className="space-y-3">
                      <SectionHeader title="Cities" open={citiesOpen} onToggle={() => setCitiesOpen((v) => !v)} />
                      {citiesOpen ? (
                        <div className="space-y-3">
                          {Object.entries(cities)
                            .slice(0, showMoreCities ? undefined : 4)
                            .map(([label, checked]) => (
                            <label key={label} className="flex items-center justify-between gap-3">
                              <span className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => setCities((prev) => ({ ...prev, [label]: e.target.checked }))}
                                  className="h-4 w-4"
                                />
                                <span className="text-sm text-gray-700">{label}</span>
                              </span>
                              <span className="text-xs text-gray-500">{filterCounts.cities[label] || 0}</span>
                            </label>
                          ))}
                          {Object.keys(cities).length > 4 && (
                            <button 
                              type="button" 
                              onClick={() => setShowMoreCities(!showMoreCities)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              {showMoreCities ? 'View Less' : 'View More'}
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </aside>

              {/* Main results */}
              <section className="col-span-12 lg:col-span-8 xl:col-span-9">
                {/* Header + view switcher */}
                <div className="dashboard-surface rounded-[24px] border border-white/80 p-5 shadow-[0_16px_34px_rgba(15,23,42,0.05)]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs tracking-widest text-[#28A8DF] font-black uppercase flex items-center gap-2">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM11 16h2v2h-2v-2zm0-10h2v8h-2V6z"/></svg>
                        {isPersonalized ? "Elite AI Matches for your Profile" : "Recommended for you"}
                      </p>
                      <p className="mt-1 text-sm text-gray-600 font-bold">
                        {loading ? 'Analyzing your profile…' : `Identified ${filteredJobs.length} potential career matches`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex p-1 bg-gray-100 rounded-xl">
                        <button
                          onClick={() => setDisplayMode('grid')}
                          className={`p-2 rounded-lg transition-all ${
                            displayMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title="Grid View"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H18a2.25 2.25 0 01-2.25-2.25v-2.25z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setDisplayMode('list')}
                          className={`p-2 rounded-lg transition-all ${
                            displayMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'
                          }`}
                          title="List View"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 h-[140px] animate-pulse" />
                      ))}
                    </div>
                  ) : displayMode === 'grid' ? (
                    <div className="dashboard-scrollbar overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        {filteredJobs.map((job) => renderJobCard(job))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-5">
                      {filteredJobs.map((job) => renderJobListItem(job))}
                    </div>
                  )}
                  {false ? (
                    <div className={displayMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 gap-5' : 'flex flex-col gap-5'}>
                      {filteredJobs.map((job) => {
                        const matchBadge = job.match || '80% Match'
                        const when = (job.timeAgo || job.postedDate || '').toString()
                        const skills = Array.isArray(job.skills) ? job.skills : []
                        return (
                          <button
                            key={job.id}
                            type="button"
                            onClick={() => {
                              handleJobClick(job)
                              setViewMode('detail')
                            }}
                            className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 ease-out p-5"
                          >
                            <div className="flex items-start gap-4">
                              <div className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 grid place-items-center shrink-0">
                                <Image src="/perosn_icon.png" alt={job.company} width={28} height={28} />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                                <p className="text-sm text-gray-500 truncate">{job.company}</p>

                                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500">
                                  <span className="truncate">{job.location}</span>
                                  <span className="text-gray-300">•</span>
                                  <span className="font-semibold text-blue-700 truncate">{job.salary}</span>
                                  <span className="text-gray-300">•</span>
                                  <span className="truncate">{job.type}</span>
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                                    {job.workMode}
                                  </span>
                                  {skills.slice(0, 4).map((s, idx) => (
                                    <span
                                      key={`${job.id}-skill-${idx}`}
                                      className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>

                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 font-medium">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="whitespace-nowrap">{when}</span>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-3 shrink-0">
                                <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700">
                                  {matchBadge}
                                </span>
                                <span className="inline-flex items-center justify-center rounded-xl bg-[#28A8DF] px-4 py-2 text-sm font-semibold text-white">
                                  Details
                                </span>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              </section>
                </div>
              </>
            ) : null}

          {/* Main Content Area */}
          {viewMode === 'detail' ? (
            <div ref={detailsRef} className="w-full min-w-0">
              {/* Back Button */}
              <button
                onClick={handleBackToGrid}
                className="flex items-center gap-1.5 sm:gap-2 text-gray-600 hover:text-gray-900 font-medium mb-3 sm:mb-4 md:mb-5 lg:mb-6 transition-colors"
                style={{ fontSize: "clamp(11px, 1.3vw, 14px)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "clamp(14px, 1.8vw, 20px)", height: "clamp(14px, 1.8vw, 20px)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                <span className="wrap-break-word">Back </span>
              </button>

              <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)] min-w-0">
                {/* Left Sidebar - Job Listings */}
                <div className="min-w-0">
                  <div
                    className="sticky top-[92px] flex h-[calc(100vh-100px)] w-full max-w-full flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/82 p-4 sm:p-5 lg:p-6 xl:p-7 shadow-[0_18px_40px_rgba(15,23,42,0.06)] backdrop-blur-md"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3 px-1 shrink-0 min-w-0">
                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">Most Recent Jobs</h2>
                        <p className="mt-1 text-[12px] font-medium text-slate-500">{filteredJobs.length} roles in this view</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleBackToGrid}
                        className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-all duration-200 hover:border-[rgba(40,168,225,0.24)] hover:text-[#28A8E1]"
                      >
                        View All
                      </button>
                    </div>

                    <div className="dashboard-scrollbar flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
                      {jobListings.map(job => renderJobCard(job, true))}
                    </div>
                  </div>
                </div>

                {/* Right Content - Job Details */}
                <div className="flex-1 min-w-0">
                  {selectedJob ? (
                    <div className="w-full max-w-full overflow-hidden rounded-[28px] border border-white/80 bg-white/82 p-4 shadow-[0_18px_42px_rgba(15,23,42,0.06)] backdrop-blur-md sm:p-5 lg:p-6 xl:p-7">
                      <div className="mb-0 min-w-0">
                        {/* Header Section */}
                        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between min-w-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex min-w-0 items-start gap-4">
                              <JobLogoBadge job={selectedJob} />
                              <div className="min-w-0">
                                <h1 className="wrap-break-word text-[clamp(22px,2.4vw,32px)] font-semibold tracking-tight text-slate-950">{selectedJob.title}</h1>
                                <p className="mt-1 wrap-break-word text-[15px] font-medium text-slate-500">{selectedJob.company} • {selectedJob.location}</p>
                                <p className="mt-2 wrap-break-word text-[14px] font-medium text-slate-500">{selectedJob.salary} • {selectedJob.experienceLevel} Experience</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 shrink-0">
                            <button onClick={handleApplyNow} className="inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-[#28A8E1] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_14px_28px_rgba(40,168,225,0.22)] transition-all duration-200 hover:bg-[#28A8DF]">
                              Apply Now
                            </button>
                            <button onClick={() => handleSaveJob(selectedJob)} className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-[rgba(40,168,225,0.24)] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#28A8E1] transition-all duration-200 hover:bg-[rgba(40,168,225,0.08)]">
                              {isSavedJob(selectedJob.id) ? 'Saved' : 'Save Job'}
                            </button>
                          </div>
                        </div>

                        <div className="h-px bg-gray-200 w-full mb-4 sm:mb-5 md:mb-6 lg:mb-7 xl:mb-8"></div>

                        <div className="space-y-6 min-w-0">
                          <section className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Job Title *</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">{selectedJob.title || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">For Which Company</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">{selectedJob.company || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Location</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">{selectedJob.location || '-'}</p>
                            </div>
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Salary</p>
                              <p className="mt-1 text-sm font-bold text-slate-900">{selectedJob.salary || '-'}</p>
                            </div>
                          </section>

                          <section className="rounded-2xl border border-slate-100 bg-white p-5">
                            <h3 className="text-lg font-bold text-slate-900">Job Summary</h3>
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                              {selectedJob.description || selectedJob.companyOverview || 'No job summary available.'}
                            </p>
                          </section>

                          <section className="rounded-2xl border border-slate-100 bg-white p-5">
                            <h3 className="text-lg font-bold text-slate-900">Key Responsibilities</h3>
                            <div className="mt-3 space-y-2">
                              {selectedJob.responsibilities?.length ? selectedJob.responsibilities.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-2.5">
                                  <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[#28A8E1]" />
                                  <p className="text-sm leading-7 text-slate-600">{item}</p>
                                </div>
                              )) : (
                                <p className="text-sm text-slate-500">No key responsibilities available.</p>
                              )}
                            </div>
                          </section>

                          <section className="rounded-2xl border border-slate-100 bg-white p-5">
                            <h3 className="text-lg font-bold text-slate-900">Qualifications and Experience</h3>
                            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Experience</p>
                                <p className="mt-1 text-sm font-semibold text-slate-700">{selectedJob.experienceLevel || '-'}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Education</p>
                                <p className="mt-1 text-sm font-semibold text-slate-700">{(selectedJob as any).education || '-'}</p>
                              </div>
                            </div>
                            {selectedJob.requiredSkills?.length ? (
                              <div className="mt-4">
                                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">Required Skills</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {selectedJob.requiredSkills.map((skill, idx) => (
                                    <span key={idx} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </section>

                          <section className="rounded-2xl border border-slate-100 bg-white p-5">
                            <h3 className="text-lg font-bold text-slate-900">Compensation & Benefits</h3>
                            <p className="mt-3 text-sm font-semibold text-slate-700">
                              Compensation: {selectedJob.salary || '-'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {Array.isArray((selectedJob as any).benefits) && (selectedJob as any).benefits.length > 0 ? (
                                (selectedJob as any).benefits.map((benefit: string, idx: number) => (
                                  <span key={idx} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                                    {benefit}
                                  </span>
                                ))
                              ) : (
                                <p className="text-sm text-slate-500">No additional benefits listed.</p>
                              )}
                            </div>
                          </section>
                        </div>

                        {/* AI Match Analysis Matrix (Global AI Assistant Integrated) */}
                        {(() => {
                          const selectedJobMatchValue = parseMatchPercentage(selectedJob.match, selectedJob.matchScore);
                          const selectedJobConfidenceTag = selectedJob.confidenceTag || (selectedJobMatchValue >= 85 ? 'Excellent Alignment' : selectedJobMatchValue >= 60 ? 'Partial Match' : 'Gap Identified');
                          const selectedJobMatchedSkills = selectedJob.matchedSkills || [];
                          const selectedJobMissingSkills = selectedJob.missingSkills || [];

                          return (selectedJob.reasoning || selectedJob.matchScore) ? (
                            <section className="mt-8 w-full">
                              <div
                                className="rounded-3xl p-[1px] bg-gradient-to-br from-[#28A8E1] via-[#28A8DF] to-[#FC9620]"
                                style={{ boxShadow: "0 16px 36px -18px rgba(40, 168, 225, 0.28)" }}
                              >
                                <div className="overflow-hidden rounded-[23px] bg-white/95 backdrop-blur-xl">
                                  <div className="grid gap-0 lg:grid-cols-[35%_65%]">
                                    <div className="relative border-b border-slate-100 bg-[linear-gradient(180deg,rgba(40,168,225,0.12),rgba(40,168,225,0.04))] px-6 py-3 sm:px-8 lg:border-b-0 lg:border-r">
                                      <div className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-[radial-gradient(circle_at_top,rgba(40,168,225,0.20),transparent_72%)]" />

                                      <div className="relative flex flex-col items-center gap-2.5">
                                        {/* 1. Partial Match Tag - Centered */}
                                        <div className="flex justify-center">
                                          <div className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] shadow-sm ${getConfidenceBadgeClasses(selectedJobConfidenceTag)}`}>
                                            {selectedJobConfidenceTag}
                                          </div>
                                        </div>

                                        {/* 2. Description - Below Tag, Centered */}
                                        <div className="flex justify-center">
                                          <p className="max-w-[280px] text-center text-[12px] font-medium leading-relaxed text-slate-500">
                                            Your strongest overlap comes from matching core profile health metrics.
                                          </p>
                                        </div>

                                        {/* 3. Market Alignment Tag - Centered */}
                                        <div className="mt-1 text-center">
                                          <div className="inline-flex rounded-full border border-[rgba(40,168,225,0.20)] bg-white/80 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#28A8E1]">
                                            Market alignment
                                          </div>
                                        </div>

                                        {/* 4. Circle Graph - Centered & Larger */}
                                        <div className="relative mx-auto h-24 w-24">
                                          <svg className="h-24 w-24 -rotate-90" viewBox="0 0 120 120">
                                            <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                            <circle
                                              cx="60"
                                              cy="60"
                                              r="50"
                                              stroke="currentColor"
                                              strokeWidth="12"
                                              fill="transparent"
                                              strokeDasharray={314}
                                              strokeDashoffset={314 - (314 * selectedJobMatchValue) / 100}
                                              strokeLinecap="round"
                                              className="text-[#28A8E1]"
                                            />
                                          </svg>
                                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-[24px] font-bold tracking-tight text-slate-950 leading-none">{selectedJobMatchValue}%</span>
                                            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500 mt-0.5">Match</span>
                                          </div>
                                        </div>

                                        {/* 5. Button - Centered */}
                                        <button
                                          onClick={() => router.push('/lms/resume-builder/editor')}
                                          className="mt-2 relative inline-flex h-fit w-full items-center justify-center rounded-xl bg-[#28A8E1] px-4 py-2.5 text-[12px] font-bold text-white shadow-[0_10px_20px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF] active:scale-[0.99]"
                                        >
                                          Optimize My CV
                                        </button>
                                      </div>
                                    </div>

                                    <div className="space-y-3 px-6 py-4 sm:px-7">
                                      <div className="flex flex-wrap items-center gap-3">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-[rgba(40,168,225,0.16)] bg-[rgba(40,168,225,0.08)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#28A8E1]">
                                          <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                                          AI Matching Insight
                                        </div>
                                        <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-500">
                                          Score signal: {selectedJob.match}
                                        </div>
                                      </div>

                                      <p className="max-w-3xl text-[15px] leading-7 text-slate-600">
                                        &ldquo;
                                        {selectedJob.reasoning ||
                                          'Based on your technical background and experience, you are a competitive candidate for this role. Key overlaps found in core technical stacks.'}
                                        &rdquo;
                                      </p>

                                      <div className="grid gap-4 xl:grid-cols-2">
                                          <div className="rounded-[20px] border border-emerald-100 bg-emerald-50/60 p-3">
                                            <div className="flex items-center gap-2">
                                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2.2} />
                                              <h5 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">Where You Align</h5>
                                            </div>
                                            <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500">
                                              Profile health metrics that likely strengthen your shortlist ranking.
                                            </p>
                                          <div className="mt-4 flex flex-wrap gap-2">
                                            {selectedJobMatchedSkills.map((skill, index) => (
                                              <span
                                                key={`${selectedJob.id}-matched-${index}`}
                                                className="inline-flex rounded-full border border-emerald-200 bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-emerald-700"
                                              >
                                                {skill}
                                              </span>
                                            ))}
                                          </div>
                                        </div>

                                          <div className="rounded-[20px] border border-[rgba(252,150,32,0.18)] bg-[rgba(252,150,32,0.08)] p-3">
                                            <div className="flex items-center gap-2">
                                              <AlertTriangle className="h-3.5 w-3.5 text-[#FC9620]" strokeWidth={2.2} />
                                              <h5 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d97706]">Strengthen Next</h5>
                                            </div>
                                            <p className="mt-1 text-[11px] font-medium leading-4 text-slate-500">
                                              Focus areas worth tightening to improve alignment.
                                            </p>
                                          <div className="mt-4 flex flex-wrap gap-2">
                                            {selectedJobMissingSkills.map((skill, index) => (
                                              <span
                                                key={`${selectedJob.id}-gap-${index}`}
                                                className="inline-flex rounded-full border border-[rgba(252,150,32,0.18)] bg-white/85 px-3 py-1.5 text-[11px] font-semibold text-[#c2410c]"
                                              >
                                                {skill}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </section>
                          ) : null;
                        })()}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-transparent p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 flex items-center justify-center min-h-[350px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px] flex-col gap-3 sm:gap-4 text-center min-w-0">
                      <div className="bg-white/50 rounded-full flex items-center justify-center shrink-0" style={{ width: "clamp(48px, 6vw, 64px)", height: "clamp(48px, 6vw, 64px)" }}>
                        <svg className="text-[#9095A1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ width: "clamp(24px, 3vw, 32px)", height: "clamp(24px, 3vw, 32px)" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-medium text-gray-900 wrap-break-word" style={{ fontSize: "clamp(14px, 1.8vw, 18px)" }}>Select a job to view details</h3>
                        <p className="text-gray-500 mt-1 wrap-break-word" style={{ fontSize: "clamp(11px, 1.3vw, 14px)" }}>Click on any job card from the list to see full requirements and apply.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          </div>
        </DashboardContainer>
      </main>

      {
        isScreeningModalOpen && selectedJob && (
          <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pb-4 pt-24 sm:pt-28">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCloseModal} />
            <div
              className="z-10 w-full max-w-[520px] overflow-y-auto rounded-lg bg-white shadow-xl"
              style={{
                maxHeight: "calc(100vh - 140px)",
                borderRadius: "10px",
                boxShadow: "0 0 2px 0 rgba(23, 26, 31, 0.20), 0 0 1px 0 rgba(23, 26, 31, 0.07)"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-2">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Screening Questions</h2>
                <p className="text-base text-gray-700 mb-1">{selectedJob.title} — {selectedJob.company}</p>
                <p className="text-sm text-gray-600 mb-2">These quick questions help us understand if you are a good fit for the role</p>
              </div>

              {/* Questions */}
              <div className="px-6 pt-2 pb-6 space-y-8">
                {/* Question 1: Experience */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Do you have at least 2 years of experience for this role?
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setExperienceAnswer('yes')}
                      className={`px-6 py-2.5 rounded-lg border-2 transition-colors ${experienceAnswer === 'yes'
                        ? 'border-blue-500 bg-blue-50 text-blue-600 font-medium'
                        : 'border-blue-200 bg-white text-gray-900 hover:border-blue-300'
                        }`}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setExperienceAnswer('no')}
                      className={`px-6 py-2.5 rounded-lg border-2 transition-colors ${experienceAnswer === 'no'
                        ? 'border-blue-500 bg-blue-50 text-blue-600 font-medium'
                        : 'border-blue-200 bg-white text-gray-900 hover:border-blue-300'
                        }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                {/* Question 2: Night Shift */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Are you willing to work in Night Shift?
                  </label>
                  <div className="relative">
                    <select
                      value={nightShiftValue}
                      onChange={(e) => setNightShiftValue(e.target.value)}
                      onFocus={() => setNightShiftFocused(true)}
                      onBlur={() => setNightShiftFocused(false)}
                      className={`w-full px-4 py-2.5 rounded-lg border-2 appearance-none bg-white text-gray-900 ${nightShiftFocused ? 'border-blue-500' : 'border-blue-200'
                        } focus:outline-none focus:ring-2 focus:ring-blue-200`}
                    >
                      <option value="">Select an option</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="maybe">Maybe</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Question 3: Excel Proficiency */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    Rate your proficiency in Excel
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Beginner</span>
                      <span className="text-sm text-gray-600">Expert</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={excelProficiency}
                      onChange={(e) => setExcelProficiency(Number(e.target.value))}
                      className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${excelProficiency}%, #e0e7ff ${excelProficiency}%, #e0e7ff 100%)`
                      }}
                    />
                    <p className="text-sm text-blue-600 font-medium">
                      Current selection: {getProficiencyLabel(excelProficiency)}
                    </p>
                  </div>
                </div>

                {/* Question 4: Joining Availability */}
                <div>
                  <label className="block text-base font-medium text-gray-900 mb-3">
                    How soon can you join?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['Immediate', '15 Days', '30 Days', '60 Days'].map((option) => (
                      <button
                        key={option}
                        onClick={() => setJoiningAvailability(option)}
                        className={`px-4 py-2.5 rounded-lg border-2 transition-colors ${joiningAvailability === option
                          ? 'border-blue-500 bg-blue-50 text-blue-600 font-medium'
                          : 'border-blue-200 bg-white text-gray-900 hover:border-blue-300'
                          }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitScreening}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors"
                >
                  Submit & Continue
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Application Success Modal */}
      {isSuccessModalOpen && (
        <ApplicationSuccessModal
          isOpen={isSuccessModalOpen}
          onClose={handleCloseSuccessModal}
          jobTitle={appliedJobSummary?.jobTitle || selectedJob?.title || 'Job'}
          company={appliedJobSummary?.company || selectedJob?.company || 'Company'}
          appliedDate={appliedJobSummary?.appliedDate || formatDate(new Date())}
          jobId={appliedJobSummary?.jobId || selectedJob?.id}
          applicationId={appliedJobSummary?.applicationId}
        />
      )}

    </div >
  )
}

function stripHtml(raw: string) {
  return raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|ul|ol)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function splitTextPoints(raw?: string | null) {
  if (!raw) return []
  return raw
    .split(/\n|•|;/)
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean)
}

function extractSection(text: string, start: string, ends: string[]) {
  const endPattern = ends.length ? `(?=\\b(?:${ends.join('|')})\\b|$)` : '$'
  const regex = new RegExp(`\\b${start}\\b[:\\s]*([\\s\\S]*?)${endPattern}`, 'i')
  const match = text.match(regex)
  return match?.[1]?.trim() || ''
}

function parseStructuredJobText(rawText?: string | null) {
  const text = rawText ? stripHtml(rawText) : ''
  if (!text) {
    return {
      summary: '',
      responsibilities: [] as string[],
      requirements: [] as string[],
      benefits: [] as string[],
      location: '',
      expectedSalary: '',
      employmentType: '',
    }
  }

  const summary =
    extractSection(text, 'Overview', ['Key Responsibilities', 'Responsibilities', 'Requirements', 'Preferred Qualifications', 'Benefits', 'Education']) ||
    extractSection(text, 'Job Summary', ['Key Responsibilities', 'Responsibilities', 'Requirements', 'Preferred Qualifications', 'Benefits', 'Education'])

  const responsibilitiesBlock =
    extractSection(text, 'Key Responsibilities', ['Requirements', 'Preferred Qualifications', 'Benefits', 'Education']) ||
    extractSection(text, 'Responsibilities', ['Requirements', 'Preferred Qualifications', 'Benefits', 'Education'])

  const requirementsBlock =
    extractSection(text, 'Requirements', ['Preferred Qualifications', 'Benefits', 'Education']) ||
    extractSection(text, 'Qualifications and Experience', ['Preferred Qualifications', 'Benefits', 'Education']) ||
    extractSection(text, 'Qualifications', ['Preferred Qualifications', 'Benefits', 'Education'])

  const benefitsBlock = extractSection(text, 'Benefits', ['Education'])

  const locationMatch = text.match(/Location\s*:\s*([^\n]+)/i)
  const salaryMatch = text.match(/(?:Expected\s+Salary|Salary)\s*:\s*([^\n]+)/i)
  const typeMatch = text.match(/Employment\s+Type\s*:\s*([^\n]+)/i)

  return {
    summary: summary || '',
    responsibilities: splitTextPoints(responsibilitiesBlock),
    requirements: splitTextPoints(requirementsBlock),
    benefits: splitTextPoints(benefitsBlock),
    location: locationMatch?.[1]?.trim() || '',
    expectedSalary: salaryMatch?.[1]?.trim() || '',
    employmentType: typeMatch?.[1]?.trim() || '',
  }
}

export default function ExploreJobsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: PAGE_BG }} />}>
      <ExploreJobsPageContent />
    </Suspense>
  )
}
