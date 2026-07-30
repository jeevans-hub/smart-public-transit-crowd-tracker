import mongoose, { Schema, Model } from 'mongoose';
import { ICrowdReport, ICrowdReportDocument } from '@/types/crowd';

const CrowdReportSchema: Schema<ICrowdReport> = new Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      index: true,
    },
    routeId: {
      type: String,
      required: true,
      index: true,
    },
    stationId: {
      type: String,
      required: true,
      index: true,
    },
    reportedBy: {
      type: String,
      required: true,
      index: true,
    },
    crowdLevel: {
      type: String,
      enum: ['EMPTY', 'LOW', 'MEDIUM', 'HIGH', 'FULL'],
      required: true,
    },
    passengerCount: {
      type: Number,
      required: true,
      min: 0,
    },
    vehicleCapacity: {
      type: Number,
      required: true,
      min: 1,
    },
    occupancyPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    reportSource: {
      type: String,
      enum: ['USER', 'STAFF', 'SYSTEM'],
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

CrowdReportSchema.index({ createdAt: -1 });
CrowdReportSchema.index({ vehicleId: 1, createdAt: -1 });
CrowdReportSchema.index({ routeId: 1, createdAt: -1 });
CrowdReportSchema.index({ stationId: 1, createdAt: -1 });

const CrowdReport: Model<ICrowdReportDocument> = mongoose.models.CrowdReport || mongoose.model<ICrowdReport, ICrowdReportDocument>('CrowdReport', CrowdReportSchema);

export default CrowdReport;
