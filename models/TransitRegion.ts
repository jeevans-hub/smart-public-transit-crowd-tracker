import mongoose, { Schema, Document } from 'mongoose';
import { TransitRegion as ITransitRegion } from '../types/digitalTwin';

export interface ITransitRegionDocument extends Document {
  cityId: mongoose.Types.ObjectId;
  regionName: string;
  regionCode: string;
  regionType: 'downtown' | 'suburban' | 'rural' | 'industrial' | 'airport' | 'university';
  boundaries: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  description?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TransitRegionSchema: Schema = new Schema(
  {
    cityId: {
      type: Schema.Types.ObjectId,
      ref: 'City',
      required: [true, 'City ID is required'],
    },
    regionName: {
      type: String,
      required: [true, 'Region name is required'],
      trim: true,
    },
    regionCode: {
      type: String,
      required: [true, 'Region code is required'],
      trim: true,
    },
    regionType: {
      type: String,
      required: [true, 'Region type is required'],
      enum: ['downtown', 'suburban', 'rural', 'industrial', 'airport', 'university'],
    },
    boundaries: {
      north: {
        type: Number,
        required: [true, 'North boundary is required'],
      },
      south: {
        type: Number,
        required: [true, 'South boundary is required'],
      },
      east: {
        type: Number,
        required: [true, 'East boundary is required'],
      },
      west: {
        type: Number,
        required: [true, 'West boundary is required'],
      },
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

TransitRegionSchema.index({ cityId: 1, regionCode: 1 });
TransitRegionSchema.index({ regionType: 1 });
TransitRegionSchema.index({ active: 1 });

export default mongoose.models.TransitRegion || mongoose.model<ITransitRegionDocument>('TransitRegion', TransitRegionSchema);
