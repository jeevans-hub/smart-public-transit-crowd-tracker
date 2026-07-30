import { IHistoricalData } from '@/types/prediction';

interface PeakHour {
  hour: number;
  averageOccupancy: number;
  count: number;
}

/**
 * Detect peak hours from historical data
 */
export function detectPeakHours(historicalData: IHistoricalData[]): PeakHour[] {
  if (historicalData.length === 0) return [];
  
  // Group data by hour of day
  const hourlyData: { [hour: number]: number[] } = {};
  
  for (const data of historicalData) {
    const hour = data.timestamp.getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = [];
    }
    hourlyData[hour].push(data.occupancyPercentage);
  }
  
  // Calculate average occupancy for each hour
  const peakHours: PeakHour[] = [];
  for (const hour in hourlyData) {
    const values = hourlyData[hour];
    const average = values.reduce((a, b) => a + b, 0) / values.length;
    peakHours.push({
      hour: parseInt(hour),
      averageOccupancy: average,
      count: values.length,
    });
  }
  
  // Sort by average occupancy (descending)
  peakHours.sort((a, b) => b.averageOccupancy - a.averageOccupancy);
  
  return peakHours;
}

/**
 * Get current peak hour status
 */
export function getCurrentPeakHourStatus(
  historicalData: IHistoricalData[],
  currentHour?: number
): { isPeakHour: boolean; peakLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'; nextPeakHour?: number } {
  const hour = currentHour ?? new Date().getHours();
  const peakHours = detectPeakHours(historicalData);
  
  if (peakHours.length === 0) {
    return { isPeakHour: false, peakLevel: 'LOW' };
  }
  
  const currentHourData = peakHours.find((ph) => ph.hour === hour);
  
  if (!currentHourData) {
    // Find next peak hour
    const nextPeak = peakHours.find((ph) => ph.hour > hour);
    return {
      isPeakHour: false,
      peakLevel: 'LOW',
      nextPeakHour: nextPeak?.hour,
    };
  }
  
  const overallAverage = peakHours.reduce((sum, ph) => sum + ph.averageOccupancy, 0) / peakHours.length;
  const deviation = currentHourData.averageOccupancy - overallAverage;
  
  let peakLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' = 'LOW';
  
  if (deviation > 30) {
    peakLevel = 'EXTREME';
  } else if (deviation > 20) {
    peakLevel = 'HIGH';
  } else if (deviation > 10) {
    peakLevel = 'MEDIUM';
  }
  
  return {
    isPeakHour: deviation > 10,
    peakLevel,
    nextPeakHour: peakHours.find((ph) => ph.hour > hour)?.hour,
  };
}

/**
 * Predict if a future time will be a peak hour
 */
export function predictPeakHour(
  historicalData: IHistoricalData[],
  futureMinutes: number
): { isPeakHour: boolean; expectedOccupancy: number } {
  const futureTime = new Date(Date.now() + futureMinutes * 60 * 1000);
  const futureHour = futureTime.getHours();
  
  const peakHours = detectPeakHours(historicalData);
  const hourData = peakHours.find((ph) => ph.hour === futureHour);
  
  if (!hourData) {
    // If no data for this hour, use nearest hour
    const nearestHour = peakHours.reduce((nearest, ph) => {
      const currentDiff = Math.abs(ph.hour - futureHour);
      const nearestDiff = Math.abs(nearest.hour - futureHour);
      return currentDiff < nearestDiff ? ph : nearest;
    }, peakHours[0]);
    
    return {
      isPeakHour: false,
      expectedOccupancy: nearestHour?.averageOccupancy ?? 50,
    };
  }
  
  const overallAverage = peakHours.reduce((sum, ph) => sum + ph.averageOccupancy, 0) / peakHours.length;
  const isPeakHour = hourData.averageOccupancy > overallAverage + 10;
  
  return {
    isPeakHour,
    expectedOccupancy: hourData.averageOccupancy,
  };
}

/**
 * Get rush hour periods
 */
export function getRushHours(historicalData: IHistoricalData[]): { morning: number[]; evening: number[] } {
  const peakHours = detectPeakHours(historicalData);
  
  if (peakHours.length < 2) {
    return { morning: [], evening: [] };
  }
  
  // Split into morning (6-12) and evening (16-22)
  const morningPeaks = peakHours
    .filter((ph) => ph.hour >= 6 && ph.hour <= 12)
    .slice(0, 3);
  const eveningPeaks = peakHours
    .filter((ph) => ph.hour >= 16 && ph.hour <= 22)
    .slice(0, 3);
  
  return {
    morning: morningPeaks.map((ph) => ph.hour),
    evening: eveningPeaks.map((ph) => ph.hour),
  };
}

/**
 * Adjust prediction based on peak hour
 */
export function adjustForPeakHour(
  prediction: number,
  historicalData: IHistoricalData[],
  futureMinutes: number
): number {
  const peakPrediction = predictPeakHour(historicalData, futureMinutes);
  
  if (!peakPrediction.isPeakHour) {
    return prediction;
  }
  
  // Increase prediction during peak hours
  const adjustmentFactor = 1.1; // 10% increase during peak hours
  const adjustedPrediction = prediction * adjustmentFactor;
  
  return Math.min(100, adjustedPrediction);
}

/**
 * Detect day of week patterns
 */
export function detectDayOfWeekPatterns(historicalData: IHistoricalData[]): {
  weekday: number;
  weekend: number;
  pattern: 'WEEKDAY_HEAVY' | 'WEEKEND_HEAVY' | 'BALANCED';
} {
  const weekdayData = historicalData.filter((d) => {
    const day = d.timestamp.getDay();
    return day >= 1 && day <= 5;
  });
  
  const weekendData = historicalData.filter((d) => {
    const day = d.timestamp.getDay();
    return day === 0 || day === 6;
  });
  
  const weekdayAvg = weekdayData.length > 0
    ? weekdayData.reduce((sum, d) => sum + d.occupancyPercentage, 0) / weekdayData.length
    : 0;
  
  const weekendAvg = weekendData.length > 0
    ? weekendData.reduce((sum, d) => sum + d.occupancyPercentage, 0) / weekendData.length
    : 0;
  
  let pattern: 'WEEKDAY_HEAVY' | 'WEEKEND_HEAVY' | 'BALANCED' = 'BALANCED';
  
  if (weekdayAvg > weekendAvg + 15) {
    pattern = 'WEEKDAY_HEAVY';
  } else if (weekendAvg > weekdayAvg + 15) {
    pattern = 'WEEKEND_HEAVY';
  }
  
  return {
    weekday: weekdayAvg,
    weekend: weekendAvg,
    pattern,
  };
}
