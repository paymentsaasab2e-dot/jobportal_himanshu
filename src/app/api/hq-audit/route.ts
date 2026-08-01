import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * HQ attach proxy for System Audit Logs.
 * Forwards to backend1 /api/audit/hq/* so HQ can wire one stable Next URL.
 *
 * GET  /api/hq-audit              → HQ feed (events + releases)
 * GET  /api/hq-audit?mode=release → release preview
 * POST /api/hq-audit              → persist release (body forwarded)
 * GET  /api/hq-audit?mode=events  → list events
 */

const store = globalThis as typeof globalThis & {
  __saasaHqAuditLastRelease?: unknown;
};

function backendOrigin() {
  const raw =
    process.env.AUDIT_API_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:5000';
  const trimmed = String(raw).replace(/\/$/, '');
  if (trimmed.endsWith('/api')) return trimmed.slice(0, -4);
  return trimmed;
}

function adminHeaders(req: NextRequest): HeadersInit {
  const key =
    req.headers.get('x-internal-admin-key') ||
    process.env.SYSTEM_AUDIT_ADMIN_KEY ||
    process.env.INTERVIEW_ADMIN_KEY ||
    process.env.INTERNAL_API_KEY ||
    '';
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (key) headers['x-internal-admin-key'] = key;
  return headers;
}

async function forward(path: string, init: RequestInit) {
  const url = `${backendOrigin()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, cache: 'no-store' });
  const json = await res.json().catch(() => ({
    success: false,
    message: 'Invalid JSON from audit backend',
  }));
  return NextResponse.json(json, { status: res.status });
}

export async function GET(req: NextRequest) {
  const mode = (req.nextUrl.searchParams.get('mode') || 'feed').toLowerCase();
  const sinceHours = req.nextUrl.searchParams.get('sinceHours') || '24';
  const limit = req.nextUrl.searchParams.get('limit') || '50';
  const headers = adminHeaders(req);

  try {
    if (mode === 'release') {
      return await forward(
        `/api/audit/hq/release?sinceHours=${encodeURIComponent(sinceHours)}&limit=${encodeURIComponent(limit)}`,
        { method: 'GET', headers },
      );
    }
    if (mode === 'events') {
      const q = req.nextUrl.searchParams.toString();
      return await forward(`/api/audit/events?${q}`, { method: 'GET', headers });
    }
    if (mode === 'last' && store.__saasaHqAuditLastRelease) {
      return NextResponse.json({
        success: true,
        data: store.__saasaHqAuditLastRelease,
      });
    }
    return await forward(
      `/api/audit/hq/feed?sinceHours=${encodeURIComponent(sinceHours)}&limit=${encodeURIComponent(limit)}`,
      { method: 'GET', headers },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Could not reach audit backend',
        error: error instanceof Error ? error.message : String(error),
        hint: 'Ensure backend1 is running on :5000 and AUDIT_LOGS.md attach steps are followed.',
      },
      { status: 502 },
    );
  }
}

export async function POST(req: NextRequest) {
  const headers = adminHeaders(req);
  const body = await req.json().catch(() => ({}));
  try {
    const res = await fetch(`${backendOrigin()}/api/audit/hq/release`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sinceHours: 24,
        limit: 200,
        acknowledge: true,
        hqSystemId: body?.hqSystemId || 'hq-next-proxy',
        note: body?.note || 'Released via /api/hq-audit',
        ...body,
      }),
      cache: 'no-store',
    });
    const json = await res.json().catch(() => null);
    if (json?.data?.release) {
      store.__saasaHqAuditLastRelease = json.data.release;
    }
    return NextResponse.json(json, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Could not persist HQ audit release',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }
}
