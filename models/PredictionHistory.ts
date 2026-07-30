import mongoose, { Schema, Model } from 'mongoose';
import { IPrediction, IPredictionDocument } from '@/types/prediction';

const PredictionHistorySchema: Schema<IPrediction> = new Schema(
  {
    stationId: {
      type: String,
      required: true,
      index: true,
    },
    stationName: {
      type: String,
      required: true,
    },
    currentCrowd: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    predictedCrowd: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    predictionWindow: {
      type: String,
      enum: ['15', '30', '60'],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    trend: {
      type: String,
      enum: ['INCREASING', 'STABLE', 'DECREASING', 'RAPID_GROWTH', 'RAPID_DECLINE'],
      required: true,
    },
    risk: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      required: true,
    },
    algorithm: {
      type: String,
      enum: ['WEIGHTED_MOVING_AVERAGE', 'LINEAR_TREND', 'HISTORICAL_PATTERN', 'PEAK_HOUR_DETECTION', 'HYBRID'],
      required: true,
    },
    historyUsed: {
      type: Number,
      required: true,
      min: 0,
    },
    recommendation: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    generatedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

PredictionHistorySchema.index({ stationId: 1, createdAt: -1 });
PredictionHistorySchema.index({ createdAt: -1 });
PredictionHistorySchema.index({ predictionWindow: 1, createdAt: -1 });

const PredictionHistory: Model<IPredictionDocument> = mongoose.models.PredictionHistory || mongoose.model<IPrediction, IPredictionDocument>('PredictionHistory', PredictionHistorySchema);

export default PredictionHistory;
