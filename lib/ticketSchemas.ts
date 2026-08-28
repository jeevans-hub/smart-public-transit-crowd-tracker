import { z } from 'zod';

export const createTicketSchema = z.object({
  routeId: z.string().trim().min(1).max(100),
  routeName: z.string().trim().min(1).max(160),
  routeNumber: z.string().trim().min(1).max(40),
  transportType: z.enum(['BUS', 'METRO', 'TRAIN']),
  origin: z.string().trim().min(1).max(120),
  destination: z.string().trim().min(1).max(120),
  passengerCount: z.coerce.number().int().min(1).max(6),
  fare: z.coerce.number().finite().min(0).max(10000),
}).refine(value => value.origin.toLowerCase() !== value.destination.toLowerCase(), {
  message: 'Origin and destination must be different',
  path: ['destination'],
});

export const validateTicketSchema = z.object({
  ticketNumber: z.string().trim().max(100).optional().default(''),
  qrPayload: z.string().trim().max(5000).optional().default(''),
}).refine(value => value.ticketNumber.length > 0 || value.qrPayload.length > 0, {
  message: 'Ticket number or QR payload is required',
});
