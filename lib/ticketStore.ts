import { Ticket } from '@/types/ticket';

const mockTickets = new Map<string, Ticket[]>();

export function getMockTickets(userId: string) {
  return mockTickets.get(userId) || [];
}

export function addMockTicket(ticket: Ticket) {
  mockTickets.set(ticket.userId, [ticket, ...getMockTickets(ticket.userId)]);
}

export function findMockTicket(ticketNumber: string) {
  for (const tickets of mockTickets.values()) {
    const ticket = tickets.find(item => item.ticketNumber === ticketNumber);
    if (ticket) return ticket;
  }
  return null;
}

export function updateMockTicket(ticketNumber: string, updates: Partial<Ticket>) {
  const ticket = findMockTicket(ticketNumber);
  if (!ticket) return null;
  Object.assign(ticket, updates);
  return ticket;
}
