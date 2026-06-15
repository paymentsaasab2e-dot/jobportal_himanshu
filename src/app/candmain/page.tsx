import type { Metadata } from 'next';
import { CandMainLandingPage } from '@/components/candmain/CandMainLandingPage';

export const metadata: Metadata = {
  title: 'HR Yantra — Candidate Portal',
  description:
    'Explore jobs, build your profile, track applications, and prepare for interviews on the HR Yantra Phase 1 candidate portal.',
};

export default function CandMainPage() {
  return <CandMainLandingPage />;
}
