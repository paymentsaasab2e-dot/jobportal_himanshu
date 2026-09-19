'use client';

/**
 * Dynamically imported profile editors — kept off the critical JS path until opened.
 * Note: next/dynamic options must be object literals (Turbopack).
 */
import dynamic from 'next/dynamic';
import { ModalLoadShell } from '@/components/profile/ModalLoadShell';

export const BasicInfoModal = dynamic(
  () => import('@/components/modals/BasicInfoModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const SummaryModal = dynamic(
  () => import('@/components/modals/SummaryModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const GapExplanationModal = dynamic(
  () => import('@/components/modals/GapExplanationModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const WorkExperienceModal = dynamic(
  () => import('@/components/modals/WorkExperienceModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const InternshipModal = dynamic(
  () => import('@/components/modals/InternshipModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const EducationModal = dynamic(
  () => import('@/components/modals/EducationModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const AcademicAchievementModal = dynamic(
  () => import('@/components/modals/AcademicAchievementModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const CompetitiveExamsModal = dynamic(
  () => import('@/components/modals/CompetitiveExamsModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const SkillsModal = dynamic(
  () => import('@/components/modals/SkillsModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const LanguagesModal = dynamic(
  () => import('@/components/modals/LanguagesModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const ProjectModal = dynamic(
  () => import('@/components/modals/ProjectModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const PortfolioLinksModal = dynamic(
  () => import('@/components/modals/PortfolioLinksModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const CertificationModal = dynamic(
  () => import('@/components/modals/CertificationModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const AccomplishmentModal = dynamic(
  () => import('@/components/modals/AccomplishmentModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const CareerPreferencesModal = dynamic(
  () => import('@/components/modals/CareerPreferencesModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const VisaWorkAuthorizationModal = dynamic(
  () => import('@/components/modals/VisaWorkAuthorizationModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const VaccinationModal = dynamic(
  () => import('@/components/modals/VaccinationModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
export const ResumeModal = dynamic(
  () => import('@/components/modals/ResumeModal'),
  { ssr: false, loading: () => <ModalLoadShell /> },
);
