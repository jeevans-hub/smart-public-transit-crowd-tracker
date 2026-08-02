import mongoose, { Schema, Document } from 'mongoose';
import { City as ICity } from '../types/digitalTwin';

export interface ICityDocument extends Document {
  cityName: string;
  cityCode: string;
  country: string;
  timezone: string;
  latitude: number;
  longitude: number;
  population: number;
  area: number;
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CitySchema: Schema = new Schema(
  {
    cityName: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
    },
    cityCode: {
      type: String,
      required: [true, 'City code is required'],
      trim: true,
      unique: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    timezone: {
      type: String,
      required: [true, 'Timezone is required'],
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
    population: {
      type: Number,
      required: [true, 'Population is required'],
      min: 0,
    },
    area: {
      type: Number,
      required: [true, 'Area is required'],
      min: 0,
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

CitySchema.index({ cityCode: 1 });
CitySchema.index({ country: 1 });
CitySchema.index({ active: 1 });

export default mongoose.models.City || mongoose.model<ICityDocument>('City', CitySchema);
