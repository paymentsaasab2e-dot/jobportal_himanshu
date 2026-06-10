import type { Metadata } from 'next';
import { SaLandingPage } from '@/components/sa/SaLandingPage';

export const metadata: Metadata = {
  title: 'Nexora — Smarter Automation',
  description: 'Automate your busywork with intelligent agents that learn, adapt, and execute.',
};

export default function SaPage() {
  return <SaLandingPage />;
}
