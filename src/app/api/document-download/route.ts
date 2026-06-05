import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HOSTED_BACKEND_BASE = 'https://api1.hryantra.com/api';
const LOCAL_BACKEND_BASE = 'http://localhost:5000/api';

const defaultBackendBase =
  process.env.NODE_ENV === 'development' ? LOCAL_BACKEND_BASE : HOSTED_BACKEND_BASE;

function getBackendDocumentDownloadUrl(search: string): string {
  const apiBase = (process.env.BACKEND_INTERNAL_URL || defaultBackendBase).replace(/\/+$/, '');
  return `${apiBase}/document-download${search}`;
}

/**
 * Same-origin proxy so profile downloads work without opening a new tab (S3 CORS-safe).
 */
export async function GET(req: NextRequest) {
  const search = req.nextUrl.search || '';
  if (!req.nextUrl.searchParams.get('url')) {
    return new NextResponse('Missing url', { status: 400 });
  }

  const target = getBackendDocumentDownloadUrl(search);

  try {
    const upstream = await fetch(target, {
      cache: 'no-store',
      headers: { Accept: '*/*' },
    });

    const headers = new Headers();
    const contentType = upstream.headers.get('content-type');
    const disposition = upstream.headers.get('content-disposition');
    const contentLength = upstream.headers.get('content-length');

    if (contentType) headers.set('Content-Type', contentType);
    if (disposition) headers.set('Content-Disposition', disposition);
    if (contentLength) headers.set('Content-Length', contentLength);
    headers.set('Cache-Control', 'private, max-age=300');

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      status: upstream.status,
      headers,
    });
  } catch (error) {
    console.error('[api/document-download] backend proxy failed', {
      target,
      error: error instanceof Error ? error.message : String(error),
    });
    return new NextResponse('Download service unavailable', { status: 502 });
  }
}
