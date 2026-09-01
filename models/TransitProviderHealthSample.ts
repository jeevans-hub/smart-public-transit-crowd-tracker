import mongoose, { Schema, type Model } from 'mongoose';

const TransitProviderHealthSampleSchema = new Schema({
  provider: { type: String, required: true },
  state: { type: String, required: true },
  decision: { type: String, required: true },
  success: { type: Boolean, required: true },
  latencyMs: { type: Number, default: null },
  vehicleCount: { type: Number, required: true },
  freshPercent: { type: Number, default: null },
  mappingPercent: { type: Number, default: null },
  httpStatus: { type: Number, default: null },
  failureKind: { type: String, enum: ['RATE_LIMIT', 'TIMEOUT', 'AUTH', 'STALE', 'OTHER', null], default: null },
  sampledAt: { type: Date, required: true, default: Date.now },
}, { timestamps: true });

TransitProviderHealthSampleSchema.index({ provider: 1, sampledAt: -1 });
TransitProviderHealthSampleSchema.index({ sampledAt: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

const TransitProviderHealthSample: Model<mongoose.InferSchemaType<typeof TransitProviderHealthSampleSchema>> =
  mongoose.models.TransitProviderHealthSample || mongoose.model('TransitProviderHealthSample', TransitProviderHealthSampleSchema);

export default TransitProviderHealthSample;
