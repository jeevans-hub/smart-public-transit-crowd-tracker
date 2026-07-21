import mongoose, { Schema, Document } from 'mongoose';

export interface IRouteStop {
  stationId: mongoose.Types.ObjectId;
  stationName: string;
  sequence: number;
  arrivalTime?: string;
  departureTime?: string;
}

export interface IRoute extends Document {
  agencyId: mongoose.Types.ObjectId;
  routeNumber: string;
  routeName: string;
  transportType: 'BUS' | 'METRO' | 'TRAIN';
  originStation: string;
  destinationStation: string;
  stops: IRouteStop[];
  estimatedDuration?: number;
  distance?: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RouteStopSchema: Schema = new Schema({
  stationId: {
    type: Schema.Types.ObjectId,
    ref: 'Station',
    required: true,
  },
  stationName: {
    type: String,
    required: true,
    trim: true,
  },
  sequence: {
    type: Number,
    required: true,
  },
  arrivalTime: {
    type: String,
    trim: true,
  },
  departureTime: {
    type: String,
    trim: true,
  },
});

const RouteSchema: Schema = new Schema(
  {
    agencyId: {
      type: Schema.Types.ObjectId,
      ref: 'Agency',
      required: [true, 'Agency ID is required'],
    },
    routeNumber: {
      type: String,
      required: [true, 'Route number is required'],
      trim: true,
    },
    routeName: {
      type: String,
      required: [true, 'Route name is required'],
      trim: true,
    },
    transportType: {
      type: String,
      required: [true, 'Transport type is required'],
      enum: ['BUS', 'METRO', 'TRAIN'],
    },
    originStation: {
      type: String,
      required: [true, 'Origin station is required'],
      trim: true,
    },
    destinationStation: {
      type: String,
      required: [true, 'Destination station is required'],
      trim: true,
    },
    stops: {
      type: [RouteStopSchema],
      default: [],
    },
    estimatedDuration: {
      type: Number,
      min: 0,
    },
    distance: {
      type: Number,
      min: 0,
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

RouteSchema.index({ agencyId: 1, routeNumber: 1 });

export default mongoose.models.Route || mongoose.model<IRoute>('Route', RouteSchema);
