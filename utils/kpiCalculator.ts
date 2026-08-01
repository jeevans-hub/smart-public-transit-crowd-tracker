import { ICrowdReportDocument } from '@/types/crowd';
import { ILiveVehicleDocument } from '@/types/vehicle';
import { IPredictionDocument } from '@/types/prediction';
import { KPIMetrics } from '@/types/analytics';
import { calculateMean, calculateMax, calculateMin } from './statistics';

/**
 * Calculate KPI metrics from crowd reports, vehicles, and predictions
 */
export function calculateKPIMetrics(
  crowdReports: ICrowdReportDocument[],
  vehicles: ILiveVehicleDocument[],
  predictions: IPredictionDocument[]
): KPIMetrics {
  const totalStations = new Set(crowdReports.map(r => r.stationId)).size;
  const totalVehicles = vehicles.length;
  
  // Calculate passenger counts
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayReports = crowdReports.filter(r => r.createdAt >= today);
  const passengersToday = todayReports.reduce((sum, r) => sum + r.passengerCount, 0);
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekReports = crowdReports.filter(r => r.createdAt >= weekAgo);
  const passengersThisWeek = weekReports.reduce((sum, r) => sum + r.passengerCount, 0);
  
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const monthReports = crowdReports.filter(r => r.createdAt >= monthAgo);
  const passengersThisMonth = monthReports.reduce((sum, r) => sum + r.passengerCount, 0);
  
  // Calculate average crowd
  const occupancies = crowdReports.map(r => r.occupancyPercentage);
  const averageCrowd = calculateMean(occupancies);
  
  // Calculate prediction accuracy
  const predictionAccuracies = predictions.map(p => {
    const actual = crowdReports.find(r => 
      r.stationId === p.stationId && 
      Math.abs(r.createdAt.getTime() - p.generatedAt.getTime()) < 3600000
    );
    if (!actual) return 0;
    const error = Math.abs(p.predictedCrowd - actual.occupancyPercentage);
    return Math.max(0, 100 - error);
  });
  const averagePredictionAccuracy = calculateMean(predictionAccuracies);
  
  // Calculate critical alerts (high risk predictions)
  const criticalAlerts = predictions.filter(p => p.risk === 'CRITICAL').length;
  
  // Calculate average vehicle speed
  const speeds = vehicles.map(v => v.speed);
  const averageVehicleSpeed = calculateMean(speeds);
  
  // Calculate average occupancy from vehicles
  const vehicleOccupancies = vehicles.map(v => (v.currentPassengers / v.capacity) * 100);
  const averageOccupancy = calculateMean(vehicleOccupancies);
  
  // Calculate average delay (vehicles with DELAYED status)
  const delayedVehicles = vehicles.filter(v => v.status === 'DELAYED');
  const averageDelay = delayedVehicles.length > 0 ? 15 : 0; // Placeholder - would need actual delay data
  
  // Calculate system availability (vehicles not offline)
  const onlineVehicles = vehicles.filter(v => v.status !== 'OFFLINE').length;
  const systemAvailability = totalVehicles > 0 ? (onlineVehicles / totalVehicles) * 100 : 100;
  
  return {
    totalStations,
    totalVehicles,
    passengersToday,
    passengersThisWeek,
    passengersThisMonth,
    averageCrowd,
    averagePredictionAccuracy,
    criticalAlerts,
    averageVehicleSpeed,
    averageOccupancy,
    averageDelay,
    systemAvailability,
  };
}

/**
 * Calculate occupancy statistics
 */
export function calculateOccupancyStatistics(reports: ICrowdReportDocument[]): {
  average: number;
  maximum: number;
  minimum: number;
  median: number;
  stdDev: number;
} {
  const occupancies = reports.map(r => r.occupancyPercentage);
  
  return {
    average: calculateMean(occupancies),
    maximum: calculateMax(occupancies),
    minimum: calculateMin(occupancies),
    median: calculateMedian(occupancies),
    stdDev: calculateStandardDeviation(occupancies),
  };
}

/**
 * Calculate peak hour from reports
 */
export function calculatePeakHour(reports: ICrowdReportDocument[]): {
  hour: number;
  averageOccupancy: number;
  passengerCount: number;
} {
  const hourlyData: Record<number, { occupancy: number[]; passengers: number }> = {};
  
  reports.forEach(report => {
    const hour = report.createdAt.getHours();
    if (!hourlyData[hour]) {
      hourlyData[hour] = { occupancy: [], passengers: 0 };
    }
    hourlyData[hour].occupancy.push(report.occupancyPercentage);
    hourlyData[hour].passengers += report.passengerCount;
  });
  
  let peakHour = 0;
  let maxOccupancy = 0;
  let maxPassengers = 0;
  
  Object.entries(hourlyData).forEach(([hour, data]) => {
    const avgOccupancy = calculateMean(data.occupancy);
    if (avgOccupancy > maxOccupancy) {
      maxOccupancy = avgOccupancy;
      peakHour = parseInt(hour);
      maxPassengers = data.passengers;
    }
  });
  
  return {
    hour: peakHour,
    averageOccupancy: maxOccupancy,
    passengerCount: maxPassengers,
  };
}

/**
 * Calculate peak day from reports
 */
export function calculatePeakDay(reports: ICrowdReportDocument[]): {
  day: string;
  averageOccupancy: number;
  passengerCount: number;
} {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dailyData: Record<number, { occupancy: number[]; passengers: number }> = {};
  
  reports.forEach(report => {
    const day = report.createdAt.getDay();
    if (!dailyData[day]) {
      dailyData[day] = { occupancy: [], passengers: 0 };
    }
    dailyData[day].occupancy.push(report.occupancyPercentage);
    dailyData[day].passengers += report.passengerCount;
  });
  
  let peakDay = 0;
  let maxOccupancy = 0;
  let maxPassengers = 0;
  
  Object.entries(dailyData).forEach(([day, data]) => {
    const avgOccupancy = calculateMean(data.occupancy);
    if (avgOccupancy > maxOccupancy) {
      maxOccupancy = avgOccupancy;
      peakDay = parseInt(day);
      maxPassengers = data.passengers;
    }
  });
  
  return {
    day: dayNames[peakDay],
    averageOccupancy: maxOccupancy,
    passengerCount: maxPassengers,
  };
}

/**
 * Calculate route efficiency
 */
export function calculateRouteEfficiency(
  routeId: string,
  reports: ICrowdReportDocument[],
  vehicles: ILiveVehicleDocument[]
): number {
  const routeReports = reports.filter(r => r.routeId === routeId);
  const routeVehicles = vehicles.filter(v => v.route === routeId);
  
  if (routeReports.length === 0 || routeVehicles.length === 0) return 0;
  
  const avgOccupancy = calculateMean(routeReports.map(r => r.occupancyPercentage));
  const avgSpeed = calculateMean(routeVehicles.map(v => v.speed));
  const onTimeRate = routeVehicles.filter(v => v.status !== 'DELAYED').length / routeVehicles.length;
  
  // Efficiency combines occupancy, speed, and on-time rate
  return (avgOccupancy * 0.4 + avgSpeed * 0.3 + onTimeRate * 100 * 0.3) / 100;
}

/**
 * Calculate vehicle utilization rate
 */
export function calculateVehicleUtilization(vehicle: ILiveVehicleDocument, reports: ICrowdReportDocument[]): number {
  const vehicleReports = reports.filter(r => r.vehicleId === vehicle.vehicleId);
  
  if (vehicleReports.length === 0) return 0;
  
  const avgOccupancy = calculateMean(vehicleReports.map(r => r.occupancyPercentage));
  const utilization = (vehicle.currentPassengers / vehicle.capacity) * 100;
  
  return (avgOccupancy + utilization) / 2;
}

/**
 * Calculate capacity utilization
 */
export function calculateCapacityUtilization(reports: ICrowdReportDocument[]): number {
  if (reports.length === 0) return 0;
  
  const totalCapacity = reports.reduce((sum, r) => sum + r.vehicleCapacity, 0);
  const totalPassengers = reports.reduce((sum, r) => sum + r.passengerCount, 0);
  
  return totalCapacity > 0 ? (totalPassengers / totalCapacity) * 100 : 0;
}

/**
 * Calculate station ranking based on occupancy
 */
export function calculateStationRanking(reports: ICrowdReportDocument[]): Array<{
  stationId: string;
  averageOccupancy: number;
  reportCount: number;
  rank: number;
}> {
  const stationData: Record<string, { occupancy: number[]; count: number }> = {};
  
  reports.forEach(report => {
    if (!stationData[report.stationId]) {
      stationData[report.stationId] = { occupancy: [], count: 0 };
    }
    stationData[report.stationId].occupancy.push(report.occupancyPercentage);
    stationData[report.stationId].count++;
  });
  
  const rankings = Object.entries(stationData)
    .map(([stationId, data]) => ({
      stationId,
      averageOccupancy: calculateMean(data.occupancy),
      reportCount: data.count,
      rank: 0,
    }))
    .sort((a, b) => b.averageOccupancy - a.averageOccupancy);
  
  rankings.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  return rankings;
}

/**
 * Calculate route ranking based on efficiency
 */
export function calculateRouteRanking(
  reports: ICrowdReportDocument[],
  vehicles: ILiveVehicleDocument[]
): Array<{
  routeId: string;
  efficiency: number;
  averageOccupancy: number;
  vehicleCount: number;
  rank: number;
}> {
  const routeData: Record<string, { reports: ICrowdReportDocument[]; vehicles: ILiveVehicleDocument[] }> = {};
  
  reports.forEach(report => {
    if (!routeData[report.routeId]) {
      routeData[report.routeId] = { reports: [], vehicles: [] };
    }
    routeData[report.routeId].reports.push(report);
  });
  
  vehicles.forEach(vehicle => {
    if (!routeData[vehicle.route]) {
      routeData[vehicle.route] = { reports: [], vehicles: [] };
    }
    routeData[vehicle.route].vehicles.push(vehicle);
  });
  
  const rankings = Object.entries(routeData)
    .map(([routeId, data]) => ({
      routeId,
      efficiency: calculateRouteEfficiency(routeId, data.reports, data.vehicles),
      averageOccupancy: calculateMean(data.reports.map(r => r.occupancyPercentage)),
      vehicleCount: data.vehicles.length,
      rank: 0,
    }))
    .sort((a, b) => b.efficiency - a.efficiency);
  
  rankings.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  return rankings;
}

// Helper functions
function calculateMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return Math.sqrt(calculateMean(squaredDiffs));
}
