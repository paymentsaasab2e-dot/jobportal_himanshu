import type { Metadata } from 'next';
import { CandMainLandingPage } from '@/components/candmain/CandMainLandingPage';

export const metadata: Metadata = {
  title: 'HR Yantra — AI-Powered Job Search',
  description:
    'Where dream meets opportunities — Learn, Earn and Grow with AI. Bridging the gap between ambition and opportunities. Discover Jobs. Build Skills. Elevate.',
};

export default function Page() {
  return <CandMainLandingPage />;
}
