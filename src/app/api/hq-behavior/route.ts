import { NextRequest, NextResponse } from 'next/server';
import {
  getLatest,
  getRealtime,
  listHistory,
  listRealtime,
  upsertBehaviorLatest,
  type HqBehaviorLatest,
} from '@/lib/hq-data-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * HQ analytics display API (behavior engine → HQ).
 *
 * Behavior engine SAVES full activity locally (browser). Insights are computed there,
 * then forwarded here for HQ display only.
 *
 * GET  /api/hq-behavior                      → realtime session feed (live boards)
 * GET  /api/hq-behavior?mode=realtime        → same
 * GET  /api/hq-behavior?mode=latest&userId=  → full latest payload for one user
 * GET  /api/hq-behavior?mode=history&userId= → past snapshots for reports / analytics
 * GET  /api/hq-behavior?userId=              → full latest (compat)
 *
 * POST /api/hq-behavior → upsert realtime + latest; append history every ≥5 min
 */

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || '';
  const mode = (req.nextUrl.searchParams.get('mode') || '').toLowerCase();
  const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 100));

  // Past data for reports — only when HQ asks
  if (mode === 'history') {
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required for history' },
        { status: 400 },
      );
    }
    const history = listHistory(userId, limit);
    return NextResponse.json({
      success: true,
      data: {
        mode: 'history',
        userId,
        count: history.length,
        history,
      },
    });
  }

  // Full latest for drill-down
  if (mode === 'latest' || (userId && mode !== 'realtime')) {
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      data: {
        mode: 'latest',
        latest: getLatest(userId),
        realtime: getRealtime(userId),
      },
    });
  }

  // Default / realtime: session-type board
  if (userId) {
    return NextResponse.json({
      success: true,
      data: {
        mode: 'realtime',
        userId,
        realtime: getRealtime(userId),
        note: 'Use mode=latest&userId= for full detail; mode=history&userId= for past analytics.',
      },
    });
  }

  const users = listRealtime(limit);
  return NextResponse.json({
    success: true,
    data: {
      mode: 'realtime',
      count: users.length,
      users,
      note: 'Live session-style snapshots. Use mode=history&userId= for past analytics; mode=latest&userId= for full detail.',
    },
  });
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as HqBehaviorLatest | null;
  if (!payload?.userId) {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 },
    );
  }

  const forceHistory = Boolean(
    (payload as { appendHistory?: boolean }).appendHistory ||
      req.nextUrl.searchParams.get('history') === '1',
  );

  const { realtime, latest } = upsertBehaviorLatest(payload, { forceHistory });

  return NextResponse.json({
    success: true,
    data: {
      userId: latest.userId,
      capturedAt: latest.capturedAt,
      realtime,
      triggerCount: Array.isArray(latest.triggers) ? latest.triggers.length : 0,
      interestCount: Array.isArray(latest.interests) ? latest.interests.length : 0,
      personalizedRecCount: Array.isArray(latest.personalizedRecs)
        ? latest.personalizedRecs.length
        : 0,
      savedAs: {
        realtime: true,
        latest: true,
        history: 'appended_if_gap_ok_or_forced',
      },
    },
  });
}
