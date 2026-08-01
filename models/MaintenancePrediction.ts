import mongoose, { Schema, Document } from 'mongoose';

export interface IMaintenancePrediction extends Document {
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskPercentage: number;
  priority: 'ROUTINE' | 'SCHEDULED' | 'URGENT' | 'EMERGENCY';
  estimatedDaysRemaining: number;
  recommendedAction: string;
  factors: {
    vehicleAge: number;
    operatingHours: number;
    utilizationRate: number;
    averageSpeed: number;
    offlineFrequency: number;
    historicalDelay: number;
    passengerLoad: number;
  };
  confidence: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MaintenancePredictionSchema: Schema = new Schema(
  {
    vehicleId: {
      type: String,
      required: [true, 'Vehicle ID is required'],
      index: true,
    },
    vehicleNumber: {
      type: String,
      required: [true, 'Vehicle number is required'],
    },
    vehicleType: {
      type: String,
      required: [true, 'Vehicle type is required'],
    },
    riskLevel: {
      type: String,
      required: [true, 'Risk level is required'],
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    riskPercentage: {
      type: Number,
      required: [true, 'Risk percentage is required'],
      min: 0,
      max: 100,
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: ['ROUTINE', 'SCHEDULED', 'URGENT', 'EMERGENCY'],
    },
    estimatedDaysRemaining: {
      type: Number,
      required: [true, 'Estimated days remaining is required'],
      min: 0,
    },
    recommendedAction: {
      type: String,
      required: [true, 'Recommended action is required'],
    },
    factors: {
      vehicleAge: {
        type: Number,
        required: true,
        min: 0,
      },
      operatingHours: {
        type: Number,
        required: true,
        min: 0,
      },
      utilizationRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      averageSpeed: {
        type: Number,
        required: true,
        min: 0,
      },
      offlineFrequency: {
        type: Number,
        required: true,
        min: 0,
      },
      historicalDelay: {
        type: Number,
        required: true,
        min: 0,
      },
      passengerLoad: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
    },
    confidence: {
      type: Number,
      required: [true, 'Confidence is required'],
      min: 0,
      max: 100,
    },
    generatedAt: {
      type: Date,
      required: [true, 'Generated at timestamp is required'],
    },
  },
  {
    timestamps: true,
  }
);

MaintenancePredictionSchema.index({ vehicleId: 1, generatedAt: -1 });
MaintenancePredictionSchema.index({ riskLevel: 1 });
MaintenancePredictionSchema.index({ priority: 1 });
MaintenancePredictionSchema.index({ generatedAt: -1 });

export default mongoose.models.MaintenancePrediction || mongoose.model<IMaintenancePrediction>('MaintenancePrediction', MaintenancePredictionSchema);