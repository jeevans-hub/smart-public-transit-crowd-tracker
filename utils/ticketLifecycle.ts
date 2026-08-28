import type { TicketStatus } from '@/types/ticket';

export function resolveTicketStatus(status: TicketStatus, validUntil: Date | string, now = Date.now()): TicketStatus {
  if (status === 'ACTIVE' && new Date(validUntil).getTime() <= now) return 'EXPIRED';
  return status;
}

export function canCancelTicket(status: TicketStatus) {
  return status === 'ACTIVE';
}

export function canUseTicket(status: TicketStatus, validUntil: Date | string, now = Date.now()) {
  return resolveTicketStatus(status, validUntil, now) === 'ACTIVE';
}
