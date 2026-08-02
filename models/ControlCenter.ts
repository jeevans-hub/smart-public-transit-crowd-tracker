import mongoose, { Schema, Document } from 'mongoose';
import { ControlCenter as IControlCenter } from '../types/digitalTwin';

export interface IControlCenterDocument extends Document {
  cityId: mongoose.Types.ObjectId;
  centerName: string;
  centerCode: string;
  centerType: 'main' | 'regional' | 'depot' | 'emergency';
  address: string;
  latitude: number;
  longitude: number;
  capacity: number;
  regionIds: mongoose.Types.ObjectId[];
  agencyIds: mongoose.Types.ObjectId[];
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ControlCenterSchema: Schema = new Schema(
  {
    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: [true, 'City ID is required'],
    },
    centerName: {
      type: String,
      required: [true, 'Center name is required'],
      trim: true,
    },
    centerCode: {
      type: String,
      required: [true, 'Center code is required'],
      trim: true,
    },
    centerType: {
      type: String,
      required: [true, 'Center type is required'],
      enum: ['main', 'regional', 'depot', 'emergency'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: -90,
      max: 90,
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: -180,
      max: 180,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 0,
    },
    regionIds: {
      type: [Schema.Types.ObjectId],
      ref: 'TransitRegion',
      default: [],
    },
    agencyIds: {
      type: [Schema.Types.ObjectId],
      ref: 'Agency',
      default: [],
    },
    description: {
      type: String,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

ControlCenterSchema.index({ cityId: 1, centerCode: 1 });
ControlCenterSchema.index({ centerType: 1 });
ControlCenterSchema.index({ active: 1 });

export default mongoose.models.ControlCenter || mongoose.model<IControlCenterDocument>('ControlCenter', ControlCenterSchema);
