import { NextRequest, NextResponse } from 'next/server';
import {
  appendTicket,
  listTickets,
  updateTicketStatus,
  type HqHelpTicket,
} from '@/lib/hq-data-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * HQ Help tickets — multi-ticket store (append; never wipe older tickets).
 * Same persistence as behavior analytics (`data/hq-analytics.json`).
 *
 * POST /api/hq-tickets
 * GET  /api/hq-tickets
 * GET  /api/hq-tickets?id=
 * GET  /api/hq-tickets?email=
 * PATCH /api/hq-tickets  { id, status }
 */

function uid() {
  return `tkt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || '';
  const email = (req.nextUrl.searchParams.get('email') || '').trim().toLowerCase();
  const status = req.nextUrl.searchParams.get('status') || '';
  const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get('limit')) || 100));

  const result = listTickets({ id: id || undefined, email: email || undefined, status, limit });

  if (id) {
    return NextResponse.json({ success: true, data: result.one });
  }

  return NextResponse.json({
    success: true,
    data: {
      count: result.list.length,
      openCount: result.openCount,
      tickets: result.list,
      note: 'Multiple tickets per user/email are kept. HQ display / analytics only.',
    },
  });
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Partial<HqHelpTicket> | null;
  if (!body?.name?.trim() || !body?.email?.trim() || !body?.subject?.trim() || !body?.description?.trim()) {
    return NextResponse.json(
      {
        success: false,
        error: 'name, email, subject, and description are required',
      },
      { status: 400 },
    );
  }

  const ticket: HqHelpTicket = {
    id: body.id?.trim() || uid(),
    createdAt: body.createdAt || new Date().toISOString(),
    name: String(body.name).trim(),
    email: String(body.email).trim(),
    category: String(body.category || 'Other').trim(),
    subject: String(body.subject).trim(),
    description: String(body.description).trim(),
    problemId: body.problemId ? String(body.problemId) : null,
    userId: body.userId ? String(body.userId) : null,
    status: 'open',
    source: 'help_page',
  };

  appendTicket(ticket);

  return NextResponse.json({
    success: true,
    data: ticket,
  });
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    id?: string;
    status?: HqHelpTicket['status'];
  } | null;
  if (!body?.id || !body?.status) {
    return NextResponse.json(
      { success: false, error: 'id and status are required' },
      { status: 400 },
    );
  }
  if (!['open', 'in_progress', 'closed'].includes(body.status)) {
    return NextResponse.json({ success: false, error: 'invalid status' }, { status: 400 });
  }
  const updated = updateTicketStatus(body.id, body.status);
  if (!updated) {
    return NextResponse.json({ success: false, error: 'ticket not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: updated });
}
