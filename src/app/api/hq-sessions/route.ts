import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Thin proxy to backend1 HQ session / alert-timing APIs.
 *
 * GET /api/hq-sessions              → GET /api/hq/sessions
 * GET /api/hq-sessions?userId=…     → GET /api/hq/sessions/:candidateId
 */
function backendOrigin() {
  return String(
    process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      'http://localhost:5000',
  )
    .trim()
    .replace(/\/api\/?$/, '')
    .replace(/\/$/, '');
}

function adminHeaders(req: NextRequest): HeadersInit {
  const key =
    req.headers.get('x-internal-admin-key') ||
    process.env.SYSTEM_AUDIT_ADMIN_KEY ||
    process.env.INTERVIEW_ADMIN_KEY ||
    process.env.INTERNAL_API_KEY ||
    '';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (key) headers['x-internal-admin-key'] = key;
  return headers;
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId') || '';
  const limit = req.nextUrl.searchParams.get('limit') || '50';
  const path = userId
    ? `/api/hq/sessions/${encodeURIComponent(userId)}?limit=${encodeURIComponent(limit)}`
    : `/api/hq/sessions?limit=${encodeURIComponent(limit)}`;

  try {
    const res = await fetch(`${backendOrigin()}${path}`, {
      headers: adminHeaders(req),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    return NextResponse.json(json ?? { success: false, message: 'Empty response' }, {
      status: res.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reach HQ sessions API',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
