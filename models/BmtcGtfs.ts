import mongoose, { Schema } from 'mongoose';

const BmtcGtfsStopSchema = new Schema({
  stopId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  area: { type: String, required: true },
  routes: { type: [String], default: [] },
  source: { type: String, enum: ['GTFS_STATIC'], required: true },
  lastUpdated: { type: Date, required: true },
}, { timestamps: true });
BmtcGtfsStopSchema.index({ location: '2dsphere' });

const BmtcGtfsRouteSchema = new Schema({
  routeId: { type: String, required: true, unique: true },
  routeNumber: { type: String, required: true },
  shortName: { type: String, required: true },
  longName: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  stopIds: { type: [String], default: [] },
  source: { type: String, enum: ['GTFS_STATIC'], required: true },
}, { timestamps: true });
BmtcGtfsRouteSchema.index({ routeNumber: 1 });

const BmtcGtfsTripSchema = new Schema({
  tripId: { type: String, required: true, unique: true },
  rawTripId: { type: String, required: true },
  routeId: { type: String, required: true },
  rawRouteId: { type: String, required: true },
  serviceId: { type: String, required: true },
  direction: { type: String, enum: ['OUTBOUND', 'INBOUND'], required: true },
  headsign: { type: String, default: '' },
  shapeId: { type: String, default: null },
  stopIds: { type: [String], default: [] },
  rawStopIds: { type: [String], default: [] },
}, { timestamps: true });
BmtcGtfsTripSchema.index({ routeId: 1 });

export const BmtcGtfsStop = mongoose.models.BmtcGtfsStop || mongoose.model('BmtcGtfsStop', BmtcGtfsStopSchema);
export const BmtcGtfsRoute = mongoose.models.BmtcGtfsRoute || mongoose.model('BmtcGtfsRoute', BmtcGtfsRouteSchema);
export const BmtcGtfsTrip = mongoose.models.BmtcGtfsTrip || mongoose.model('BmtcGtfsTrip', BmtcGtfsTripSchema);
