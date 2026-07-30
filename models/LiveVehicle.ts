import mongoose, { Schema, Model } from 'mongoose';
import { ILiveVehicle, ILiveVehicleDocument } from '@/types/vehicle';

const LiveVehicleSchema: Schema<ILiveVehicle> = new Schema(
  {
    vehicleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: true,
      index: true,
    },
    vehicleType: {
      type: String,
      required: true,
    },
    route: {
      type: String,
      required: true,
      index: true,
    },
    driverName: {
      type: String,
    },
    currentStation: {
      type: String,
    },
    nextStation: {
      type: String,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    speed: {
      type: Number,
      default: 0,
      min: 0,
    },
    heading: {
      type: Number,
      default: 0,
      min: 0,
      max: 360,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    currentPassengers: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: ['MOVING', 'STOPPED', 'DELAYED', 'OFFLINE'],
      default: 'STOPPED',
      required: true,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

LiveVehicleSchema.index({ route: 1, status: 1 });
LiveVehicleSchema.index({ lastUpdated: -1 });
LiveVehicleSchema.index({ currentStation: 1 });

const LiveVehicle: Model<ILiveVehicleDocument> = mongoose.models.LiveVehicle || mongoose.model<ILiveVehicle, ILiveVehicleDocument>('LiveVehicle', LiveVehicleSchema);

export default LiveVehicle;
