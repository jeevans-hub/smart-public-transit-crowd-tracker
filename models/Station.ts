import mongoose, { Schema, Document } from 'mongoose';

export interface IStation extends Document {
  agencyId: mongoose.Types.ObjectId;
  stationName: string;
  stationCode: string;
  latitude: number;
  longitude: number;
  address: string;
  zone?: string;
  platformCount?: number;
  facilities?: string[];
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StationSchema: Schema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: [true, 'Agency ID is required'],
    },
    stationName: {
      type: String,
      required: [true, 'Station name is required'],
      trim: true,
    },
    stationCode: {
      type: String,
      required: [true, 'Station code is required'],
      trim: true,
      unique: true,
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
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    zone: {
      type: String,
      trim: true,
    },
    platformCount: {
      type: Number,
      min: 0,
    },
    facilities: {
      type: [String],
      default: [],
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

StationSchema.index({ agencyId: 1, stationCode: 1 });

export default mongoose.models.Station || mongoose.model<IStation>('Station', StationSchema);
