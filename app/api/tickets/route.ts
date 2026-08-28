import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { Ticket as TicketResponse } from '@/types/ticket';
import { verifyToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';
import { addMockTicket, getMockTickets } from '@/lib/ticketStore';
import { createTicketQrPayload } from '@/lib/ticketSecurity';
import { createTicketSchema } from '@/lib/ticketSchemas';

function getUserId(request: NextRequest): string | null {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  const decoded = token ? verifyToken(token) : null;
  return decoded?.userId || null;
}

function createTicketNumber() {
  return `TT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function serializeTicket(ticket: TicketResponse | { toObject: () => Record<string, unknown> }): TicketResponse {
  const source = 'toObject' in ticket ? ticket.toObject() : ticket;
  return {
    ...source,
    _id: String(source._id),
    validFrom: new Date(String(source.validFrom)).toISOString(),
    validUntil: new Date(String(source.validUntil)).toISOString(),
    createdAt: new Date(String(source.createdAt)).toISOString(),
  } as TicketResponse;
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    await connectDB();
    await Ticket.updateMany({ userId, status: 'ACTIVE', validUntil: { $lte: new Date() } }, { $set: { status: 'EXPIRED' } });
    const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ success: true, data: tickets.map(serializeTicket) });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json({ success: true, data: getMockTickets(userId) });
    }
    return NextResponse.json({ success: false, error: 'Failed to load tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = createTicketSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || 'Invalid ticket details' }, { status: 400 });
    const { routeId, routeName, routeNumber, transportType, origin, destination, passengerCount, fare } = parsed.data;

    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + 2 * 60 * 60 * 1000);
    const ticketNumber = createTicketNumber();
    const qrPayload = createTicketQrPayload({ ticketNumber, userId, routeId, validUntil: validUntil.toISOString() });
    const ticketData = { ticketNumber, userId, routeId, routeName, routeNumber, transportType, origin, destination, passengerCount, fare, status: 'ACTIVE' as const, validFrom, validUntil, qrPayload };

    try {
      await connectDB();
      const ticket = await Ticket.create(ticketData);
      return NextResponse.json({ success: true, data: serializeTicket(ticket) }, { status: 201 });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('ECONNREFUSED'))) throw error;
      const response: TicketResponse = { ...ticketData, _id: ticketNumber, validFrom: validFrom.toISOString(), validUntil: validUntil.toISOString(), createdAt: validFrom.toISOString() };
      addMockTicket(response);
      return NextResponse.json({ success: true, data: response }, { status: 201 });
    }
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create ticket' }, { status: 500 });
  }
}
