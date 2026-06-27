export type CareerExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type CareerAssessment = {
  aboutMe: string;
  education: string;
  currentSkills: string;
  experienceLevel: CareerExperienceLevel;
  interestedField: string;
  careerGoal: string;
  hoursPerDay: string;
  targetRole: string;
};

export type CareerGap = {
  skill: string;
  priority: 'high' | 'medium' | 'low';
};

export type CareerTask = {
  id: string;
  label: string;
  completed: boolean;
  note?: string;
};

export type CareerProject = {
  id: string;
  milestoneId: string;
  title: string;
  description: string;
  githubUrl?: string;
  demoUrl?: string;
};

export type CareerCertificate = {
  id: string;
  name: string;
  status: 'earned' | 'pending';
  earnedAt?: string;
};

export type CareerSkill = {
  name: string;
  progress: number;
};

export type CareerMilestone = {
  id: string;
  title: string;
  phase: 'foundation' | 'core' | 'mastery' | 'job-ready';
  phaseLabel: string;
  durationMonths: number;
  skills: string[];
  progress: number;
  status: 'completed' | 'in-progress' | 'upcoming';
  tasks: CareerTask[];
  targetRoute?: string;
  reason?: string;
};

export type CareerJourney = {
  id: string;
  goal: string;
  targetRole: string;
  assessment: CareerAssessment;
  readinessLevel: string;
  gaps: CareerGap[];
  milestones: CareerMilestone[];
  skills: CareerSkill[];
  certificates: CareerCertificate[];
  projects: CareerProject[];
  progressPercent: number;
  expectedCompletionMonths: number;
  currentStage: string;
  jobReadinessScore: number;
  jobReadyRoles: string[];
  missingForJob: string[];
  createdAt: string;
  updatedAt: string;
};

export type CareerPathView = 'home' | 'assessment' | 'analysis' | 'improve';
