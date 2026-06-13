import { NextRequest, NextResponse } from 'next/server';

// Always fetch fresh job data (Phase 1 explore-jobs must reflect Phase 2 CRM edits).
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Local Next dev: forward to your machine’s API. Production / Vercel: set BACKEND_INTERNAL_URL or use hosted default.
const HOSTED_BACKEND_BASE = 'https://api1.hryantra.com/api';
const LOCAL_BACKEND_BASE = 'http://localhost:5000/api';
const PHASE2_PUBLIC_JOBS_BASE =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5001/api/v1/jobs/public-feed'
    : 'https://api2.hryantra.com/api/v1/jobs/public-feed';
const PHASE2_PUBLIC_APPLY_BASE =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5001/api/v1/jobs/public/apply'
    : 'https://api2.hryantra.com/api/v1/jobs/public/apply';
const PHASE2_PRE_SCREEN_ASSESSMENTS_BASE =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:5001/api/v1/pre-screen-assessments'
    : 'https://api2.hryantra.com/api/v1/pre-screen-assessments';

const defaultBackendBase =
  process.env.NODE_ENV === 'development' ? LOCAL_BACKEND_BASE : HOSTED_BACKEND_BASE;

const backendBase = (process.env.BACKEND_INTERNAL_URL || defaultBackendBase).replace(/\/$/, '');

const buildTargetUrl = (req: NextRequest, pathParts: string[]) => {
  if (pathParts[0] === 'phase2-public-jobs') {
    const query = req.nextUrl.search || '';
    return `${process.env.PHASE2_PUBLIC_JOBS_URL || PHASE2_PUBLIC_JOBS_BASE}${query}`;
  }
  if (pathParts[0] === 'phase2-public-apply') {
    const token = encodeURIComponent(String(pathParts[1] || '').trim());
    const query = req.nextUrl.search || '';
    return `${process.env.PHASE2_PUBLIC_APPLY_URL || PHASE2_PUBLIC_APPLY_BASE}/${token}${query}`;
  }
  if (pathParts[0] === 'phase2-pre-screen-assessments') {
    const subPath = pathParts.slice(1).join('/');
    const query = req.nextUrl.search || '';
    const base = (process.env.PHASE2_PRE_SCREEN_ASSESSMENTS_URL || PHASE2_PRE_SCREEN_ASSESSMENTS_BASE).replace(
      /\/$/,
      '',
    );
    return `${base}/${subPath}${query}`;
  }

  const pathname = pathParts.join('/');
  const query = req.nextUrl.search || '';
  return `${backendBase}/${pathname}${query}`;
};

/** Tenant DB name for Phase 2 public job feed (same DB where CRM creates/edits jobs). */
const PHASE2_PUBLIC_FEED_TENANT_DB =
  process.env.PHASE2_PUBLIC_FEED_TENANT_DB?.trim() ||
  process.env.PHASE2_TENANT_DB_NAME?.trim() ||
  '';

async function proxyRequest(req: NextRequest, pathParts: string[]) {
  const targetUrl = buildTargetUrl(req, pathParts);

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('origin');
  // Let upstream return uncompressed payload to avoid decode mismatches.
  headers.delete('accept-encoding');

  // Public feed is anonymous on Phase 2; strip caller JWT so tenant middleware does not
  // pick the wrong DB from a candidate token. Prefer explicit tenant header + env.
  if (
    pathParts[0] === 'phase2-public-jobs' ||
    pathParts[0] === 'phase2-public-apply' ||
    pathParts[0] === 'phase2-pre-screen-assessments'
  ) {
    headers.delete('authorization');
    const tenantFromQuery = req.nextUrl.searchParams.get('tenantDbName')?.trim();
    const tenantHeader = tenantFromQuery || PHASE2_PUBLIC_FEED_TENANT_DB;
    if (tenantHeader) {
      headers.set('x-tenant-db-name', tenantHeader);
    }
  }

  const method = req.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);

  try {
    const response = await fetch(targetUrl, {
      method,
      headers,
      body: hasBody ? req.body : undefined,
      // Needed for streaming body in Node runtime
      duplex: hasBody ? 'half' : undefined,
      redirect: 'manual',
    } as RequestInit & { duplex?: 'half' });

    const respHeaders = new Headers(response.headers);
    // Avoid passing compression/length headers that can mismatch proxied body.
    respHeaders.delete('content-length');
    respHeaders.delete('content-encoding');
    respHeaders.delete('transfer-encoding');
    respHeaders.delete('connection');

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  } catch (error) {
    console.error(`Proxy error connecting to ${targetUrl}:`, error);
    // Return empty response for phase2-public-jobs when backend is unavailable
    if (pathParts[0] === 'phase2-public-jobs') {
      return NextResponse.json({ jobs: [], total: 0, page: 1, limit: 120 }, { status: 200 });
    }
    if (pathParts[0] === 'phase2-public-apply') {
      return NextResponse.json({ success: false, message: 'Apply page unavailable' }, { status: 503 });
    }
    if (pathParts[0] === 'phase2-pre-screen-assessments') {
      return NextResponse.json({ success: true, data: [] }, { status: 200 });
    }
    return NextResponse.json({ error: 'Backend service unavailable' }, { status: 503 });
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(req, path || []);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(req, path || []);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(req, path || []);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(req, path || []);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(req, path || []);
}

export async function OPTIONS(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  return proxyRequest(req, path || []);
}

