import { Document } from 'mongoose';

export type PredictionWindow = '15' | '30' | '60';
export type Trend = 'INCREASING' | 'STABLE' | 'DECREASING' | 'RAPID_GROWTH' | 'RAPID_DECLINE';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Algorithm = 'WEIGHTED_MOVING_AVERAGE' | 'LINEAR_TREND' | 'HISTORICAL_PATTERN' | 'PEAK_HOUR_DETECTION' | 'HYBRID';

export interface IPrediction {
  stationId: string;
  stationName: string;
  currentCrowd: number;
  predictedCrowd: number;
  predictionWindow: PredictionWindow;
  confidence: number;
  trend: Trend;
  risk: RiskLevel;
  algorithm: Algorithm;
  historyUsed: number;
  recommendation: string;
  explanation: string;
  generatedAt: Date;
}

export interface IPredictionDocument extends IPrediction, Document {
  createdAt: Date;
  updatedAt: Date;
}

export interface IPredictionResponse {
  _id: string;
  stationId: string;
  stationName: string;
  currentCrowd: number;
  predictedCrowd: number;
  predictionWindow: PredictionWindow;
  confidence: number;
  trend: Trend;
  risk: RiskLevel;
  algorithm: Algorithm;
  historyUsed: number;
  recommendation: string;
  explanation: string;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPredictionMetrics {
  meanAbsoluteError: number;
  predictionAccuracy: number;
  averageConfidence: number;
  predictionSuccessRate: number;
  averagePredictionError: number;
  totalPredictions: number;
}

export interface IPredictionAlert {
  id: string;
  stationId: string;
  stationName: string;
  type: 'HIGH_PREDICTION' | 'RAPID_GROWTH' | 'CRITICAL_RISK' | 'LOW_CONFIDENCE' | 'ANOMALY_DETECTED';
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: Date;
}

export interface IPredictionInsight {
  id: string;
  stationId: string;
  stationName: string;
  insight: string;
  category: 'PATTERN' | 'ANOMALY' | 'TREND' | 'PEAK_HOUR' | 'RECOMMENDATION';
  confidence: number;
  timestamp: Date;
}

export interface IHistoricalData {
  timestamp: Date;
  occupancyPercentage: number;
  passengerCount: number;
  crowdLevel: string;
}

export interface IPredictionProvider {
  generatePrediction(
    stationId: string,
    stationName: string,
    historicalData: IHistoricalData[],
    window: PredictionWindow
  ): Promise<IPrediction>;
  
  calculateConfidence(
    historicalData: IHistoricalData[],
    prediction: number
  ): number;
  
  detectTrend(historicalData: IHistoricalData[]): Trend;
  
  detectAnomalies(historicalData: IHistoricalData[]): IPredictionAlert[];
  
  generateInsights(
    stationId: string,
    stationName: string,
    historicalData: IHistoricalData[],
    prediction: IPrediction
  ): IPredictionInsight[];
  
  generateRecommendations(
    prediction: IPrediction,
    trend: Trend,
    risk: RiskLevel
  ): string;
}
