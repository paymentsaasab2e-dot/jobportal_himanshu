import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOSTED_BACKEND_BASE = 'https://api1.hryantra.com/api';
const LOCAL_BACKEND_BASE = 'http://localhost:5000/api';

const defaultBackendBase =
  process.env.NODE_ENV === 'development' ? LOCAL_BACKEND_BASE : HOSTED_BACKEND_BASE;

function getBackendResumeDocxUrl(search: string): string {
  const apiBase = (process.env.BACKEND_INTERNAL_URL || defaultBackendBase).replace(/\/+$/, '');
  return `${apiBase}/resume-preview/bytes${search}`;
}

/** Proxies raw DOCX bytes from Phase 1 backend for client-side docx-preview rendering. */
export async function GET(req: NextRequest) {
  const search = req.nextUrl.search || '';
  if (!req.nextUrl.searchParams.get('url')) {
    return new NextResponse('Missing url', { status: 400 });
  }

  const target = getBackendResumeDocxUrl(search);

  try {
    const upstream = await fetch(target, {
      cache: 'no-store',
      headers: { Accept: 'application/octet-stream,*/*' },
    });

    if (!upstream.ok) {
      const message = await upstream.text().catch(() => 'Failed to load document');
      return new NextResponse(message, { status: upstream.status });
    }

    const body = await upstream.arrayBuffer();
    const contentType =
      upstream.headers.get('content-type') ||
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'inline; filename="resume.docx"',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.error('[api/resume-docx] backend proxy failed', {
      target,
      error: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse('Document service unavailable', { status: 502 });
  }
}
