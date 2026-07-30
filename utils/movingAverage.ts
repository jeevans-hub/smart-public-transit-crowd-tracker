import { IHistoricalData } from '@/types/prediction';

/**
 * Calculate simple moving average
 */
export function calculateSimpleMovingAverage(data: number[], period: number): number {
  if (data.length === 0) return 0;
  if (period <= 0 || period > data.length) period = data.length;
  
  const slice = data.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / slice.length;
}

/**
 * Calculate weighted moving average
 * More recent values have higher weights
 */
export function calculateWeightedMovingAverage(data: number[], period: number): number {
  if (data.length === 0) return 0;
  if (period <= 0 || period > data.length) period = data.length;
  
  const slice = data.slice(-period);
  let weightedSum = 0;
  let weightSum = 0;
  
  for (let i = 0; i < slice.length; i++) {
    const weight = i + 1; // Linear weights: 1, 2, 3, ...
    weightedSum += slice[i] * weight;
    weightSum += weight;
  }
  
  return weightedSum / weightSum;
}

/**
 * Calculate exponential moving average
 * Gives more weight to recent data with exponential decay
 */
export function calculateExponentialMovingAverage(data: number[], period: number): number {
  if (data.length === 0) return 0;
  if (period <= 0) period = 1;
  
  const multiplier = 2 / (period + 1);
  let ema = data[0];
  
  for (let i = 1; i < data.length; i++) {
    ema = (data[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

/**
 * Calculate rolling average with time-based weighting
 */
export function calculateTimeWeightedAverage(
  historicalData: IHistoricalData[],
  windowMinutes: number
): number {
  if (historicalData.length === 0) return 0;
  
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000);
  
  const filteredData = historicalData.filter(
    (item) => item.timestamp >= windowStart
  );
  
  if (filteredData.length === 0) {
    return calculateSimpleMovingAverage(
      historicalData.map((d) => d.occupancyPercentage),
      Math.min(5, historicalData.length)
    );
  }
  
  let weightedSum = 0;
  let weightSum = 0;
  
  for (const item of filteredData) {
    const timeDiff = now.getTime() - item.timestamp.getTime();
    const minutesDiff = timeDiff / (60 * 1000);
    const weight = Math.max(0.1, 1 - minutesDiff / windowMinutes);
    
    weightedSum += item.occupancyPercentage * weight;
    weightSum += weight;
  }
  
  return weightedSum / weightSum;
}

/**
 * Predict next value using moving average
 */
export function predictNextMovingAverage(
  historicalData: IHistoricalData[],
  period: number,
  windowMinutes: number
): number {
  const values = historicalData.map((d) => d.occupancyPercentage);
  
  const sma = calculateSimpleMovingAverage(values, period);
  const wma = calculateWeightedMovingAverage(values, period);
  const twa = calculateTimeWeightedAverage(historicalData, windowMinutes);
  
  // Combine multiple moving averages for better prediction
  return (sma * 0.3 + wma * 0.4 + twa * 0.3);
}
