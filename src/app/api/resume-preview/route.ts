import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOSTED_BACKEND_BASE = 'https://api1.hryantra.com/api';
const LOCAL_BACKEND_BASE = 'http://localhost:5000/api';

const defaultBackendBase =
  process.env.NODE_ENV === 'development' ? LOCAL_BACKEND_BASE : HOSTED_BACKEND_BASE;

function getBackendResumePreviewUrl(search: string): string {
  const apiBase = (process.env.BACKEND_INTERNAL_URL || defaultBackendBase).replace(/\/+$/, '');
  return `${apiBase}/resume-preview${search}`;
}

/**
 * Proxies DOCX resume preview to Phase 1 backend (mammoth → HTML).
 */
export async function GET(req: NextRequest) {
  const search = req.nextUrl.search || '';
  if (!req.nextUrl.searchParams.get('url')) {
    return new NextResponse('Missing url', { status: 400 });
  }

  const target = getBackendResumePreviewUrl(search);

  try {
    const upstream = await fetch(target, {
      cache: 'no-store',
      headers: { Accept: 'text/html,application/json,*/*' },
    });

    const contentType = upstream.headers.get('content-type') || 'text/html; charset=utf-8';
    const body = await upstream.text();

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('[api/resume-preview] backend proxy failed', {
      target,
      error: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse('Preview service unavailable', { status: 502 });
  }
}
