import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { Ticket as TicketResponse } from '@/types/ticket';
import { verifyToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';

const mockTickets = new Map<string, TicketResponse[]>();

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
    const tickets = await Ticket.find({ userId }).sort({ createdAt: -1 }).limit(50);
    return NextResponse.json({ success: true, data: tickets.map(serializeTicket) });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
      return NextResponse.json({ success: true, data: mockTickets.get(userId) || [] });
    }
    return NextResponse.json({ success: false, error: 'Failed to load tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const routeId = typeof body.routeId === 'string' ? body.routeId.trim() : '';
    const routeName = typeof body.routeName === 'string' ? body.routeName.trim() : '';
    const routeNumber = typeof body.routeNumber === 'string' ? body.routeNumber.trim() : '';
    const transportType = body.transportType;
    const origin = typeof body.origin === 'string' ? body.origin.trim() : '';
    const destination = typeof body.destination === 'string' ? body.destination.trim() : '';
    const passengerCount = Number(body.passengerCount);
    const fare = Number(body.fare);

    if (!routeId || !routeName || !routeNumber || !origin || !destination || origin === destination) {
      return NextResponse.json({ success: false, error: 'Please provide a valid route and journey' }, { status: 400 });
    }
    if (!['BUS', 'METRO', 'TRAIN'].includes(transportType)) {
      return NextResponse.json({ success: false, error: 'Invalid transport type' }, { status: 400 });
    }
    if (!Number.isInteger(passengerCount) || passengerCount < 1 || passengerCount > 6) {
      return NextResponse.json({ success: false, error: 'Passenger count must be between 1 and 6' }, { status: 400 });
    }
    if (!Number.isFinite(fare) || fare < 0 || fare > 10000) {
      return NextResponse.json({ success: false, error: 'Invalid fare' }, { status: 400 });
    }

    const validFrom = new Date();
    const validUntil = new Date(validFrom.getTime() + 2 * 60 * 60 * 1000);
    const ticketNumber = createTicketNumber();
    const qrPayload = JSON.stringify({ ticketNumber, userId, routeId, validUntil: validUntil.toISOString() });
    const ticketData = { ticketNumber, userId, routeId, routeName, routeNumber, transportType, origin, destination, passengerCount, fare, status: 'ACTIVE' as const, validFrom, validUntil, qrPayload };

    try {
      await connectDB();
      const ticket = await Ticket.create(ticketData);
      return NextResponse.json({ success: true, data: serializeTicket(ticket) }, { status: 201 });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('ECONNREFUSED'))) throw error;
      const response: TicketResponse = { ...ticketData, _id: ticketNumber, validFrom: validFrom.toISOString(), validUntil: validUntil.toISOString(), createdAt: validFrom.toISOString() };
      mockTickets.set(userId, [response, ...(mockTickets.get(userId) || [])]);
      return NextResponse.json({ success: true, data: response }, { status: 201 });
    }
  } catch (error) {
    console.error('Create ticket error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create ticket' }, { status: 500 });
  }
}
