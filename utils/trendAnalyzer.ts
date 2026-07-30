import { IHistoricalData, Trend } from '@/types/prediction';

/**
 * Calculate linear regression slope
 */
export function calculateLinearRegression(data: number[]): { slope: number; intercept: number } {
  if (data.length < 2) return { slope: 0, intercept: data[0] || 0 };
  
  const n = data.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = data;
  
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumXX = xValues.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

/**
 * Calculate growth rate percentage
 */
export function calculateGrowthRate(data: number[]): number {
  if (data.length < 2) return 0;
  
  const oldest = data[0];
  const newest = data[data.length - 1];
  
  if (oldest === 0) return newest > 0 ? 100 : 0;
  
  return ((newest - oldest) / oldest) * 100;
}

/**
 * Calculate variance for stability analysis
 */
export function calculateVariance(data: number[]): number {
  if (data.length === 0) return 0;
  
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squaredDiffs = data.map((value) => Math.pow(value - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(data: number[]): number {
  return Math.sqrt(calculateVariance(data));
}

/**
 * Detect trend from historical data
 */
export function detectTrend(historicalData: IHistoricalData[]): Trend {
  if (historicalData.length < 2) return 'STABLE';
  
  const values = historicalData.map((d) => d.occupancyPercentage);
  const { slope } = calculateLinearRegression(values);
  const growthRate = calculateGrowthRate(values);
  const stdDev = calculateStandardDeviation(values);
  
  // Normalize slope by standard deviation to account for volatility
  const normalizedSlope = stdDev > 0 ? slope / stdDev : 0;
  
  // Thresholds for trend classification
  const rapidGrowthThreshold = 0.5;
  const rapidDeclineThreshold = -0.5;
  const growthThreshold = 0.2;
  const declineThreshold = -0.2;
  
  if (normalizedSlope >= rapidGrowthThreshold || growthRate > 30) {
    return 'RAPID_GROWTH';
  } else if (normalizedSlope <= rapidDeclineThreshold || growthRate < -30) {
    return 'RAPID_DECLINE';
  } else if (normalizedSlope >= growthThreshold || growthRate > 10) {
    return 'INCREASING';
  } else if (normalizedSlope <= declineThreshold || growthRate < -10) {
    return 'DECREASING';
  } else {
    return 'STABLE';
  }
}

/**
 * Calculate trend strength (0-1)
 */
export function calculateTrendStrength(historicalData: IHistoricalData[]): number {
  if (historicalData.length < 2) return 0;
  
  const values = historicalData.map((d) => d.occupancyPercentage);
  const { slope } = calculateLinearRegression(values);
  const stdDev = calculateStandardDeviation(values);
  
  if (stdDev === 0) return 0;
  
  const normalizedSlope = Math.abs(slope / stdDev);
  return Math.min(1, normalizedSlope);
}

/**
 * Predict future value based on trend
 */
export function predictFromTrend(
  historicalData: IHistoricalData[],
  periodsAhead: number
): number {
  if (historicalData.length === 0) return 0;
  
  const values = historicalData.map((d) => d.occupancyPercentage);
  const { slope, intercept } = calculateLinearRegression(values);
  
  const lastX = values.length - 1;
  const predictedX = lastX + periodsAhead;
  const predictedValue = slope * predictedX + intercept;
  
  return Math.max(0, Math.min(100, predictedValue));
}
