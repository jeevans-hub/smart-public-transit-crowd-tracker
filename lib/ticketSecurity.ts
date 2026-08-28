import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET environment variable');
  return secret;
}

export interface TicketQrPayload {
  ticketNumber: string;
  userId: string;
  routeId: string;
  validUntil: string;
}

export function createTicketQrPayload(payload: TicketQrPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '2h', subject: payload.ticketNumber });
}

export function verifyTicketQrPayload(value: string): TicketQrPayload | null {
  try {
    const payload = jwt.verify(value, getJwtSecret()) as Partial<TicketQrPayload>;
    if (!payload.ticketNumber || !payload.userId || !payload.routeId || !payload.validUntil) return null;
    return payload as TicketQrPayload;
  } catch {
    return null;
  }
}
