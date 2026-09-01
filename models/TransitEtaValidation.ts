import mongoose, { Schema, type Model } from 'mongoose';

const TransitEtaValidationSchema = new Schema({
  provider: { type: String, required: true, enum: ['GTFS_RT', 'MOOVIT'] },
  routeId: { type: String, required: true, index: true },
  tripId: { type: String, required: true },
  stopId: { type: String, required: true },
  predictedAt: { type: Date, required: true },
  predictedArrival: { type: Date, required: true },
  actualArrival: { type: Date, required: true },
  errorSeconds: { type: Number, required: true },
  source: { type: String, required: true },
  hourOfDay: { type: Number, min: 0, max: 23, required: true },
}, { timestamps: true });

TransitEtaValidationSchema.index({ provider: 1, routeId: 1, actualArrival: -1 });
TransitEtaValidationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const TransitEtaValidation: Model<mongoose.InferSchemaType<typeof TransitEtaValidationSchema>> =
  mongoose.models.TransitEtaValidation || mongoose.model('TransitEtaValidation', TransitEtaValidationSchema);

export default TransitEtaValidation;
