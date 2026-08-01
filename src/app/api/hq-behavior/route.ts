import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type StoredHqBehaviorPayload = {
  userId: string;
  capturedAt: string;
  activityStateUpdatedAt?: string;
  rollup7d?: unknown;
  suggestionMetrics?: unknown;
  triggers?: unknown[];
  interests?: unknown[];
  personalizedRecs?: unknown[];
};

const store = globalThis as typeof globalThis & {
  __saasaHqBehaviorStore?: Map<string, StoredHqBehaviorPayload>;
};

function getStore() {
  if (!store.__saasaHqBehaviorStore) {
    store.__saasaHqBehaviorStore = new Map<string, StoredHqBehaviorPayload>();
  }
  return store.__saasaHqBehaviorStore;
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || '';
  const all = [...getStore().values()].sort((a, b) =>
    String(b.capturedAt || '').localeCompare(String(a.capturedAt || '')),
  );
  if (userId) {
    return NextResponse.json({
      success: true,
      data: getStore().get(userId) || null,
    });
  }
  return NextResponse.json({
    success: true,
    data: {
      count: all.length,
      users: all.slice(0, 100),
    },
  });
}

export async function POST(req: NextRequest) {
  const payload = (await req.json().catch(() => null)) as StoredHqBehaviorPayload | null;
  if (!payload?.userId) {
    return NextResponse.json(
      { success: false, error: 'userId is required' },
      { status: 400 },
    );
  }
  const normalized: StoredHqBehaviorPayload = {
    ...payload,
    capturedAt: payload.capturedAt || new Date().toISOString(),
  };
  getStore().set(payload.userId, normalized);
  return NextResponse.json({
    success: true,
    data: {
      userId: payload.userId,
      triggerCount: Array.isArray(payload.triggers) ? payload.triggers.length : 0,
      interestCount: Array.isArray(payload.interests) ? payload.interests.length : 0,
      personalizedRecCount: Array.isArray(payload.personalizedRecs)
        ? payload.personalizedRecs.length
        : 0,
      capturedAt: normalized.capturedAt,
    },
  });
}
