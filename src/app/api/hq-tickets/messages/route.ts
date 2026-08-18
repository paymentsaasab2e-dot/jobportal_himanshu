import { NextRequest, NextResponse } from 'next/server';
import {
  addTicketMessage,
  canAccessTicketMessages,
  getTicketById,
  getTicketMessages,
} from '@/lib/hq-data-store';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/** GET /api/hq-tickets/messages?ticketId=&email= */
export async function GET(req: NextRequest) {
  const ticketId = (req.nextUrl.searchParams.get('ticketId') || '').trim();
  const email = (req.nextUrl.searchParams.get('email') || '').trim();
  const userId = (req.nextUrl.searchParams.get('userId') || '').trim();
  const hq = req.nextUrl.searchParams.get('hq') === '1';

  if (!ticketId) {
    return NextResponse.json({ success: false, error: 'ticketId is required' }, { status: 400 });
  }

  if (!canAccessTicketMessages(ticketId, { email, userId, hq })) {
    return NextResponse.json({ success: false, error: 'ticket not found' }, { status: 404 });
  }

  const ticket = getTicketById(ticketId);
  const messages = getTicketMessages(ticketId);

  return NextResponse.json({
    success: true,
    data: {
      ticketId,
      subject: ticket?.subject || '',
      status: ticket?.status || 'open',
      messages,
    },
  });
}

/** POST /api/hq-tickets/messages */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as {
    ticketId?: string;
    body?: string;
    senderRole?: 'candidate' | 'hq';
    senderName?: string;
    senderId?: string;
    email?: string;
    userId?: string;
  } | null;

  const ticketId = String(body?.ticketId || '').trim();
  const text = String(body?.body || '').trim();
  const senderRole = body?.senderRole === 'hq' ? 'hq' : 'candidate';

  if (!ticketId || !text) {
    return NextResponse.json(
      { success: false, error: 'ticketId and body are required' },
      { status: 400 },
    );
  }

  if (senderRole === 'hq') {
    if (!canAccessTicketMessages(ticketId, { hq: true })) {
      return NextResponse.json({ success: false, error: 'ticket not found' }, { status: 404 });
    }
  } else {
    const email = String(body?.email || '').trim();
    const userId = String(body?.userId || '').trim();
    if (!canAccessTicketMessages(ticketId, { email, userId })) {
      return NextResponse.json({ success: false, error: 'ticket not found' }, { status: 404 });
    }
  }

  const ticket = getTicketById(ticketId);
  if (!ticket) {
    return NextResponse.json({ success: false, error: 'ticket not found' }, { status: 404 });
  }

  if (ticket.status === 'closed') {
    return NextResponse.json(
      { success: false, error: 'Chat is closed for completed tickets' },
      { status: 403 },
    );
  }

  const saved = addTicketMessage(ticketId, {
    senderRole,
    senderName: String(body?.senderName || (senderRole === 'hq' ? 'HQ Support' : 'You')).trim(),
    senderId: body?.senderId || null,
    body: text,
  });

  if (!saved) {
    return NextResponse.json({ success: false, error: 'ticket not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: saved });
}
