import mongoose, { Schema, Document } from 'mongoose';
import { SystemHealth as ISystemHealth } from '../types/digitalTwin';

export interface ISystemHealthDocument extends Document {
  cityId: mongoose.Types.ObjectId;
  timestamp: Date;
  overallHealthScore: number;
  passengerFlowIndex: number;
  fleetAvailability: number;
  operationalEfficiency: number;
  predictionAccuracy: number;
  systemReliability: number;
  incidentSeverityIndex: number;
  resourceUtilization: number;
  infrastructureHealth: number;
  details: {
    totalStations: number;
    activeStations: number;
    totalVehicles: number;
    activeVehicles: number;
    totalRoutes: number;
    activeRoutes: number;
    totalIncidents: number;
    activeIncidents: number;
    averageDelay: number;
    averageOccupancy: number;
    averageSpeed: number;
  };
  createdAt: Date;
}

const SystemHealthSchema: Schema = new Schema(
  {
    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: [true, 'City ID is required'],
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
    },
    overallHealthScore: {
      type: Number,
      required: [true, 'Overall health score is required'],
      min: 0,
      max: 100,
    },
    passengerFlowIndex: {
      type: Number,
      required: [true, 'Passenger flow index is required'],
      min: 0,
      max: 100,
    },
    fleetAvailability: {
      type: Number,
      required: [true, 'Fleet availability is required'],
      min: 0,
      max: 100,
    },
    operationalEfficiency: {
      type: Number,
      required: [true, 'Operational efficiency is required'],
      min: 0,
      max: 100,
    },
    predictionAccuracy: {
      type: Number,
      required: [true, 'Prediction accuracy is required'],
      min: 0,
      max: 100,
    },
    systemReliability: {
      type: Number,
      required: [true, 'System reliability is required'],
      min: 0,
      max: 100,
    },
    incidentSeverityIndex: {
      type: Number,
      required: [true, 'Incident severity index is required'],
      min: 0,
      max: 100,
    },
    resourceUtilization: {
      type: Number,
      required: [true, 'Resource utilization is required'],
      min: 0,
      max: 100,
    },
    infrastructureHealth: {
      type: Number,
      required: [true, 'Infrastructure health is required'],
      min: 0,
      max: 100,
    },
    details: {
      totalStations: {
        type: Number,
        required: true,
        min: 0,
      },
      activeStations: {
        type: Number,
        required: true,
        min: 0,
      },
      totalVehicles: {
        type: Number,
        required: true,
        min: 0,
      },
      activeVehicles: {
        type: Number,
        required: true,
        min: 0,
      },
      totalRoutes: {
        type: Number,
        required: true,
        min: 0,
      },
      activeRoutes: {
        type: Number,
        required: true,
        min: 0,
      },
      totalIncidents: {
        type: Number,
        required: true,
        min: 0,
      },
      activeIncidents: {
        type: Number,
        required: true,
        min: 0,
      },
      averageDelay: {
        type: Number,
        required: true,
        min: 0,
      },
      averageOccupancy: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      averageSpeed: {
        type: Number,
        required: true,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

SystemHealthSchema.index({ cityId: 1, timestamp: -1 });
SystemHealthSchema.index({ timestamp: -1 });

export default mongoose.models.SystemHealth || mongoose.model<ISystemHealthDocument>('SystemHealth', SystemHealthSchema);
