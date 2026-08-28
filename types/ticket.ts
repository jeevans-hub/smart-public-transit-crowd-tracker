export type TicketStatus = 'PENDING' | 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';

export interface Ticket {
  _id: string;
  ticketNumber: string;
  userId: string;
  routeId: string;
  routeName: string;
  routeNumber: string;
  transportType: 'BUS' | 'METRO' | 'TRAIN';
  origin: string;
  destination: string;
  passengerCount: number;
  fare: number;
  status: TicketStatus;
  validFrom: string;
  validUntil: string;
  qrPayload: string;
  createdAt: string;
}

export interface CreateTicketInput {
  routeId: string;
  routeName: string;
  routeNumber: string;
  transportType: 'BUS' | 'METRO' | 'TRAIN';
  origin: string;
  destination: string;
  passengerCount: number;
  fare: number;
}
