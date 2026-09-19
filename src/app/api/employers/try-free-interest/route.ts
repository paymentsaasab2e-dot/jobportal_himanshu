import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PHASE2_TRY_FREE_INTEREST_URL =
  process.env.PHASE2_TRY_FREE_INTEREST_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:5001/api/v1/public/try-free-interest'
    : 'https://api2.hryantra.com/api/v1/public/try-free-interest');

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  try {
    const upstream = await fetch(PHASE2_TRY_FREE_INTEREST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
    });
  } catch (error) {
    console.error('[try-free-interest] Phase 2 unreachable:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          'Unable to save your details right now. Start backendphase2 on port 5001 (pnpm dev) and try again.',
      },
      { status: 503 },
    );
  }
}
