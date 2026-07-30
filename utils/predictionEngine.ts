import { IHistoricalData, IPrediction, Trend, RiskLevel, PredictionWindow, Algorithm, IPredictionAlert, IPredictionInsight } from '@/types/prediction';
import { predictNextMovingAverage } from './movingAverage';
import { detectTrend, predictFromTrend, calculateTrendStrength } from './trendAnalyzer';
import { calculateConfidence, calculatePredictionInterval } from './confidenceCalculator';
import { detectAnomalies, calculateAnomalyScore } from './anomalyDetector';
import { detectPeakHours, adjustForPeakHour, predictPeakHour, getCurrentPeakHourStatus } from './peakHourDetector';
import { generateRecommendations, generateOperationalSummary } from './recommendationEngine';

/**
 * Main Prediction Engine
 * Combines multiple algorithms to generate accurate crowd predictions
 */
export class PredictionEngine {
  
  /**
   * Generate a comprehensive prediction
   */
  static generatePrediction(
    stationId: string,
    stationName: string,
    historicalData: IHistoricalData[],
    window: PredictionWindow
  ): IPrediction {
    if (historicalData.length === 0) {
      return this.getDefaultPrediction(stationId, stationName, window);
    }
    
    // Step 1: Calculate base prediction using moving average
    const basePrediction = predictNextMovingAverage(historicalData, 5, 60);
    
    // Step 2: Adjust for trend
    const trend = detectTrend(historicalData);
    const trendPrediction = predictFromTrend(historicalData, this.getWindowMultiplier(window));
    
    // Step 3: Adjust for peak hours
    const peakHourPrediction = adjustForPeakHour(trendPrediction, historicalData, this.getWindowMinutes(window));
    
    // Step 4: Combine predictions with weighted average
    const weights = { movingAvg: 0.3, trend: 0.4, peakHour: 0.3 };
    const finalPrediction = Math.round(
      basePrediction * weights.movingAvg +
      trendPrediction * weights.trend +
      peakHourPrediction * weights.peakHour
    );
    
    // Step 5: Clamp to valid range
    const clampedPrediction = Math.max(0, Math.min(100, finalPrediction));
    
    // Step 6: Calculate confidence
    const confidence = calculateConfidence(historicalData, clampedPrediction);
    
    // Step 7: Determine risk level
    const risk = this.calculateRiskLevel(clampedPrediction, trend, confidence);
    
    // Step 8: Determine algorithm used
    const algorithm = this.determineAlgorithm(historicalData, trend);
    
    // Step 9: Generate explanation
    const explanation = this.generateExplanation(historicalData, trend, clampedPrediction, window, algorithm);
    
    // Step 10: Generate recommendation
    const recommendation = generateRecommendations(
      {
        stationId,
        stationName,
        currentCrowd: historicalData[historicalData.length - 1].occupancyPercentage,
        predictedCrowd: clampedPrediction,
        predictionWindow: window,
        confidence,
        trend,
        risk,
        algorithm,
        historyUsed: historicalData.length,
        recommendation: '',
        explanation: '',
        generatedAt: new Date(),
      },
      trend,
      risk
    );
    
    return {
      stationId,
      stationName,
      currentCrowd: historicalData[historicalData.length - 1].occupancyPercentage,
      predictedCrowd: clampedPrediction,
      predictionWindow: window,
      confidence,
      trend,
      risk,
      algorithm,
      historyUsed: historicalData.length,
      recommendation,
      explanation,
      generatedAt: new Date(),
    };
  }
  
  /**
   * Get default prediction when no historical data is available
   */
  private static getDefaultPrediction(
    stationId: string,
    stationName: string,
    window: PredictionWindow
  ): IPrediction {
    return {
      stationId,
      stationName,
      currentCrowd: 50,
      predictedCrowd: 50,
      predictionWindow: window,
      confidence: 20,
      trend: 'STABLE',
      risk: 'MEDIUM',
      algorithm: 'WEIGHTED_MOVING_AVERAGE',
      historyUsed: 0,
      recommendation: 'Insufficient historical data for accurate prediction. Collect more crowd reports.',
      explanation: 'No historical data available. Using default values.',
      generatedAt: new Date(),
    };
  }
  
  /**
   * Calculate risk level based on prediction, trend, and confidence
   */
  private static calculateRiskLevel(
    prediction: number,
    trend: Trend,
    confidence: number
  ): RiskLevel {
    // High crowd level increases risk
    if (prediction >= 90) return 'CRITICAL';
    if (prediction >= 75) return 'HIGH';
    if (prediction >= 50) return 'MEDIUM';
    
    // Rapid trends increase risk
    if (trend === 'RAPID_GROWTH' && prediction > 60) return 'HIGH';
    if (trend === 'RAPID_GROWTH') return 'MEDIUM';
    
    // Low confidence increases risk
    if (confidence < 40 && prediction > 40) return 'MEDIUM';
    
    return 'LOW';
  }
  
  /**
   * Determine which algorithm was primarily used
   */
  private static determineAlgorithm(historicalData: IHistoricalData[], trend: Trend): Algorithm {
    if (historicalData.length < 5) return 'WEIGHTED_MOVING_AVERAGE';
    if (trend === 'RAPID_GROWTH' || trend === 'RAPID_DECLINE') return 'LINEAR_TREND';
    if (historicalData.length >= 20) return 'HISTORICAL_PATTERN';
    
    const peakStatus = getCurrentPeakHourStatus(historicalData);
    if (peakStatus.isPeakHour) return 'PEAK_HOUR_DETECTION';
    
    return 'HYBRID';
  }
  
  /**
   * Generate explanation for the prediction
   */
  private static generateExplanation(
    historicalData: IHistoricalData[],
    trend: Trend,
    prediction: number,
    window: PredictionWindow,
    algorithm: Algorithm
  ): string {
    const parts: string[] = [];
    
    // Data size
    parts.push(`Based on ${historicalData.length} historical reports`);
    
    // Trend explanation
    switch (trend) {
      case 'INCREASING':
        parts.push('showing a steady increasing pattern');
        break;
      case 'DECREASING':
        parts.push('showing a steady decreasing pattern');
        break;
      case 'RAPID_GROWTH':
        parts.push('indicating rapid growth in passenger density');
        break;
      case 'RAPID_DECLINE':
        parts.push('indicating rapid decline in passenger density');
        break;
      case 'STABLE':
        parts.push('showing stable passenger flow');
        break;
    }
    
    // Peak hour context
    const peakStatus = getCurrentPeakHourStatus(historicalData);
    if (peakStatus.isPeakHour) {
      parts.push(`during ${peakStatus.peakLevel.toLowerCase()} peak hour period`);
    }
    
    // Algorithm explanation
    switch (algorithm) {
      case 'WEIGHTED_MOVING_AVERAGE':
        parts.push('using weighted moving average analysis');
        break;
      case 'LINEAR_TREND':
        parts.push('using linear trend projection');
        break;
      case 'HISTORICAL_PATTERN':
        parts.push('using historical pattern matching');
        break;
      case 'PEAK_HOUR_DETECTION':
        parts.push('adjusting for peak hour patterns');
        break;
      case 'HYBRID':
        parts.push('using hybrid algorithm combining multiple factors');
        break;
    }
    
    // Prediction window
    parts.push(`for the next ${window} minutes`);
    
    return parts.join('. ') + '.';
  }
  
  /**
   * Get window multiplier for trend prediction
   */
  private static getWindowMultiplier(window: PredictionWindow): number {
    switch (window) {
      case '15':
        return 1;
      case '30':
        return 2;
      case '60':
        return 4;
      default:
        return 1;
    }
  }
  
  /**
   * Get window minutes
   */
  private static getWindowMinutes(window: PredictionWindow): number {
    return parseInt(window);
  }
  
  /**
   * Generate all alerts for a prediction
   */
  static generateAlerts(
    stationId: string,
    stationName: string,
    historicalData: IHistoricalData[],
    prediction: IPrediction
  ): IPredictionAlert[] {
    const alerts: IPredictionAlert[] = [];
    
    // Add anomaly detection alerts
    const anomalyAlerts = detectAnomalies(historicalData);
    alerts.push(...anomalyAlerts.map((alert) => ({
      ...alert,
      stationId,
      stationName,
    })));
    
    // Add prediction-based alerts
    if (prediction.predictedCrowd > 90) {
      alerts.push({
        id: `high-prediction-${Date.now()}`,
        stationId,
        stationName,
        type: 'HIGH_PREDICTION',
        message: `Prediction exceeds 90%: ${prediction.predictedCrowd}% expected within ${prediction.predictionWindow} minutes`,
        severity: 'CRITICAL',
        timestamp: new Date(),
      });
    }
    
    if (prediction.trend === 'RAPID_GROWTH') {
      alerts.push({
        id: `rapid-growth-${Date.now()}`,
        stationId,
        stationName,
        type: 'RAPID_GROWTH',
        message: 'Rapid crowd growth detected - prepare for increased demand',
        severity: 'WARNING',
        timestamp: new Date(),
      });
    }
    
    if (prediction.risk === 'CRITICAL') {
      alerts.push({
        id: `critical-risk-${Date.now()}`,
        stationId,
        stationName,
        type: 'CRITICAL_RISK',
        message: 'Critical risk level - immediate action required',
        severity: 'CRITICAL',
        timestamp: new Date(),
      });
    }
    
    if (prediction.confidence < 50) {
      alerts.push({
        id: `low-confidence-${Date.now()}`,
        stationId,
        stationName,
        type: 'LOW_CONFIDENCE',
        message: `Low prediction confidence: ${prediction.confidence}% - increase manual monitoring`,
        severity: 'WARNING',
        timestamp: new Date(),
      });
    }
    
    return alerts;
  }
  
  /**
   * Generate insights from prediction
   */
  static generateInsights(
    stationId: string,
    stationName: string,
    historicalData: IHistoricalData[],
    prediction: IPrediction
  ): IPredictionInsight[] {
    const insights: IPredictionInsight[] = [];
    
    // Trend insight
    insights.push({
      id: `trend-${Date.now()}`,
      stationId,
      stationName,
      insight: `${stationName} is experiencing a ${prediction.trend.toLowerCase().replace('_', ' ')} trend`,
      category: 'TREND',
      confidence: prediction.confidence,
      timestamp: new Date(),
    });
    
    // Peak hour insight
    const peakStatus = getCurrentPeakHourStatus(historicalData);
    if (peakStatus.isPeakHour) {
      insights.push({
        id: `peak-${Date.now()}`,
        stationId,
        stationName,
        insight: `Currently in ${peakStatus.peakLevel.toLowerCase()} peak hour period`,
        category: 'PEAK_HOUR',
        confidence: 85,
        timestamp: new Date(),
      });
    }
    
    // Prediction insight
    if (prediction.predictedCrowd > 75) {
      insights.push({
        id: `high-crowd-${Date.now()}`,
        stationId,
        stationName,
        insight: `${stationName} will exceed 75% occupancy within ${prediction.predictionWindow} minutes`,
        category: 'PATTERN',
        confidence: prediction.confidence,
        timestamp: new Date(),
      });
    }
    
    // Anomaly insight
    const anomalyScore = calculateAnomalyScore(prediction.predictedCrowd, historicalData);
    if (anomalyScore > 50) {
      insights.push({
        id: `anomaly-${Date.now()}`,
        stationId,
        stationName,
        insight: `Unusual crowd pattern detected (anomaly score: ${anomalyScore.toFixed(0)})`,
        category: 'ANOMALY',
        confidence: 100 - anomalyScore,
        timestamp: new Date(),
      });
    }
    
    // Rush hour pattern
    const rushHours = detectPeakHours(historicalData);
    if (rushHours.length > 0) {
      const topPeak = rushHours[0];
      insights.push({
        id: `rush-hour-${Date.now()}`,
        stationId,
        stationName,
        insight: `Peak activity typically occurs around ${topPeak.hour}:00 with ${topPeak.averageOccupancy.toFixed(0)}% occupancy`,
        category: 'PATTERN',
        confidence: Math.min(95, 50 + topPeak.count * 2),
        timestamp: new Date(),
      });
    }
    
    return insights;
  }
  
  /**
   * Calculate prediction metrics
   */
  static calculateMetrics(predictions: IPrediction[]): {
    meanAbsoluteError: number;
    predictionAccuracy: number;
    averageConfidence: number;
    predictionSuccessRate: number;
    averagePredictionError: number;
    totalPredictions: number;
  } {
    if (predictions.length === 0) {
      return {
        meanAbsoluteError: 0,
        predictionAccuracy: 0,
        averageConfidence: 0,
        predictionSuccessRate: 0,
        averagePredictionError: 0,
        totalPredictions: 0,
      };
    }
    
    const totalPredictions = predictions.length;
    const averageConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / totalPredictions;
    
    // Calculate average prediction error (predicted vs current as proxy)
    const errors = predictions.map((p) => Math.abs(p.predictedCrowd - p.currentCrowd));
    const averagePredictionError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const meanAbsoluteError = averagePredictionError;
    
    // Calculate accuracy (inverse of error, normalized)
    const predictionAccuracy = Math.max(0, 100 - averagePredictionError);
    
    // Success rate (predictions with confidence > 70%)
    const successfulPredictions = predictions.filter((p) => p.confidence > 70).length;
    const predictionSuccessRate = (successfulPredictions / totalPredictions) * 100;
    
    return {
      meanAbsoluteError,
      predictionAccuracy,
      averageConfidence,
      predictionSuccessRate,
      averagePredictionError,
      totalPredictions,
    };
  }
}
