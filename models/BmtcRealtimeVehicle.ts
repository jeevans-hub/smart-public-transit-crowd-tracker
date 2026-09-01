import mongoose, { Schema, type Model } from 'mongoose';

const CrowdEstimateSchema = new Schema({
  crowdLevel: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'], required: true },
  crowdScore: { type: Number, min: 0, max: 100, required: true },
  crowdConfidence: { type: Number, min: 0, max: 100, required: true },
  crowdSource: { type: String, required: true },
  passengerCount: { type: Number, default: null },
}, { _id: false });

const BmtcRealtimeVehicleSchema = new Schema({
  vehicleId: { type: String, required: true, unique: true },
  registrationNumber: { type: String, default: null },
  routeId: { type: String, required: true },
  tripId: { type: String, required: true },
  direction: { type: String, enum: ['OUTBOUND', 'INBOUND'], required: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
  },
  bearing: { type: Number, min: 0, max: 360, required: true },
  speed: { type: Number, default: null, min: 0 },
  currentStopId: { type: String, default: null },
  nextStopId: { type: String, default: null },
  timestamp: { type: Date, required: true },
  occupancy: { type: CrowdEstimateSchema, required: true },
  rawOccupancyStatus: { type: String, default: null },
  dataSource: { type: String, enum: ['BMTC_REALTIME', 'EXTERNAL'], required: true },
  provider: { type: String, enum: ['GTFS_RT', 'MOOVIT'], required: true },
  isLive: { type: Boolean, required: true },
}, { timestamps: true });

BmtcRealtimeVehicleSchema.index({ routeId: 1, timestamp: -1 });
BmtcRealtimeVehicleSchema.index({ tripId: 1, timestamp: -1 });
BmtcRealtimeVehicleSchema.index({ timestamp: -1 });
BmtcRealtimeVehicleSchema.index({ isLive: 1, timestamp: -1 });
BmtcRealtimeVehicleSchema.index({ location: '2dsphere' });

const BmtcRealtimeVehicle: Model<mongoose.InferSchemaType<typeof BmtcRealtimeVehicleSchema>> =
  mongoose.models.BmtcRealtimeVehicle
  || mongoose.model('BmtcRealtimeVehicle', BmtcRealtimeVehicleSchema);

export default BmtcRealtimeVehicle;
