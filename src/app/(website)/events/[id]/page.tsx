import type { Metadata } from 'next';
import PublicEventDetailPage from './PublicEventDetailClient';

export const metadata: Metadata = {
  title: 'Event details | HR Yantra',
  description: 'View event details and apply to attend.',
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PublicEventDetailPage eventId={id} />;
}
