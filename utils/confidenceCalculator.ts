import { IHistoricalData } from '@/types/prediction';

/**
 * Calculate confidence score based on multiple factors
 */
export function calculateConfidence(
  historicalData: IHistoricalData[],
  prediction: number
): number {
  let confidence = 50; // Base confidence
  
  // Factor 1: Data size (more data = higher confidence)
  const dataSizeScore = calculateDataSizeScore(historicalData.length);
  confidence = (confidence + dataSizeScore) / 2;
  
  // Factor 2: Data consistency (lower variance = higher confidence)
  const consistencyScore = calculateConsistencyScore(historicalData);
  confidence = (confidence + consistencyScore) / 2;
  
  // Factor 3: Time recency (more recent data = higher confidence)
  const recencyScore = calculateRecencyScore(historicalData);
  confidence = (confidence + recencyScore) / 2;
  
  // Factor 4: Prediction reasonableness
  const reasonablenessScore = calculateReasonablenessScore(prediction, historicalData);
  confidence = (confidence + reasonablenessScore) / 2;
  
  // Factor 5: Data coverage
  const coverageScore = calculateCoverageScore(historicalData);
  confidence = (confidence + coverageScore) / 2;
  
  return Math.round(Math.max(0, Math.min(100, confidence)));
}

/**
 * Calculate score based on data size
 */
function calculateDataSizeScore(dataSize: number): number {
  if (dataSize === 0) return 0;
  if (dataSize < 5) return 30;
  if (dataSize < 10) return 50;
  if (dataSize < 20) return 70;
  if (dataSize < 50) return 85;
  return 95;
}

/**
 * Calculate score based on data consistency (inverse of variance)
 */
function calculateConsistencyScore(historicalData: IHistoricalData[]): number {
  if (historicalData.length < 2) return 50;
  
  const values = historicalData.map((d) => d.occupancyPercentage);
  const variance = values.reduce((sum, val) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return sum + Math.pow(val - mean, 2);
  }, 0) / values.length;
  
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation = higher confidence
  if (stdDev < 5) return 95;
  if (stdDev < 10) return 85;
  if (stdDev < 15) return 70;
  if (stdDev < 20) return 50;
  if (stdDev < 30) return 30;
  return 20;
}

/**
 * Calculate score based on data recency
 */
function calculateRecencyScore(historicalData: IHistoricalData[]): number {
  if (historicalData.length === 0) return 0;
  
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  const recentCount = historicalData.filter((d) => d.timestamp >= oneHourAgo).length;
  const semiRecentCount = historicalData.filter((d) => d.timestamp >= sixHoursAgo).length;
  const dayCount = historicalData.filter((d) => d.timestamp >= twentyFourHoursAgo).length;
  
  if (recentCount >= 5) return 95;
  if (recentCount >= 3) return 85;
  if (semiRecentCount >= 10) return 75;
  if (semiRecentCount >= 5) return 60;
  if (dayCount >= 20) return 50;
  if (dayCount >= 10) return 35;
  return 20;
}

/**
 * Calculate score based on prediction reasonableness
 */
function calculateReasonablenessScore(
  prediction: number,
  historicalData: IHistoricalData[]
): number {
  if (historicalData.length === 0) return 50;
  
  const values = historicalData.map((d) => d.occupancyPercentage);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  
  // Check if prediction is within reasonable bounds
  if (prediction < 0 || prediction > 100) return 10;
  
  // Check if prediction is within historical range (with some margin)
  const margin = 20;
  if (prediction >= min - margin && prediction <= max + margin) {
    return 90;
  }
  
  // Check if prediction is close to mean
  const deviationFromMean = Math.abs(prediction - mean);
  if (deviationFromMean < 15) return 80;
  if (deviationFromMean < 30) return 60;
  if (deviationFromMean < 50) return 40;
  
  return 20;
}

/**
 * Calculate score based on time coverage
 */
function calculateCoverageScore(historicalData: IHistoricalData[]): number {
  if (historicalData.length === 0) return 0;
  
  const timestamps = historicalData.map((d) => d.timestamp.getTime()).sort((a, b) => a - b);
  const timeSpan = timestamps[timestamps.length - 1] - timestamps[0];
  const hoursSpan = timeSpan / (60 * 60 * 1000);
  
  // Ideal coverage is at least 24 hours of data
  if (hoursSpan >= 24) return 95;
  if (hoursSpan >= 12) return 80;
  if (hoursSpan >= 6) return 60;
  if (hoursSpan >= 3) return 40;
  if (hoursSpan >= 1) return 20;
  
  return 10;
}

/**
 * Calculate prediction interval (confidence range)
 */
export function calculatePredictionInterval(
  prediction: number,
  confidence: number,
  historicalData: IHistoricalData[]
): { lower: number; upper: number } {
  const values = historicalData.map((d) => d.occupancyPercentage);
  const stdDev = values.length > 1 ? Math.sqrt(
    values.reduce((sum, val) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      return sum + Math.pow(val - mean, 2);
    }, 0) / values.length
  ) : 10;
  
  // Wider interval for lower confidence
  const confidenceFactor = (100 - confidence) / 100 * 2;
  const margin = stdDev * confidenceFactor;
  
  return {
    lower: Math.max(0, prediction - margin),
    upper: Math.min(100, prediction + margin),
  };
}
