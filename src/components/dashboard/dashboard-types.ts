export interface DashboardData {
  profile: {
    fullName: string;
    email: string;
    profilePhotoUrl: string | null;
    profileCompleteness: number;
    whatsappNumber?: string;
    countryCode?: string;
  };
  stats: {
    totalApplications: number;
    activeApplications: number;
    interviews: number;
    savedJobs: number;
    profileCompleteness: number;
    cvScore: number;
    marketFit: number;
    reviewing: number;
    offersReceived?: number;
    rejected?: number;
  };
  applicationCounts?: {
    SUBMITTED: number;
    UNDER_REVIEW: number;
    SHORTLISTED: number;
    ASSESSMENT: number;
    INTERVIEW: number;
    FINAL_DECISION: number;
    SELECTED: number;
    REJECTED: number;
  };
  appliedJobIds?: string[];
  recentApplications: Array<{
    id: string;
    jobId?: string;
    jobTitle: string;
    company: string;
    status: string;
    appliedAt: string;
    matchScore: number | null;
  }>;
  topSkills: Array<{
    name: string;
    proficiency: string;
  }>;
  savedJobs: Array<{
    id: string;
    title: string;
    company: string;
    location: string | null;
    savedAt: string;
  }>;
}

export interface DashboardJob {
  id: string;
  title: string;
  company: string;
  companyLogo?: string | null;
  location: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salaryAmount?: string | null;
  experienceLevel?: string | null;
  employmentType?: string;
  workMode?: string;
  visaSponsorship?: boolean;
  postedAt: string;
  matchScore?: number | null;
}

export interface DashboardCourse {
  id: string;
  title: string;
  provider: string;
  duration: string;
  level: string;
  rating?: number;
  imageUrl?: string;
  reasonLabel: string;
}

export type JobFilterKey =
  | "remote"
  | "highestMatch"
  | "salary100k"
  | "recent"
  | "visaFriendly";
