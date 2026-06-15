import type { Metadata } from 'next';
import { CandMainLandingPage } from '@/components/candmain/CandMainLandingPage';

export const metadata: Metadata = {
  title: 'HR Yantra — AI-Powered Job Search',
  description:
    'Find the job that fits you perfectly. HR Yantra AI matches you to roles that suit your skills, experience, and goals.',
};

export default function Page() {
  return <CandMainLandingPage />;
}
