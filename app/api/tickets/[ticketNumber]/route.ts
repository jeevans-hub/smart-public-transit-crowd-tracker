import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ticket from '@/models/Ticket';
import { verifyToken } from '@/utils/helpers';
import { COOKIE_CONFIG } from '@/utils/constants';
import { findMockTicket, updateMockTicket } from '@/lib/ticketStore';
import { canCancelTicket } from '@/utils/ticketLifecycle';

export async function PATCH(request: NextRequest, context: { params: Promise<{ ticketNumber: string }> }) {
  const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
  const decoded = token ? verifyToken(token) : null;
  if (!decoded) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { ticketNumber } = await context.params;

  try {
    try {
      await connectDB();
      const ticket = await Ticket.findOne({ ticketNumber, userId: decoded.userId });
      if (!ticket) return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
      if (!canCancelTicket(ticket.status)) return NextResponse.json({ success: false, error: `Ticket is already ${ticket.status.toLowerCase()}` }, { status: 409 });
      ticket.status = 'CANCELLED';
      await ticket.save();
      return NextResponse.json({ success: true, data: ticket });
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('ECONNREFUSED'))) throw error;
      const ticket = findMockTicket(ticketNumber);
      if (!ticket || ticket.userId !== decoded.userId) return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
      if (!canCancelTicket(ticket.status)) return NextResponse.json({ success: false, error: `Ticket is already ${ticket.status.toLowerCase()}` }, { status: 409 });
      updateMockTicket(ticketNumber, { status: 'CANCELLED' });
      return NextResponse.json({ success: true, data: { ...ticket, status: 'CANCELLED' } });
    }
  } catch (error) {
    console.error('Cancel ticket error:', error);
    return NextResponse.json({ success: false, error: 'Failed to cancel ticket' }, { status: 500 });
  }
}
