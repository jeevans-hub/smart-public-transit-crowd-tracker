import mongoose, { Schema } from 'mongoose';

export interface BmtcCrowdAlertRecord {
  userId: string;
  routeNumber: string;
  stopId: string;
  destinationStopId?: string;
  threshold: 'HIGH' | 'VERY_HIGH';
  arrivalWithinMinutes?: number;
  onlyIfBetterAlternative: boolean;
  enabled: boolean;
  lastTriggeredAt?: Date;
  lastFingerprint?: string;
}

const BmtcCrowdAlertSchema = new Schema<BmtcCrowdAlertRecord>({
  userId: { type: String, required: true, index: true },
  routeNumber: { type: String, required: true, trim: true, maxlength: 30 },
  stopId: { type: String, required: true, trim: true, maxlength: 100 },
  destinationStopId: { type: String, trim: true, maxlength: 100 },
  threshold: { type: String, enum: ['HIGH', 'VERY_HIGH'], required: true },
  arrivalWithinMinutes: { type: Number, min: 1, max: 120 },
  onlyIfBetterAlternative: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  lastTriggeredAt: { type: Date },
  lastFingerprint: { type: String },
}, { timestamps: true });

BmtcCrowdAlertSchema.index({ userId: 1, routeNumber: 1, stopId: 1 });

const BmtcCrowdAlertModel = mongoose.models.BmtcCrowdAlert
  || mongoose.model<BmtcCrowdAlertRecord>('BmtcCrowdAlert', BmtcCrowdAlertSchema);

export default BmtcCrowdAlertModel;
