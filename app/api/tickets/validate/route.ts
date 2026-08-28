import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { verifyToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';
import { findMockTicket, updateMockTicket } from '@/lib/ticketStore';
import { verifyTicketQrPayload } from '@/lib/ticketSecurity';
import { validateTicketSchema } from '@/lib/ticketSchemas';
import { canUseTicket, resolveTicketStatus } from '@/utils/ticketLifecycle';

function authenticated(request: NextRequest) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  return token ? verifyToken(token) : null;
}

function result(ticket: Record<string, unknown>, valid: boolean, message: string, status = 200) {
  return NextResponse.json({ success: valid, valid, message, data: ticket }, { status });
}

export async function POST(request: NextRequest) {
  if (!authenticated(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = validateTicketSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid validation request' }, { status: 400 });
    const { ticketNumber, qrPayload } = parsed.data;

    const decodedQr = qrPayload ? verifyTicketQrPayload(qrPayload) : null;
    if (qrPayload && !decodedQr) return result({}, false, 'Invalid or tampered QR code', 400);
    const resolvedNumber = decodedQr?.ticketNumber || ticketNumber;
    if (decodedQr && ticketNumber && decodedQr.ticketNumber !== ticketNumber) return result({}, false, 'QR code does not match the ticket number', 400);

    try {
      await connectDB();
      const ticket = await Ticket.findOne({ ticketNumber: resolvedNumber });
      if (!ticket) return result({}, false, 'Ticket not found', 404);
      if (decodedQr && (decodedQr.userId !== ticket.userId || decodedQr.routeId !== ticket.routeId)) return result({}, false, 'QR code does not match ticket data', 400);

      const resolvedStatus = resolveTicketStatus(ticket.status, ticket.validUntil);
      if (resolvedStatus !== ticket.status) {
        ticket.status = resolvedStatus;
        await ticket.save();
      }
      const ticketData = ticket.toObject() as unknown as Record<string, unknown>;
      if (!canUseTicket(ticket.status, ticket.validUntil)) return result(ticketData, false, `Ticket is ${ticket.status.toLowerCase()}`, 409);

      ticket.status = 'USED';
      await ticket.save();
      return result(ticket.toObject() as unknown as Record<string, unknown>, true, 'Ticket validated and marked as used');
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('ECONNREFUSED'))) throw error;
      const ticket = findMockTicket(resolvedNumber);
      if (!ticket) return result({}, false, 'Ticket not found', 404);
      if (decodedQr && (decodedQr.userId !== ticket.userId || decodedQr.routeId !== ticket.routeId)) return result({}, false, 'QR code does not match ticket data', 400);
      ticket.status = resolveTicketStatus(ticket.status, ticket.validUntil);
      if (!canUseTicket(ticket.status, ticket.validUntil)) return result(ticket as unknown as Record<string, unknown>, false, `Ticket is ${ticket.status.toLowerCase()}`, 409);
      updateMockTicket(resolvedNumber, { status: 'USED' });
      return result({ ...ticket, status: 'USED' } as unknown as Record<string, unknown>, true, 'Ticket validated and marked as used');
    }
  } catch (error) {
    console.error('Validate ticket error:', error);
    return NextResponse.json({ success: false, error: 'Failed to validate ticket' }, { status: 500 });
  }
}
