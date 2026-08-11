import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PHASE2_AUTH_LOGIN_URL =
  process.env.PHASE2_AUTH_LOGIN_URL ||
  (process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:5001/api/v1/auth/login'
    : 'https://api2.hryantra.com/api/v1/auth/login');

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid request body' }, { status: 400 });
  }

  try {
    const upstream = await fetch(PHASE2_AUTH_LOGIN_URL, {
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
    console.error('[try-free-login] Phase 2 auth unreachable:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          'Employer workspace is unavailable. Start backendphase2 on port 5001 (pnpm dev) and try again.',
      },
      { status: 503 },
    );
  }
}
