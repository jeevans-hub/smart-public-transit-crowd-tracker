import { IHistoricalData, IPredictionAlert } from '@/types/prediction';

/**
 * Detect anomalies in historical data
 */
export function detectAnomalies(historicalData: IHistoricalData[]): IPredictionAlert[] {
  const alerts: IPredictionAlert[] = [];
  
  if (historicalData.length < 3) return alerts;
  
  const values = historicalData.map((d) => d.occupancyPercentage);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );
  
  // Detect sudden spikes
  const spikeAlerts = detectSuddenSpikes(historicalData, mean, stdDev);
  alerts.push(...spikeAlerts);
  
  // Detect sudden drops
  const dropAlerts = detectSuddenDrops(historicalData, mean, stdDev);
  alerts.push(...dropAlerts);
  
  // Detect station overload
  const overloadAlerts = detectStationOverload(historicalData);
  alerts.push(...overloadAlerts);
  
  // Detect unusual patterns
  const patternAlerts = detectUnusualPatterns(historicalData);
  alerts.push(...patternAlerts);
  
  return alerts;
}

/**
 * Detect sudden crowd spikes
 */
function detectSuddenSpikes(
  historicalData: IHistoricalData[],
  mean: number,
  stdDev: number
): IPredictionAlert[] {
  const alerts: IPredictionAlert[] = [];
  const threshold = mean + 2 * stdDev;
  
  for (let i = 1; i < historicalData.length; i++) {
    const current = historicalData[i].occupancyPercentage;
    const previous = historicalData[i - 1].occupancyPercentage;
    const increase = current - previous;
    
    // Spike if value is 2 std deviations above mean OR sudden increase > 30%
    if (current > threshold || increase > 30) {
      alerts.push({
        id: `spike-${i}-${Date.now()}`,
        stationId: historicalData[i].timestamp.getTime().toString(),
        stationName: 'Unknown',
        type: 'ANOMALY_DETECTED',
        message: `Sudden crowd spike detected: ${current.toFixed(1)}% (increase of ${increase.toFixed(1)}%)`,
        severity: current > 90 ? 'CRITICAL' : 'WARNING',
        timestamp: historicalData[i].timestamp,
      });
    }
  }
  
  return alerts;
}

/**
 * Detect sudden passenger drops
 */
function detectSuddenDrops(
  historicalData: IHistoricalData[],
  mean: number,
  stdDev: number
): IPredictionAlert[] {
  const alerts: IPredictionAlert[] = [];
  const threshold = mean - 2 * stdDev;
  
  for (let i = 1; i < historicalData.length; i++) {
    const current = historicalData[i].occupancyPercentage;
    const previous = historicalData[i - 1].occupancyPercentage;
    const decrease = previous - current;
    
    // Drop if value is 2 std deviations below mean OR sudden decrease > 30%
    if (current < threshold || decrease > 30) {
      alerts.push({
        id: `drop-${i}-${Date.now()}`,
        stationId: historicalData[i].timestamp.getTime().toString(),
        stationName: 'Unknown',
        type: 'ANOMALY_DETECTED',
        message: `Sudden passenger drop detected: ${current.toFixed(1)}% (decrease of ${decrease.toFixed(1)}%)`,
        severity: 'WARNING',
        timestamp: historicalData[i].timestamp,
      });
    }
  }
  
  return alerts;
}

/**
 * Detect station overload
 */
function detectStationOverload(historicalData: IHistoricalData[]): IPredictionAlert[] {
  const alerts: IPredictionAlert[] = [];
  
  for (let i = 0; i < historicalData.length; i++) {
    const current = historicalData[i].occupancyPercentage;
    
    if (current >= 95) {
      alerts.push({
        id: `overload-${i}-${Date.now()}`,
        stationId: historicalData[i].timestamp.getTime().toString(),
        stationName: 'Unknown',
        type: 'HIGH_PREDICTION',
        message: `Station overload detected: ${current.toFixed(1)}% occupancy`,
        severity: 'CRITICAL',
        timestamp: historicalData[i].timestamp,
      });
    } else if (current >= 85) {
      alerts.push({
        id: `high-load-${i}-${Date.now()}`,
        stationId: historicalData[i].timestamp.getTime().toString(),
        stationName: 'Unknown',
        type: 'HIGH_PREDICTION',
        message: `High station load: ${current.toFixed(1)}% occupancy`,
        severity: 'WARNING',
        timestamp: historicalData[i].timestamp,
      });
    }
  }
  
  return alerts;
}

/**
 * Detect unusual patterns (weekend, holiday, special events)
 */
function detectUnusualPatterns(historicalData: IHistoricalData[]): IPredictionAlert[] {
  const alerts: IPredictionAlert[] = [];
  
  if (historicalData.length < 7) return alerts;
  
  // Check for weekend patterns
  const weekendData = historicalData.filter((d) => {
    const day = d.timestamp.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  });
  
  const weekdayData = historicalData.filter((d) => {
    const day = d.timestamp.getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  });
  
  if (weekendData.length > 0 && weekdayData.length > 0) {
    const weekendAvg = weekendData.reduce((sum, d) => sum + d.occupancyPercentage, 0) / weekendData.length;
    const weekdayAvg = weekdayData.reduce((sum, d) => sum + d.occupancyPercentage, 0) / weekdayData.length;
    
    const diff = Math.abs(weekendAvg - weekdayAvg);
    
    if (diff > 30) {
      alerts.push({
        id: `weekend-pattern-${Date.now()}`,
        stationId: historicalData[0].timestamp.getTime().toString(),
        stationName: 'Unknown',
        type: 'ANOMALY_DETECTED',
        message: `Significant weekend pattern detected: ${weekendAvg.toFixed(1)}% vs weekday ${weekdayAvg.toFixed(1)}%`,
        severity: 'INFO',
        timestamp: new Date(),
      });
    }
  }
  
  // Check for unusual time patterns (late night, early morning)
  const lateNightData = historicalData.filter((d) => {
    const hour = d.timestamp.getHours();
    return hour >= 23 || hour <= 5;
  });
  
  if (lateNightData.length > 0) {
    const lateNightAvg = lateNightData.reduce((sum, d) => sum + d.occupancyPercentage, 0) / lateNightData.length;
    
    if (lateNightAvg > 40) {
      alerts.push({
        id: `late-night-${Date.now()}`,
        stationId: historicalData[0].timestamp.getTime().toString(),
        stationName: 'Unknown',
        type: 'ANOMALY_DETECTED',
        message: `Unusual late-night activity: ${lateNightAvg.toFixed(1)}% average occupancy`,
        severity: 'INFO',
        timestamp: new Date(),
      });
    }
  }
  
  return alerts;
}

/**
 * Calculate anomaly score for a single data point
 */
export function calculateAnomalyScore(
  value: number,
  historicalData: IHistoricalData[]
): number {
  if (historicalData.length < 3) return 0;
  
  const values = historicalData.map((d) => d.occupancyPercentage);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(
    values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  );
  
  if (stdDev === 0) return 0;
  
  const zScore = Math.abs((value - mean) / stdDev);
  
  // Convert z-score to anomaly score (0-100)
  return Math.min(100, zScore * 20);
}

/**
 * Check if current trend is anomalous
 */
export function isTrendAnomalous(historicalData: IHistoricalData[]): boolean {
  if (historicalData.length < 5) return false;
  
  const values = historicalData.map((d) => d.occupancyPercentage);
  
  // Calculate rate of change
  const changes = [];
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1]);
  }
  
  const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
  const lastChange = changes[changes.length - 1];
  
  // If last change is more than 3x the average change, it's anomalous
  return Math.abs(lastChange) > Math.abs(avgChange) * 3;
}
