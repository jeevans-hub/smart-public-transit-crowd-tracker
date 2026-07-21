import mongoose, { Schema, Document } from 'mongoose';

export interface IVehicle extends Document {
  agencyId: mongoose.Types.ObjectId;
  routeId: mongoose.Types.ObjectId;
  vehicleNumber: string;
  vehicleType: string;
  capacity: number;
  currentPassengers: number;
  driverName?: string;
  gpsEnabled: boolean;
  status: 'ACTIVE' | 'IN_SERVICE' | 'MAINTENANCE' | 'OFFLINE';
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema: Schema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: [true, 'Agency ID is required'],
    },
    routeId: {
      type: Schema.Types.ObjectId,
      ref: 'Route',
      required: [true, 'Route ID is required'],
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
      trim: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
    currentPassengers: {
      type: Number,
      default: 0,
      min: 0,
    },
    driverName: {
      type: String,
      trim: true,
    },
    gpsEnabled: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: ['ACTIVE', 'IN_SERVICE', 'MAINTENANCE', 'OFFLINE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

VehicleSchema.index({ agencyId: 1, routeId: 1 });
VehicleSchema.index({ vehicleNumber: 1 });

export default mongoose.models.Vehicle || mongoose.model<IVehicle>('Vehicle', VehicleSchema);
