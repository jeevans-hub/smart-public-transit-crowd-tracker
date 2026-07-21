import mongoose, { Schema, Document } from 'mongoose';

export interface IAgency extends Document {
  name: string;
  city: string;
  state: string;
  country: string;
  logo?: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AgencySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Agency name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
    },
    logo: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, 'Contact email is required'],
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    website: {
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

export default mongoose.models.Agency || mongoose.model<IAgency>('Agency', AgencySchema);
