import { NextResponse } from 'next/server';
import { getEmployerLandingMetrics } from '@/lib/employers/landingMetrics';

export const dynamic = 'force-dynamic';

/** Public safe aggregates for /en/employers — never returns PII. */
export async function GET() {
  try {
    const data = await getEmployerLandingMetrics();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('[employers/landing-metrics]', error);
    const { DEMO_LANDING_METRICS } = await import('@/lib/employers/landingMetrics');
    return NextResponse.json({
      success: true,
      data: {
        ...DEMO_LANDING_METRICS,
        capturedAt: new Date().toISOString(),
        dashboard: (await import('@/lib/employers/landingMetrics')).buildDemoDashboard(),
      },
    });
  }
}
