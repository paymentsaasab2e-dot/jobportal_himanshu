'use client';

/**
 * Dynamically imported profile editors — kept off the critical JS path until opened.
 * Note: next/dynamic options must be object literals (Turbopack).
 */
import dynamic from 'next/dynamic';

export const BasicInfoModal = dynamic(
  () => import('@/components/modals/BasicInfoModal'),
  { ssr: false, loading: () => null },
);
export const SummaryModal = dynamic(
  () => import('@/components/modals/SummaryModal'),
  { ssr: false, loading: () => null },
);
export const GapExplanationModal = dynamic(
  () => import('@/components/modals/GapExplanationModal'),
  { ssr: false, loading: () => null },
);
export const WorkExperienceModal = dynamic(
  () => import('@/components/modals/WorkExperienceModal'),
  { ssr: false, loading: () => null },
);
export const InternshipModal = dynamic(
  () => import('@/components/modals/InternshipModal'),
  { ssr: false, loading: () => null },
);
export const EducationModal = dynamic(
  () => import('@/components/modals/EducationModal'),
  { ssr: false, loading: () => null },
);
export const AcademicAchievementModal = dynamic(
  () => import('@/components/modals/AcademicAchievementModal'),
  { ssr: false, loading: () => null },
);
export const CompetitiveExamsModal = dynamic(
  () => import('@/components/modals/CompetitiveExamsModal'),
  { ssr: false, loading: () => null },
);
export const SkillsModal = dynamic(
  () => import('@/components/modals/SkillsModal'),
  { ssr: false, loading: () => null },
);
export const LanguagesModal = dynamic(
  () => import('@/components/modals/LanguagesModal'),
  { ssr: false, loading: () => null },
);
export const ProjectModal = dynamic(
  () => import('@/components/modals/ProjectModal'),
  { ssr: false, loading: () => null },
);
export const PortfolioLinksModal = dynamic(
  () => import('@/components/modals/PortfolioLinksModal'),
  { ssr: false, loading: () => null },
);
export const CertificationModal = dynamic(
  () => import('@/components/modals/CertificationModal'),
  { ssr: false, loading: () => null },
);
export const AccomplishmentModal = dynamic(
  () => import('@/components/modals/AccomplishmentModal'),
  { ssr: false, loading: () => null },
);
export const CareerPreferencesModal = dynamic(
  () => import('@/components/modals/CareerPreferencesModal'),
  { ssr: false, loading: () => null },
);
export const VisaWorkAuthorizationModal = dynamic(
  () => import('@/components/modals/VisaWorkAuthorizationModal'),
  { ssr: false, loading: () => null },
);
export const VaccinationModal = dynamic(
  () => import('@/components/modals/VaccinationModal'),
  { ssr: false, loading: () => null },
);
export const ResumeModal = dynamic(
  () => import('@/components/modals/ResumeModal'),
  { ssr: false, loading: () => null },
);
