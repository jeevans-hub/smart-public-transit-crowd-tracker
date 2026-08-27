import mongoose, { Model, Schema } from 'mongoose';
import { TicketStatus } from '@/types/ticket';

export interface ITicket {
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
  validFrom: Date;
  validUntil: Date;
  qrPayload: string;
}

export interface ITicketDocument extends ITicket, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicketDocument>(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    routeId: { type: String, required: true },
    routeName: { type: String, required: true },
    routeNumber: { type: String, required: true },
    transportType: { type: String, enum: ['BUS', 'METRO', 'TRAIN'], required: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    passengerCount: { type: Number, required: true, min: 1, max: 6 },
    fare: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ['ACTIVE', 'USED', 'EXPIRED', 'CANCELLED'], default: 'ACTIVE' },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    qrPayload: { type: String, required: true },
  },
  { timestamps: true }
);

TicketSchema.index({ userId: 1, createdAt: -1 });

const Ticket: Model<ITicketDocument> =
  mongoose.models.Ticket || mongoose.model<ITicketDocument>('Ticket', TicketSchema);

export default Ticket;
