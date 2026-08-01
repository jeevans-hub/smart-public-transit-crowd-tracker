/**
 * Statistical utilities for analytics calculations
 */

/**
 * Calculate mean (average) of an array of numbers
 */
export function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * Calculate median of an array of numbers
 */
export function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate standard deviation
 */
export function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
}

/**
 * Calculate variance
 */
export function calculateVariance(values: number[]): number {
  return Math.pow(calculateStandardDeviation(values), 2);
}

/**
 * Calculate minimum value
 */
export function calculateMin(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

/**
 * Calculate maximum value
 */
export function calculateMax(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.max(...values);
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Calculate range (max - min)
 */
export function calculateRange(values: number[]): number {
  return calculateMax(values) - calculateMin(values);
}

/**
 * Calculate sum
 */
export function calculateSum(values: number[]): number {
  return values.reduce((sum, val) => sum + val, 0);
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return newValue > 0 ? 100 : 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate growth rate over time
 */
export function calculateGrowthRate(values: number[]): number {
  if (values.length < 2) return 0;
  const first = values[0];
  const last = values[values.length - 1];
  return calculatePercentageChange(first, last);
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(values: number[], window: number): number[] {
  if (values.length === 0 || window <= 0) return [];
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - window + 1);
    const windowValues = values.slice(start, i + 1);
    result.push(calculateMean(windowValues));
  }
  return result;
}

/**
 * Calculate weighted moving average
 */
export function calculateWeightedMovingAverage(values: number[], weights: number[]): number {
  if (values.length === 0 || weights.length === 0) return 0;
  const minLength = Math.min(values.length, weights.length);
  let sum = 0;
  let weightSum = 0;
  for (let i = 0; i < minLength; i++) {
    sum += values[i] * weights[i];
    weightSum += weights[i];
  }
  return weightSum > 0 ? sum / weightSum : 0;
}

/**
 * Calculate exponential moving average
 */
export function calculateExponentialMovingAverage(values: number[], alpha: number): number[] {
  if (values.length === 0) return [];
  const result: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    const ema = alpha * values[i] + (1 - alpha) * result[i - 1];
    result.push(ema);
  }
  return result;
}

/**
 * Calculate correlation coefficient between two arrays
 */
export function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length === 0 || y.length === 0 || x.length !== y.length) return 0;
  
  const n = x.length;
  const sumX = calculateSum(x);
  const sumY = calculateSum(y);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * Calculate z-score for a value
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Detect outliers using z-score method
 */
export function detectOutliers(values: number[], threshold: number = 3): number[] {
  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values);
  return values.filter(val => Math.abs(calculateZScore(val, mean, stdDev)) > threshold);
}

/**
 * Calculate confidence interval
 */
export function calculateConfidenceInterval(values: number[], confidence: number = 0.95): {
  lower: number;
  upper: number;
} {
  if (values.length === 0) return { lower: 0, upper: 0 };
  
  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values);
  const n = values.length;
  const margin = (stdDev / Math.sqrt(n)) * 1.96; // 1.96 for 95% confidence
  
  return {
    lower: mean - margin,
    upper: mean + margin,
  };
}

/**
 * Calculate mode (most frequent value)
 */
export function calculateMode(values: number[]): number {
  if (values.length === 0) return 0;
  
  const frequency: Record<number, number> = {};
  values.forEach(val => {
    frequency[val] = (frequency[val] || 0) + 1;
  });
  
  let maxFreq = 0;
  let mode = values[0];
  
  Object.entries(frequency).forEach(([val, freq]) => {
    if (freq > maxFreq) {
      maxFreq = freq;
      mode = parseFloat(val);
    }
  });
  
  return mode;
}

/**
 * Calculate skewness
 */
export function calculateSkewness(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values);
  if (stdDev === 0) return 0;
  
  const n = values.length;
  const skew = values.reduce((sum, val) => {
    return sum + Math.pow((val - mean) / stdDev, 3);
  }, 0);
  
  return (n / ((n - 1) * (n - 2))) * skew;
}

/**
 * Calculate kurtosis
 */
export function calculateKurtosis(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = calculateMean(values);
  const stdDev = calculateStandardDeviation(values);
  if (stdDev === 0) return 0;
  
  const n = values.length;
  const kurt = values.reduce((sum, val) => {
    return sum + Math.pow((val - mean) / stdDev, 4);
  }, 0);
  
  return ((n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3))) * kurt - (3 * Math.pow(n - 1, 2)) / ((n - 2) * (n - 3));
}
