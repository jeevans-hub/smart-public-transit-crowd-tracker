import { IPredictionProvider, IHistoricalData, IPrediction, Trend, RiskLevel, PredictionWindow, IPredictionAlert, IPredictionInsight } from '@/types/prediction';

/**
 * PredictionProvider Interface
 * 
 * This interface defines the contract for prediction algorithms.
 * Current implementation uses local algorithms, but future ML providers
 * (TensorFlow, Python, FastAPI) can implement this interface without
 * changing the frontend code.
 */
export class PredictionProvider implements IPredictionProvider {
  
  /**
   * Generate a crowd prediction based on historical data
   */
  async generatePrediction(
    stationId: string,
    stationName: string,
    historicalData: IHistoricalData[],
    window: PredictionWindow
  ): Promise<IPrediction> {
    throw new Error('Method not implemented.');
  }

  /**
   * Calculate confidence score for a prediction
   */
  calculateConfidence(
    historicalData: IHistoricalData[],
    prediction: number
  ): number {
    throw new Error('Method not implemented.');
  }

  /**
   * Detect trend from historical data
   */
  detectTrend(historicalData: IHistoricalData[]): Trend {
    throw new Error('Method not implemented.');
  }

  /**
   * Detect anomalies in historical data
   */
  detectAnomalies(historicalData: IHistoricalData[]): IPredictionAlert[] {
    throw new Error('Method not implemented.');
  }

  /**
   * Generate AI insights from prediction
   */
  generateInsights(
    stationId: string,
    stationName: string,
    historicalData: IHistoricalData[],
    prediction: IPrediction
  ): IPredictionInsight[] {
    throw new Error('Method not implemented.');
  }

  /**
   * Generate operational recommendations
   */
  generateRecommendations(
    prediction: IPrediction,
    trend: Trend,
    risk: RiskLevel
  ): string {
    throw new Error('Method not implemented.');
  }
}
